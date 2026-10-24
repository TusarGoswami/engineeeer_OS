import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['academics', 'career', 'mentorship', 'gate', 'projects'],
      default: 'academics',
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    upvoteCount: {
      type: Number,
      default: 0,
      index: true,
    },
    repliesCount: {
      type: Number,
      default: 0,
    },
    isAskSenior: {
      type: Boolean,
      default: false,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    acceptedReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityReply',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes matching docs/INDEXES.md
communityPostSchema.index({ category: 1, isAskSenior: 1, createdAt: -1 });
communityPostSchema.index({ title: 'text', content: 'text' });

export const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
