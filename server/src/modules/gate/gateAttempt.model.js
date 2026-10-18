import mongoose from 'mongoose';

const gateAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    selectedOptions: { type: [String], default: [] },
    natAnswer: { type: Number, default: null },
    isCorrect: { type: Boolean, default: false },
    marksAwarded: { type: Number, default: 0 },
    negativeDeducted: { type: Number, default: 0 },
  },
  { _id: false }
);

const gateAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GateTest',
      required: true,
      index: true,
    },
    answers: [gateAnswerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarksAvailable: {
      type: Number,
      default: 100,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    correctCount: {
      type: Number,
      default: 0,
    },
    incorrectCount: {
      type: Number,
      default: 0,
    },
    unattemptedCount: {
      type: Number,
      default: 0,
    },
    accuracyRate: {
      type: Number,
      default: 0,
    },
    timeTakenSeconds: {
      type: Number,
      default: 0,
    },
    topicBreakdown: [
      {
        topic: String,
        total: Number,
        correct: Number,
        accuracy: Number,
      },
    ],
    weakTopics: [String],
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index as documented in docs/INDEXES.md
gateAttemptSchema.index({ userId: 1, testId: 1, createdAt: -1 });

export const GateAttempt = mongoose.model('GateAttempt', gateAttemptSchema);
export default GateAttempt;
