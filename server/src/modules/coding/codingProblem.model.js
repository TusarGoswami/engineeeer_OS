import mongoose from 'mongoose';

const sampleTestCaseSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    statementMarkdown: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    constraints: {
      timeLimitMs: { type: Number, default: 2000 },
      memoryLimitKb: { type: Number, default: 256000 },
      customNotes: { type: String, default: '' },
    },
    starterCode: {
      cpp: {
        type: String,
        default:
          '// Write your C++ solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}',
      },
      java: {
        type: String,
        default:
          '// Write your Java solution here\nimport java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n    }\n}',
      },
      python: {
        type: String,
        default:
          '# Write your Python solution here\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()',
      },
      javascript: {
        type: String,
        default:
          '// Write your JavaScript solution here\nconst fs = require("fs");\n\nfunction main() {\n}\nmain();',
      },
    },
    sampleTestCases: [sampleTestCaseSchema],
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
codingProblemSchema.index({ difficulty: 1, tags: 1, isPublished: 1 });
codingProblemSchema.index({ title: 'text', statementMarkdown: 'text' });

export const CodingProblem = mongoose.model('CodingProblem', codingProblemSchema);
export default CodingProblem;
