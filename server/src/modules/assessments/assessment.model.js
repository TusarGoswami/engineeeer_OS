import mongoose from 'mongoose';

const assessmentQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    type: {
      type: String,
      enum: ['mcq', 'msq', 'nat'],
      required: true,
    },
    marks: { type: Number, default: 2 },
    options: [
      {
        id: { type: String, required: true },
        text: { type: String, required: true },
      },
    ],
    correctOptions: {
      type: [String],
      required: true,
      select: false, // Never expose during active exam
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
    topic: { type: String, default: 'General' },
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
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
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null,
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    totalMarks: {
      type: Number,
      default: 20,
    },
    scheduledStartTime: {
      type: Date,
      default: null,
    },
    scheduledEndTime: {
      type: Date,
      default: null,
    },
    questions: [assessmentQuestionSchema],
    rules: {
      fullScreenRequired: { type: Boolean, default: true },
      trackTabSwitches: { type: Boolean, default: true },
      allowResumption: { type: Boolean, default: true },
    },
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

assessmentSchema.index({ isPublished: 1, scheduledStartTime: 1 });

export const Assessment = mongoose.model('Assessment', assessmentSchema);
export default Assessment;
