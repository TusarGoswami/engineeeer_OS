import { InterviewSession } from './interviewSession.model.js';
import { getLLMAdapter } from '../../integrations/llm/index.js';
import { INTERVIEW_CONDUCTOR_PROMPT } from '../../integrations/llm/prompts/interviewEvaluator.prompt.js';
import { aiFeedbackQueue } from '../../jobs/queues.js';
import { AiFeedbackWorkerService } from '../../jobs/workers/aiFeedback.worker.js';
import { env } from '../../config/env.js';

export class InterviewService {
  /**
   * Initialize a new interactive interview session
   */
  static async createSession({
    userId,
    mode = 'technical',
    targetRole = 'Software Development Engineer (SDE-1)',
  }) {
    const session = await InterviewSession.create({
      userId,
      mode,
      targetRole,
      status: 'in_progress',
      turns: [],
    });

    // Generate context-aware opening question
    const firstQuestions = {
      technical: `Hello! Welcome to your technical interview for the ${targetRole} position. To start off, could you briefly describe a technically complex project you designed, focusing on your key architectural choices and algorithmic trade-offs?`,
      dsa: `Welcome to your Algorithm & Data Structures interview. Let's start by discussing binary trees. How would you determine whether a given binary tree is height-balanced, and what is the optimal time and space complexity?`,
      hr: `Welcome! I'm glad to speak with you today regarding the ${targetRole} opportunity. Could you tell me a little bit about yourself, what drives your passion for software engineering, and why you are interested in this role?`,
      project: `Welcome! In this session, we'll dive deep into your project portfolio. Can you walk me through the end-to-end system architecture of your flagship project, including data storage, caching, and scalability considerations?`,
    };

    const initialGreeting = firstQuestions[mode] || firstQuestions.technical;

    session.turns.push({
      role: 'interviewer',
      message: initialGreeting,
      timestamp: new Date(),
    });

    await session.save();
    return session;
  }

  /**
   * Submit candidate reply and receive next interviewer response
   */
  static async submitTurn({ sessionId, userId, candidateMessage }) {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error('Interview session not found');
      err.statusCode = 404;
      throw err;
    }

    if (session.status !== 'in_progress') {
      const err = new Error('Interview session is already concluded');
      err.statusCode = 400;
      throw err;
    }

    // 1. Record candidate response
    session.turns.push({
      role: 'candidate',
      message: candidateMessage,
      timestamp: new Date(),
    });

    // 2. Build interview transcript history
    const transcript = session.turns.map(t => `${t.role.toUpperCase()}: ${t.message}`).join('\n\n');

    const prompt = `Here is the interview transcript so far:\n\n${transcript}\n\nCandidate has just responded. As the interviewer, respond to their points constructively, probe any gaps, and ask the next technical follow-up question.`;

    const adapter = getLLMAdapter();
    const result = await adapter.generateText({
      prompt,
      systemPrompt: INTERVIEW_CONDUCTOR_PROMPT,
      temperature: 0.3,
    });

    // 3. Record interviewer follow-up
    session.turns.push({
      role: 'interviewer',
      message: result.text,
      timestamp: new Date(),
    });

    await session.save();
    return session;
  }

  /**
   * Complete interview and queue AI rubric evaluation
   */
  static async finishSession({ sessionId, userId }) {
    const session = await InterviewSession.findOne({ _id: sessionId, userId });
    if (!session) {
      const err = new Error('Interview session not found');
      err.statusCode = 404;
      throw err;
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    // Enqueue rubric evaluation job to BullMQ
    const queue = aiFeedbackQueue();
    await queue.add(
      'evaluate-interview-session',
      { sessionId: session._id.toString() },
      { jobId: `interview_eval_${session._id.toString()}` }
    );

    // In unit test environments without Redis daemon, execute evaluation synchronously
    if (env.NODE_ENV === 'test') {
      await AiFeedbackWorkerService.processInterviewEvaluation({
        data: { sessionId: session._id.toString() },
      });
    }

    return session;
  }

  /**
   * Fetch single session with full report
   */
  static async getSessionById(sessionId, userId) {
    const session = await InterviewSession.findOne({ _id: sessionId, userId }).lean();
    if (!session) {
      const err = new Error('Interview session not found');
      err.statusCode = 404;
      throw err;
    }
    return session;
  }

  /**
   * Get user session history
   */
  static async getUserSessions(userId) {
    return InterviewSession.find({ userId })
      .select(
        'mode targetRole status evaluation.overallScore evaluation.readinessLevel turns createdAt completedAt'
      )
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default InterviewService;
