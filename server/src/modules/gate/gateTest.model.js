import mongoose from 'mongoose';

const gateQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'msq', 'nat'], // Standard GATE question types
      required: true,
    },
    marks: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    negativeMarks: {
      type: Number,
      default: 0.33, // 1/3rd for 1-mark MCQ, 2/3rd for 2-mark MCQ, 0 for MSQ/NAT
    },
    options: [
      {
        id: { type: String, required: true }, // 'A', 'B', 'C', 'D'
        text: { type: String, required: true },
      },
    ],
    correctOptions: {
      type: [String], // e.g. ['A'] or ['A', 'C']
      required: true,
      select: false, // Never expose during active test!
    },
    natRange: {
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },
    explanation: {
      type: String,
      default: '',
      select: false,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
  },
  { _id: false }
);

const gateTestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    subject: {
      type: String,
      default: 'Computer Science and Information Technology',
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 180, // Standard 3-hour GATE test
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    totalQuestions: {
      type: Number,
      default: 65,
    },
    questions: [gateQuestionSchema],
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const GateTest = mongoose.model('GateTest', gateTestSchema);
export default GateTest;
