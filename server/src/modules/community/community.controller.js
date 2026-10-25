import { CommunityService } from './community.service.js';

export class CommunityController {
  static async getPosts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        isAskSenior: req.query.isAskSenior,
        tag: req.query.tag,
        search: req.query.search,
      };
      const pagination = {
        limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
        cursor: req.query.cursor,
      };

      const result = await CommunityService.getPosts(filters, pagination);
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createPost(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { title, content, category, tags, isAskSenior } = req.body;

      const post = await CommunityService.createPost({
        authorId: userId,
        title,
        content,
        category,
        tags,
        isAskSenior,
      });

      res.status(201).json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  }

  static async getPostById(req, res, next) {
    try {
      const post = await CommunityService.getPostById(req.params.id);
      res.json({ success: true, data: post });
    } catch (err) {
      next(err);
    }
  }

  static async addReply(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const { content, parentReplyId } = req.body;

      const reply = await CommunityService.addReply({
        postId: req.params.id,
        authorId: userId,
        content,
        parentReplyId,
      });

      res.status(201).json({ success: true, data: reply });
    } catch (err) {
      next(err);
    }
  }

  static async upvotePost(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const result = await CommunityService.upvotePost({
        postId: req.params.id,
        userId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async upvoteReply(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const result = await CommunityService.upvoteReply({
        replyId: req.params.replyId,
        userId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  static async acceptReply(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const result = await CommunityService.acceptReply({
        postId: req.params.id,
        replyId: req.params.replyId,
        userId,
      });
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}

export default CommunityController;
