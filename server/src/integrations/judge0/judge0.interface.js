/**
 * Language ID mapping for Judge0
 */
export const JUDGE0_LANGUAGE_IDS = {
  cpp: 54, // C++ (GCC 9.2.0)
  java: 62, // Java (OpenJDK 13.0.1)
  python: 71, // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

/**
 * Judge0 Status Codes
 */
export const JUDGE0_STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT_EXCEEDED: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

export class IJudge0Adapter {
  async execute({
    _sourceCode,
    _language,
    _stdin,
    _expectedOutput,
    _timeLimitMs,
    _memoryLimitKb,
  } = {}) {
    throw new Error('execute() must be implemented by adapter');
  }

  async executeBatch(_submissions) {
    throw new Error('executeBatch() must be implemented by adapter');
  }
}

export default { JUDGE0_LANGUAGE_IDS, JUDGE0_STATUS, IJudge0Adapter };
