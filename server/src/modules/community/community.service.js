import { CommunityPost } from './communityPost.model.js';
import { CommunityReply } from './communityReply.model.js';
import { Notification } from '../notifications/notification.model.js';
import { ActivityService } from '../progress/activity.service.js';

export class CommunityService {
  /**
   * List community forum posts with filters and cursor pagination
   */
  static async getPosts(filters = {}, pagination = {}) {
    const { category, isAskSenior, tag, search } = filters;
    const { limit = 20, cursor } = pagination;

    const query = {};
    if (category) query.category = category;
    if (isAskSenior !== undefined && isAskSenior !== '') {
      query.isAskSenior = String(isAskSenior) === 'true';
    }
    if (tag) query.tags = tag;
    if (search) query.$text = { $search: search };
    if (cursor) query._id = { $lt: cursor };

    const items = await CommunityPost.find(query)
      .populate('authorId', 'name role isAlumni university branch profile')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : null;

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };
  }

  /**
   * Create a new forum post
   */
  static async createPost({ authorId, title, content, category, tags = [], isAskSenior = false }) {
    const post = await CommunityPost.create({
      authorId,
      title,
      content,
      category,
      tags,
      isAskSenior,
    });

    try {
      await ActivityService.record({
        userId: authorId,
        module: 'community',
        action: 'POST_CREATED',
        payload: { postId: post._id.toString(), category, isAskSenior },
      });
    } catch {
      // Ignore
    }

    return CommunityPost.findById(post._id)
      .populate('authorId', 'name role isAlumni university branch profile')
      .lean();
  }

  /**
   * Get post by ID along with its segregated replies
   */
  static async getPostById(postId) {
    const post = await CommunityPost.findById(postId)
      .populate('authorId', 'name role isAlumni university branch profile')
      .lean();

    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    // Fetch replies from segregated collection
    const replies = await CommunityReply.find({ postId })
      .populate('authorId', 'name role isAlumni university branch profile')
      .sort({ createdAt: 1 })
      .lean();

    return {
      ...post,
      replies,
    };
  }

  /**
   * Add reply to post
   */
  static async addReply({ postId, authorId, content, parentReplyId = null }) {
    const post = await CommunityPost.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const reply = await CommunityReply.create({
      postId,
      authorId,
      content,
      parentReplyId,
    });

    // Increment replies counter on post
    post.repliesCount += 1;
    await post.save();

    // Notify original post author if not replying to own post
    if (post.authorId.toString() !== authorId.toString()) {
      try {
        await Notification.create({
          userId: post.authorId,
          title: 'New Reply on Your Forum Post',
          message: `Someone replied to your post: "${post.title.slice(0, 30)}..."`,
          type: 'community',
          link: `/community/${post._id}`,
        });
      } catch {
        // Ignore
      }
    }

    try {
      await ActivityService.record({
        userId: authorId,
        module: 'community',
        action: 'REPLY_ADDED',
        payload: { postId, replyId: reply._id.toString() },
      });
    } catch {
      // Ignore
    }

    return CommunityReply.findById(reply._id)
      .populate('authorId', 'name role isAlumni university branch profile')
      .lean();
  }

  /**
   * Toggle upvote on post
   */
  static async upvotePost({ postId, userId }) {
    const post = await CommunityPost.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    const index = post.upvotes.findIndex(id => id.toString() === userId.toString());
    if (index > -1) {
      post.upvotes.splice(index, 1);
    } else {
      post.upvotes.push(userId);
    }

    post.upvoteCount = post.upvotes.length;
    await post.save();

    return {
      postId: post._id,
      upvoteCount: post.upvoteCount,
      hasUpvoted: index === -1,
    };
  }

  /**
   * Toggle upvote on reply
   */
  static async upvoteReply({ replyId, userId }) {
    const reply = await CommunityReply.findById(replyId);
    if (!reply) {
      const err = new Error('Reply not found');
      err.statusCode = 404;
      throw err;
    }

    const index = reply.upvotes.findIndex(id => id.toString() === userId.toString());
    if (index > -1) {
      reply.upvotes.splice(index, 1);
    } else {
      reply.upvotes.push(userId);
    }

    reply.upvoteCount = reply.upvotes.length;
    await reply.save();

    return {
      replyId: reply._id,
      upvoteCount: reply.upvoteCount,
      hasUpvoted: index === -1,
    };
  }

  /**
   * Post author marks accepted answer
   */
  static async acceptReply({ postId, replyId, userId }) {
    const post = await CommunityPost.findById(postId);
    if (!post) {
      const err = new Error('Post not found');
      err.statusCode = 404;
      throw err;
    }

    if (post.authorId.toString() !== userId.toString()) {
      const err = new Error('Only the post author can mark an accepted reply');
      err.statusCode = 403;
      throw err;
    }

    await CommunityReply.updateMany({ postId }, { $set: { isAccepted: false } });
    await CommunityReply.updateOne({ _id: replyId, postId }, { $set: { isAccepted: true } });

    post.isResolved = true;
    post.acceptedReplyId = replyId;
    await post.save();

    return {
      postId: post._id,
      acceptedReplyId: replyId,
      isResolved: true,
    };
  }
}

export default CommunityService;
