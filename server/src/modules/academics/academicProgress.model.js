import mongoose from 'mongoose';

const academicProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
      index: true,
    },
    completedTopicIds: {
      type: [String],
      default: [],
    },
    lastStudiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique compound index per student per subject
academicProgressSchema.index({ userId: 1, subjectId: 1 }, { unique: true });

export const AcademicProgress = mongoose.model('AcademicProgress', academicProgressSchema);
export default AcademicProgress;
