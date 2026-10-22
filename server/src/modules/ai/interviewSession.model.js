import mongoose from 'mongoose';

const interviewTurnSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['interviewer', 'candidate'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const rubricEvaluationSchema = new mongoose.Schema(
  {
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    readinessLevel: { type: String, default: '' },
    rubricScores: {
      technicalCorrectness: { type: Number, min: 0, max: 10, default: 0 },
      relevanceAndDepth: { type: Number, min: 0, max: 10, default: 0 },
      clarityAndCommunication: { type: Number, min: 0, max: 10, default: 0 },
      problemSolving: { type: Number, min: 0, max: 10, default: 0 },
    },
    strengths: { type: [String], default: [] },
    areasForImprovement: { type: [String], default: [] },
    recommendedTopics: { type: [String], default: [] },
    feedbackSummary: { type: String, default: '' },
    evaluatedAt: { type: Date, default: null },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['technical', 'dsa', 'hr', 'project'],
      required: true,
      default: 'technical',
      index: true,
    },
    targetRole: {
      type: String,
      default: 'Software Development Engineer (SDE-1)',
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'evaluated'],
      default: 'in_progress',
      index: true,
    },
    turns: [interviewTurnSchema],
    evaluation: {
      type: rubricEvaluationSchema,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

export const InterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);
export default InterviewSession;
