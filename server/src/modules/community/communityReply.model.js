import mongoose from 'mongoose';

const communityReplySchema = new mongoose.Schema(
  {
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityPost',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentReplyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CommunityReply',
      default: null,
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
    },
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

communityReplySchema.index({ postId: 1, createdAt: 1 });

export const CommunityReply = mongoose.model('CommunityReply', communityReplySchema);
export default CommunityReply;
