import mongoose from 'mongoose';

const dailyActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    counts: {
      coding: { type: Number, default: 0 },
      gate: { type: Number, default: 0 },
      academic: { type: Number, default: 0 },
      interview: { type: Number, default: 0 },
      community: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring 1 document per user per day, optimized for range scans
dailyActivitySchema.index({ userId: 1, date: -1 }, { unique: true });

export const DailyActivity = mongoose.model('DailyActivity', dailyActivitySchema);
export default DailyActivity;

