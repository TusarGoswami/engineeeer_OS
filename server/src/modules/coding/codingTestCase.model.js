import mongoose from 'mongoose';

const codingTestCaseSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
    isHidden: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

codingTestCaseSchema.index({ problemId: 1, isHidden: 1 });

export const CodingTestCase = mongoose.model('CodingTestCase', codingTestCaseSchema);
export default CodingTestCase;
