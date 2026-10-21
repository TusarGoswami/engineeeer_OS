import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    type: { type: String, default: '' },
    topic: { type: String, default: '' },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    citations: {
      type: [citationSchema],
      default: [],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const assistantConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    title: {
      type: String,
      default: 'Engineering Study Session',
      trim: true,
    },
    messages: [messageSchema],
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assistantConversationSchema.index({ userId: 1, updatedAt: -1 });

export const AssistantConversation = mongoose.model(
  'AssistantConversation',
  assistantConversationSchema
);
export default AssistantConversation;
