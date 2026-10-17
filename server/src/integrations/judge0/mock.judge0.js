import { IJudge0Adapter, JUDGE0_STATUS } from './judge0.interface.js';

export class MockJudge0Adapter extends IJudge0Adapter {
  /**
   * Mock execution of a single test case
   */
  async execute({ sourceCode, stdin, expectedOutput }) {
    // Check for deliberate simulation tags in tests
    if (sourceCode && sourceCode.includes('TRIGGER_COMPILE_ERROR')) {
      return {
        status: { id: JUDGE0_STATUS.COMPILATION_ERROR, description: 'Compilation Error' },
        stdout: null,
        stderr: null,
        compileOutput: 'syntax error: unexpected token near line 4',
        time: 0.01,
        memory: 1024,
      };
    }

    if (sourceCode && sourceCode.includes('TRIGGER_RUNTIME_ERROR')) {
      return {
        status: { id: JUDGE0_STATUS.RUNTIME_ERROR_NZEC, description: 'Runtime Error (NZEC)' },
        stdout: null,
        stderr: 'IndexOutOfBoundsException: index 5 out of bounds for length 3',
        compileOutput: null,
        time: 0.05,
        memory: 1420,
      };
    }

    if (sourceCode && sourceCode.includes('TRIGGER_TLE')) {
      return {
        status: { id: JUDGE0_STATUS.TIME_LIMIT_EXCEEDED, description: 'Time Limit Exceeded' },
        stdout: null,
        stderr: null,
        compileOutput: null,
        time: 2.05,
        memory: 2048,
      };
    }

    if (sourceCode && sourceCode.includes('TRIGGER_WRONG_ANSWER')) {
      return {
        status: { id: JUDGE0_STATUS.WRONG_ANSWER, description: 'Wrong Answer' },
        stdout: 'WRONG_MOCK_OUTPUT',
        stderr: null,
        compileOutput: null,
        time: 0.03,
        memory: 1200,
      };
    }

    // Default mock behavior: produces expected output or matches stdin
    const trimmedExpected = (expectedOutput || '').trim();
    const mockOutput = trimmedExpected || (stdin ? `MockResult: ${stdin.trim()}` : '0\n');

    return {
      status: { id: JUDGE0_STATUS.ACCEPTED, description: 'Accepted' },
      stdout: mockOutput,
      stderr: null,
      compileOutput: null,
      time: 0.042,
      memory: 1450,
    };
  }

  /**
   * Mock execution of batch test cases
   */
  async executeBatch(submissions) {
    const results = [];
    for (const sub of submissions) {
      const res = await this.execute(sub);
      results.push(res);
    }
    return results;
  }
}

export default MockJudge0Adapter;
