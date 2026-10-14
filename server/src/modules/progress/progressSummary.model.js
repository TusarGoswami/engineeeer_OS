import mongoose from 'mongoose';

const progressSummarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    academicsStats: {
      totalTopics: { type: Number, default: 0 },
      completedTopics: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
      subjectsInProgress: { type: Number, default: 0 },
    },
    codingStats: {
      solvedCount: { type: Number, default: 0 },
      easyCount: { type: Number, default: 0 },
      mediumCount: { type: Number, default: 0 },
      hardCount: { type: Number, default: 0 },
      totalSubmissions: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      accuracyRate: { type: Number, default: 0 },
      topicCoverage: { type: [String], default: [] },
      streak: { type: Number, default: 0 },
    },
    gateStats: {
      testsAttempted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      questionsAttempted: { type: Number, default: 0 },
      accuracyRate: { type: Number, default: 0 },
      weakTopics: { type: [String], default: [] },
    },
    assessmentStats: {
      totalAttempted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      upcomingScheduled: { type: Number, default: 0 },
    },
    interviewStats: {
      sessionsCompleted: { type: Number, default: 0 },
      averageReadinessScore: { type: Number, default: 0 },
    },
    overallStreak: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: String, // YYYY-MM-DD
      default: '',
    },
    recentActivities: [
      {
        module: String,
        action: String,
        title: String,
        occurredAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const ProgressSummary = mongoose.model('ProgressSummary', progressSummarySchema);
export default ProgressSummary;
