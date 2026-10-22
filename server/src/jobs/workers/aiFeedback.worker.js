import { Worker } from 'bullmq';
import { z } from 'zod';
import { InterviewSession } from '../../modules/ai/interviewSession.model.js';
import { getLLMAdapter } from '../../integrations/llm/index.js';
import { INTERVIEW_EVALUATOR_PROMPT } from '../../integrations/llm/prompts/interviewEvaluator.prompt.js';
import { ActivityService } from '../../modules/progress/activity.service.js';
import { QUEUE_NAMES } from '../queues.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const evaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  readinessLevel: z.string(),
  rubricScores: z.object({
    technicalCorrectness: z.number().min(0).max(10),
    relevanceAndDepth: z.number().min(0).max(10),
    clarityAndCommunication: z.number().min(0).max(10),
    problemSolving: z.number().min(0).max(10),
  }),
  strengths: z.array(z.string()),
  areasForImprovement: z.array(z.string()),
  recommendedTopics: z.array(z.string()),
  feedbackSummary: z.string(),
});

export class AiFeedbackWorkerService {
  static async processInterviewEvaluation(job) {
    const { sessionId } = job.data;
    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      logger.error({ sessionId }, '[AiFeedbackWorker] Session not found');
      return;
    }

    try {
      const transcript = session.turns
        .map(t => `${t.role.toUpperCase()}: ${t.message}`)
        .join('\n\n');

      const prompt = `Please evaluate the candidate based on this complete interview transcript for a ${session.targetRole} (${session.mode} mode):\n\n${transcript}`;

      const adapter = getLLMAdapter();
      const evalResult = await adapter.generateStructured({
        prompt,
        systemPrompt: INTERVIEW_EVALUATOR_PROMPT,
        schema: evaluationSchema,
      });

      const evaluationData = {
        ...evalResult.data,
        evaluatedAt: new Date(),
      };

      session.evaluation = evaluationData;
      session.status = 'evaluated';
      await session.save();

      // Emit Activity Event for progress tracking & readiness metrics
      await ActivityService.record({
        userId: session.userId,
        module: 'interviews',
        action: 'INTERVIEW_COMPLETED',
        payload: {
          sessionId: session._id.toString(),
          mode: session.mode,
          overallScore: evaluationData.overallScore,
          readinessLevel: evaluationData.readinessLevel,
        },
      });

      logger.info(
        { sessionId, score: evaluationData.overallScore },
        '[AiFeedbackWorker] Interview evaluation completed successfully'
      );

      return evaluationData;
    } catch (err) {
      logger.error({ err: err.message, sessionId }, '[AiFeedbackWorker] Evaluation failed');
      throw err;
    }
  }

  static createWorker(redisConnection) {
    if (env.NODE_ENV === 'test') {
      return null;
    }

    const worker = new Worker(
      QUEUE_NAMES.AI_FEEDBACK,
      async job => {
        return AiFeedbackWorkerService.processInterviewEvaluation(job);
      },
      {
        connection: redisConnection,
        concurrency: 2,
      }
    );

    worker.on('completed', job => {
      logger.info({ jobId: job.id }, '[AiFeedbackWorker] Job completed');
    });

    worker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err: err.message }, '[AiFeedbackWorker] Job failed');
    });

    return worker;
  }
}

export default AiFeedbackWorkerService;
