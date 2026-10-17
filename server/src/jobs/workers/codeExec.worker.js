import { CodingSubmission } from '../../modules/coding/codingSubmission.model.js';
import { CodingTestCase } from '../../modules/coding/codingTestCase.model.js';
import { SubmissionPayload } from '../../modules/coding/submissionPayload.model.js';
import { CodingProblem } from '../../modules/coding/codingProblem.model.js';
import { getJudge0Adapter } from '../../integrations/judge0/index.js';
import { ActivityService } from '../../modules/progress/activity.service.js';
import { JUDGE0_STATUS } from '../../integrations/judge0/judge0.interface.js';
import { logger } from '../../config/logger.js';

export class CodeExecWorkerService {
  /**
   * Process a single queued code submission job
   */
  static async processCodeSubmission(job) {
    const { submissionId } = job.data;
    const adapter = getJudge0Adapter();

    const submission = await CodingSubmission.findById(submissionId);
    if (!submission) {
      logger.error({ submissionId }, '[CodeExecWorker] Submission not found');
      return;
    }

    const payload = await SubmissionPayload.findOne({ submissionId });
    if (!payload) {
      logger.error({ submissionId }, '[CodeExecWorker] Payload not found');
      return;
    }

    try {
      // 1. Update status to 'running'
      submission.status = 'running';
      await submission.save();

      // 2. Fetch all test cases for this problem (including hidden test cases)
      const testCases = await CodingTestCase.find({ problemId: submission.problemId }).sort({
        order: 1,
      });
      submission.totalTestCases = testCases.length;

      let passedCount = 0;
      let totalRuntime = 0;
      let maxMemory = 0;
      let finalStatus = 'accepted';
      const traces = [];

      // 3. Execute test cases
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];

        const result = await adapter.execute({
          sourceCode: payload.sourceCode,
          language: submission.language,
          stdin: tc.input,
          expectedOutput: tc.expectedOutput,
        });

        totalRuntime += result.time || 0;
        maxMemory = Math.max(maxMemory, result.memory || 0);

        traces.push({
          testCaseIndex: i + 1,
          statusId: result.status?.id,
          statusDescription: result.status?.description,
          time: result.time,
          memory: result.memory,
          isHidden: tc.isHidden,
          // Only show actual vs expected if NOT hidden
          stdout: tc.isHidden ? null : result.stdout,
          expectedOutput: tc.isHidden ? null : tc.expectedOutput,
        });

        if (result.status?.id === JUDGE0_STATUS.COMPILATION_ERROR) {
          finalStatus = 'compile_error';
          payload.compileError = result.compileOutput || 'Compilation error';
          break;
        }

        if (
          result.status?.id === JUDGE0_STATUS.RUNTIME_ERROR_NZEC ||
          result.status?.id === JUDGE0_STATUS.RUNTIME_ERROR_SIGSEGV
        ) {
          finalStatus = 'runtime_error';
          break;
        }

        if (result.status?.id === JUDGE0_STATUS.TIME_LIMIT_EXCEEDED) {
          finalStatus = 'tle';
          break;
        }

        // Output comparison (trim trailing whitespace/newlines)
        const actual = (result.stdout || '').trim();
        const expected = (tc.expectedOutput || '').trim();

        if (actual === expected || result.status?.id === JUDGE0_STATUS.ACCEPTED) {
          passedCount++;
        } else {
          finalStatus = 'wrong_answer';
          break;
        }
      }

      // 4. Update Submission record
      submission.status = finalStatus;
      submission.testCasesPassed = passedCount;
      submission.runtimeMs = Math.round((totalRuntime / Math.max(passedCount || 1, 1)) * 1000);
      submission.memoryKb = maxMemory;
      await submission.save();

      // 5. Update SubmissionPayload with execution trace
      payload.executionTrace = traces;
      await payload.save();

      // 6. Emit Activity Events for Progress Tracking & Streak
      const isAccepted = finalStatus === 'accepted';
      const problem = await CodingProblem.findById(submission.problemId).lean();

      await ActivityService.record({
        userId: submission.userId,
        module: 'coding',
        action: isAccepted ? 'PROBLEM_SOLVED' : 'SUBMISSION_EVALUATED',
        payload: {
          submissionId: submission._id.toString(),
          problemId: submission.problemId.toString(),
          problemTitle: problem?.title || 'Algorithm Problem',
          difficulty: problem?.difficulty || 'medium',
          tag: problem?.tags?.[0] || 'Algorithms',
          isAccepted,
          language: submission.language,
        },
      });

      logger.info(
        { submissionId, finalStatus, passedCount, totalTestCases: testCases.length },
        '[CodeExecWorker] Submission evaluation completed'
      );

      return submission;
    } catch (err) {
      logger.error(
        { err: err.message, submissionId },
        '[CodeExecWorker] Error evaluating submission'
      );
      submission.status = 'runtime_error';
      await submission.save();
      throw err;
    }
  }
}

export default CodeExecWorkerService;
