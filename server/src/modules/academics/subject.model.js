import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    topicId: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    estimatedHours: { type: Number, default: 2 },
  },
  { _id: false }
);

const subjectSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    university: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    branch: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      index: true,
    },
    credits: {
      type: Number,
      default: 4,
    },
    description: {
      type: String,
      default: '',
    },
    syllabusOutline: {
      type: String,
      default: '',
    },
    topics: [topicSchema],
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

// Compound indexes as specified in docs/INDEXES.md
subjectSchema.index({ university: 1, branch: 1, semester: 1, code: 1 }, { unique: true });
subjectSchema.index({ university: 1, branch: 1, semester: 1, isPublished: 1 });
subjectSchema.index({ name: 'text', code: 'text' });

export const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
