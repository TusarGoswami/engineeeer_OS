import mongoose from 'mongoose';

const codingSubmissionSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['cpp', 'java', 'python', 'javascript'],
      required: true,
    },
    status: {
      type: String,
      enum: [
        'queued',
        'running',
        'accepted',
        'wrong_answer',
        'tle',
        'runtime_error',
        'compile_error',
      ],
      default: 'queued',
      index: true,
    },
    runtimeMs: {
      type: Number,
      default: 0,
    },
    memoryKb: {
      type: Number,
      default: 0,
    },
    testCasesPassed: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    payloadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubmissionPayload',
      default: null,
    },
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

// Compound indexes as documented in docs/INDEXES.md
codingSubmissionSchema.index({ userId: 1, submittedAt: -1, _id: -1 });
codingSubmissionSchema.index({ problemId: 1, userId: 1, status: 1 });
codingSubmissionSchema.index({ problemId: 1, submittedAt: -1 });
codingSubmissionSchema.index({ status: 1, submittedAt: 1 });

export const CodingSubmission = mongoose.model('CodingSubmission', codingSubmissionSchema);
export default CodingSubmission;
