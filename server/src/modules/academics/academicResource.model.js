import mongoose from 'mongoose';

const academicResourceSchema = new mongoose.Schema(
  {
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      default: '',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['notes', 'syllabus', 'lecture', 'pyq', 'quiz'],
      required: true,
      index: true,
    },
    contentUrl: {
      type: String,
      default: '',
    },
    textContent: {
      type: String,
      default: '',
    },
    year: {
      type: Number, // For PYQs
      default: null,
    },
    author: {
      type: String,
      default: 'Faculty / Verified Senior',
    },
    tags: [String],
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
academicResourceSchema.index({ subjectId: 1, type: 1, isPublished: 1, createdAt: -1 });
academicResourceSchema.index({ title: 'text', textContent: 'text' });

export const AcademicResource = mongoose.model('AcademicResource', academicResourceSchema);
export default AcademicResource;
