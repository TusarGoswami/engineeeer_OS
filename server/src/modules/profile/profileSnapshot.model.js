import mongoose from 'mongoose';

const profileSnapshotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
    },
    identity: {
      name: { type: String, default: '' },
      username: { type: String, default: '' },
      university: { type: String, default: '' },
      branch: { type: String, default: '' },
      semester: { type: Number, default: 1 },
      graduationYear: { type: Number },
      headline: { type: String, default: '' },
      bio: { type: String, default: '' },
      role: { type: String, default: 'student' },
      company: { type: String, default: '' },
      avatarKey: { type: String, default: '' },
      avatarVersion: { type: Number, default: 1 },
    },
    stats: {
      coding: {
        solvedCount: { type: Number, default: 0 },
        easyCount: { type: Number, default: 0 },
        mediumCount: { type: Number, default: 0 },
        hardCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        ranking: { type: Number, default: 0 },
      },
      gate: {
        testsTaken: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        percentile: { type: Number, default: 0 },
        topSubject: { type: String, default: '' },
      },
      interviews: {
        completedCount: { type: Number, default: 0 },
        averageReadiness: { type: Number, default: 0 },
        level: { type: String, default: 'Intermediate' },
      },
      academics: {
        completionPercentage: { type: Number, default: 0 },
        currentSemester: { type: Number, default: 1 },
        activeSubjectsCount: { type: Number, default: 0 },
      },
      community: {
        postsCount: { type: Number, default: 0 },
        acceptedAnswersCount: { type: Number, default: 0 },
        helpfulVotesCount: { type: Number, default: 0 },
      },
      streaks: {
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 },
        totalActiveDays: { type: Number, default: 0 },
        lastActiveDate: { type: String, default: '' },
      },
    },
    topSkills: [
      {
        name: { type: String },
        category: { type: String },
        score: { type: Number },
        level: { type: String },
      },
    ],
    badges: [
      {
        badgeId: { type: String },
        name: { type: String },
        description: { type: String },
        icon: { type: String },
        tier: { type: String },
        category: { type: String },
        earnedAt: { type: Date },
      },
    ],
    recentActivity: [
      {
        date: { type: String },
        count: { type: Number },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    lastAggregatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

profileSnapshotSchema.index({ username: 1 });
profileSnapshotSchema.index({ 'identity.university': 1, 'stats.coding.solvedCount': -1 });

export const ProfileSnapshot = mongoose.model('ProfileSnapshot', profileSnapshotSchema);
export default ProfileSnapshot;
