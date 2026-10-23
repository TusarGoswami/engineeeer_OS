import mongoose from 'mongoose';

const studentAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptions: { type: [String], default: [] },
    natAnswer: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    submittedAt: {
      type: Date,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'expired'],
      default: 'in_progress',
      index: true,
    },
    isAutoSubmitted: {
      type: Boolean,
      default: false,
    },
    lastAutosavedAt: {
      type: Date,
      default: Date.now,
    },
    answers: [studentAnswerSchema],
    score: {
      type: Number,
      default: 0,
    },
    accuracyRate: {
      type: Number,
      default: 0,
    },
    reviewSignalsCount: {
      type: Number,
      default: 0,
    },
    isFlaggedForReview: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index as documented in docs/INDEXES.md
assessmentAttemptSchema.index({ userId: 1, assessmentId: 1, createdAt: -1 });

export const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
export default AssessmentAttempt;
