import mongoose from 'mongoose';

const monitoringEventSchema = new mongoose.Schema(
  {
    attemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['tab_hidden', 'window_blur', 'fullscreen_exit', 'paste', 'key_violation'],
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      expires: 30 * 24 * 60 * 60, // 30-day automatic retention policy per privacy specification
    },
  },
  {
    timestamps: true,
  }
);

export const MonitoringEvent = mongoose.model('MonitoringEvent', monitoringEventSchema);
export default MonitoringEvent;
