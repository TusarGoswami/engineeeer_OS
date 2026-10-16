import mongoose from 'mongoose';

const submissionPayloadSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingSubmission',
      required: true,
      unique: true,
      index: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    compileError: {
      type: String,
      default: null,
    },
    executionTrace: {
      type: mongoose.Schema.Types.Mixed,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const SubmissionPayload = mongoose.model('SubmissionPayload', submissionPayloadSchema);
export default SubmissionPayload;
