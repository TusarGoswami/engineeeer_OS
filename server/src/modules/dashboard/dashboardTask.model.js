import mongoose from 'mongoose';

const dashboardTaskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    taskId: {
      type: String,
      required: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    estimatedMinutes: {
      type: Number,
      default: 15,
    },
    module: {
      type: String,
      enum: ['coding', 'gate', 'academics', 'interviews', 'community'],
      required: true,
    },
    actionUrl: {
      type: String,
      default: '/',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'snoozed'],
      default: 'pending',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

dashboardTaskSchema.index({ userId: 1, taskId: 1, date: 1 }, { unique: true });
dashboardTaskSchema.index({ userId: 1, date: 1, status: 1 });

export const DashboardTask = mongoose.model('DashboardTask', dashboardTaskSchema);
export default DashboardTask;

