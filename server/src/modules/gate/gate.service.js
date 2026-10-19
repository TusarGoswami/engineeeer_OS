import { GateTest } from './gateTest.model.js';
import { GateAttempt } from './gateAttempt.model.js';
import { GateScoringService } from './scoring.service.js';
import { ActivityService } from '../progress/activity.service.js';

export class GateService {
  /**
   * List available published mock tests
   */
  static async getTests(query = {}) {
    const filter = { isPublished: true };
    if (query.subject) {
      filter.subject = new RegExp(query.subject, 'i');
    }

    return GateTest.find(filter)
      .select(
        'title description subject durationMinutes totalMarks totalQuestions createdAt updatedAt'
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Fetch test by ID for taking an exam (omits correct options and explanations)
   */
  static async getTestForAttempt(testId) {
    const test = await GateTest.findOne({ _id: testId, isPublished: true })
      .select('-questions.correctOptions -questions.explanation')
      .lean();

    if (!test) {
      const err = new Error('GATE test not found or not published');
      err.statusCode = 404;
      throw err;
    }

    return test;
  }

  /**
   * Submit student answers, evaluate score, and save attempt
   */
  static async submitAttempt({ testId, answers = [], timeTakenSeconds = 0, userId }) {
    // 1. Fetch test with hidden answer keys and explanations
    const test = await GateTest.findById(testId)
      .select('+questions.correctOptions +questions.explanation')
      .lean();

    if (!test) {
      const err = new Error('GATE test not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Evaluate using GateScoringService
    const evaluation = GateScoringService.evaluateAttempt(test.questions, answers);

    // 3. Persist attempt
    const attempt = await GateAttempt.create({
      userId,
      testId,
      answers: evaluation.evaluatedAnswers,
      score: evaluation.score,
      totalMarksAvailable: evaluation.totalMarksAvailable,
      totalQuestions: evaluation.totalQuestions,
      correctCount: evaluation.correctCount,
      incorrectCount: evaluation.incorrectCount,
      unattemptedCount: evaluation.unattemptedCount,
      accuracyRate: evaluation.accuracyRate,
      timeTakenSeconds,
      topicBreakdown: evaluation.topicBreakdown,
      weakTopics: evaluation.weakTopics,
      submittedAt: new Date(),
    });

    // 4. Record Activity Event for progress and dashboard sync
    try {
      await ActivityService.record({
        userId,
        module: 'gate',
        action: 'TEST_COMPLETED',
        payload: {
          testId: test._id.toString(),
          attemptId: attempt._id.toString(),
          score: evaluation.score,
          accuracyRate: evaluation.accuracyRate,
          weakTopics: evaluation.weakTopics,
        },
      });
    } catch {
      // Activity recording should not fail student submission
    }

    return attempt;
  }

  /**
   * Get an attempt by ID with questions and explanations
   */
  static async getAttemptById(attemptId, userId) {
    const attempt = await GateAttempt.findOne({ _id: attemptId, userId })
      .populate('testId', 'title subject durationMinutes totalMarks totalQuestions questions')
      .lean();

    if (!attempt) {
      const err = new Error('GATE attempt not found');
      err.statusCode = 404;
      throw err;
    }

    // Include explanation from test questions for review
    const fullTest = await GateTest.findById(attempt.testId._id)
      .select('+questions.correctOptions +questions.explanation')
      .lean();

    const questionsMap = new Map((fullTest?.questions || []).map(q => [q.questionId, q]));

    const reviewQuestions = attempt.answers.map(ans => {
      const original = questionsMap.get(ans.questionId) || {};
      return {
        ...ans,
        questionText: original.questionText,
        type: original.type,
        marks: original.marks,
        topic: original.topic,
        options: original.options,
        correctOptions: original.correctOptions,
        natRange: original.natRange,
        explanation: original.explanation,
      };
    });

    return {
      ...attempt,
      reviewQuestions,
    };
  }

  /**
   * Get recent attempts for user
   */
  static async getUserAttempts(userId) {
    return GateAttempt.find({ userId })
      .populate('testId', 'title subject durationMinutes totalMarks totalQuestions')
      .sort({ createdAt: -1 })
      .lean();
  }
}

export default GateService;
