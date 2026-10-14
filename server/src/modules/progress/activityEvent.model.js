import mongoose from 'mongoose';

const activityEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ['academics', 'coding', 'gate', 'assessments', 'interviews', 'community'],
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: { expires: '90d' }, // 90-day retention TTL index as specified
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Compound index for recent user activity stream
activityEventSchema.index({ userId: 1, occurredAt: -1 });

export const ActivityEvent = mongoose.model('ActivityEvent', activityEventSchema);
export default ActivityEvent;
