import { Assessment } from './assessment.model.js';
import { AssessmentAttempt } from './assessmentAttempt.model.js';
import { MonitoringEvent } from './monitoringEvent.model.js';
import { ActivityService } from '../progress/activity.service.js';

export class AssessmentsService {
  /**
   * List available published assessments
   */
  static async getAssessments(query = {}) {
    const filter = { isPublished: true };
    if (query.subjectId) filter.subjectId = query.subjectId;

    return Assessment.find(filter)
      .select(
        'title description durationMinutes totalMarks scheduledStartTime scheduledEndTime rules isPublished createdAt'
      )
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get assessment details without revealing correct options
   */
  static async getAssessmentById(id) {
    const assessment = await Assessment.findOne({ _id: id, isPublished: true })
      .select('-questions.correctOptions -questions.explanation')
      .populate('subjectId', 'name code')
      .lean();

    if (!assessment) {
      const err = new Error('Assessment not found');
      err.statusCode = 404;
      throw err;
    }
    return assessment;
  }

  /**
   * Start or resume an assessment attempt with server-authoritative timer
   */
  static async startAttempt({ assessmentId, userId }) {
    const assessment = await Assessment.findById(assessmentId)
      .select('-questions.correctOptions -questions.explanation')
      .lean();

    if (!assessment) {
      const err = new Error('Assessment not found');
      err.statusCode = 404;
      throw err;
    }

    // Check for existing active attempt
    let attempt = await AssessmentAttempt.findOne({
      assessmentId,
      userId,
      status: 'in_progress',
    });

    if (attempt) {
      // Check if time expired on server
      if (Date.now() > attempt.expiresAt.getTime()) {
        attempt.status = 'expired';
        await attempt.save();
      } else {
        const remainingSeconds = Math.max(
          0,
          Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000)
        );
        return {
          attempt,
          assessment,
          remainingSeconds,
          isResumed: true,
        };
      }
    }

    // Check if student already submitted
    const pastAttempt = await AssessmentAttempt.findOne({
      assessmentId,
      userId,
      status: { $in: ['submitted', 'expired'] },
    });
    if (pastAttempt) {
      const err = new Error('You have already completed this assessment');
      err.statusCode = 400;
      throw err;
    }

    // Create fresh attempt with server-calculated expiresAt
    const durationMs = (assessment.durationMinutes || 60) * 60 * 1000;
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + durationMs);

    attempt = await AssessmentAttempt.create({
      assessmentId,
      userId,
      startedAt,
      expiresAt,
      status: 'in_progress',
      answers: [],
    });

    return {
      attempt,
      assessment,
      remainingSeconds: Math.floor(durationMs / 1000),
      isResumed: false,
    };
  }

  /**
   * Periodic 30s autosave of student answers
   */
  static async autosaveAttempt({ attemptId, userId, answers = [] }) {
    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    if (attempt.status !== 'in_progress') {
      const err = new Error('Cannot autosave completed or expired attempt');
      err.statusCode = 400;
      throw err;
    }

    // Grace window of 15 seconds for network latency
    if (Date.now() > attempt.expiresAt.getTime() + 15000) {
      attempt.status = 'expired';
      await attempt.save();
      const err = new Error('Time has expired on server');
      err.statusCode = 400;
      throw err;
    }

    attempt.answers = answers;
    attempt.lastAutosavedAt = new Date();
    await attempt.save();

    return {
      attemptId: attempt._id,
      lastAutosavedAt: attempt.lastAutosavedAt,
      answersCount: attempt.answers.length,
    };
  }

  /**
   * Record client integrity / monitoring events (tab hidden, blur, fullscreen exit)
   */
  static async recordIntegrityEvent({ attemptId, userId, eventType, metadata = {} }) {
    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) return null;

    // 1. Audit log
    await MonitoringEvent.create({
      attemptId,
      userId,
      eventType,
      metadata,
      occurredAt: new Date(),
    });

    // 2. Increment review signals
    attempt.reviewSignalsCount += 1;
    if (attempt.reviewSignalsCount >= 3) {
      attempt.isFlaggedForReview = true;
    }
    await attempt.save();

    return {
      recorded: true,
      signalsCount: attempt.reviewSignalsCount,
      isFlaggedForReview: attempt.isFlaggedForReview,
    };
  }

  /**
   * Final submission and score calculation
   */
  static async submitAttempt({ attemptId, userId, answers = [], isAutoSubmitted = false }) {
    const attempt = await AssessmentAttempt.findOne({ _id: attemptId, userId });
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.statusCode = 404;
      throw err;
    }

    if (attempt.status === 'submitted') {
      return attempt; // Idempotent submission
    }

    // Fetch assessment with correct options to grade
    const assessment = await Assessment.findById(attempt.assessmentId)
      .select('+questions.correctOptions +questions.explanation')
      .lean();

    const questionsMap = new Map((assessment?.questions || []).map(q => [q.questionId, q]));
    const studentAnswers = answers.length > 0 ? answers : attempt.answers;

    let totalScore = 0;
    let correctCount = 0;
    const evaluatedAnswers = [];

    for (const ans of studentAnswers) {
      const q = questionsMap.get(ans.questionId);
      if (!q) continue;

      let isCorrect = false;
      let marksAwarded = 0;

      if (q.type === 'mcq') {
        isCorrect = ans.selectedOptions?.[0] === q.correctOptions?.[0];
      } else if (q.type === 'msq') {
        const studentSet = new Set(ans.selectedOptions || []);
        const correctSet = new Set(q.correctOptions || []);
        isCorrect =
          studentSet.size === correctSet.size && [...studentSet].every(opt => correctSet.has(opt));
      } else if (q.type === 'nat') {
        const num = Number(ans.natAnswer);
        const min = q.natRange?.min;
        const max = q.natRange?.max;
        if (min !== null && max !== null) {
          isCorrect = num >= min && num <= max;
        } else if (q.correctOptions?.[0]) {
          isCorrect = Math.abs(num - Number(q.correctOptions[0])) <= 0.01;
        }
      }

      if (isCorrect) {
        correctCount++;
        marksAwarded = q.marks || 2;
        totalScore += marksAwarded;
      }

      evaluatedAnswers.push({
        questionId: ans.questionId,
        selectedOptions: ans.selectedOptions || [],
        natAnswer: ans.natAnswer ?? null,
        isCorrect,
        marksAwarded,
      });
    }

    attempt.answers = evaluatedAnswers;
    attempt.score = totalScore;
    attempt.accuracyRate =
      studentAnswers.length > 0 ? Math.round((correctCount / studentAnswers.length) * 100) : 0;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date();
    attempt.isAutoSubmitted = isAutoSubmitted;
    await attempt.save();

    // Emit Activity Event
    try {
      await ActivityService.record({
        userId,
        module: 'assessments',
        action: 'ASSESSMENT_COMPLETED',
        payload: {
          assessmentId: attempt.assessmentId.toString(),
          attemptId: attempt._id.toString(),
          score: attempt.score,
          accuracyRate: attempt.accuracyRate,
        },
      });
    } catch {
      // Ignore
    }

    return attempt;
  }

  /**
   * Faculty / Admin reviewer signals dashboard
   */
  static async getReviewSignals(assessmentId) {
    return AssessmentAttempt.find({ assessmentId })
      .select(
        'userId score accuracyRate reviewSignalsCount isFlaggedForReview isAutoSubmitted submittedAt status'
      )
      .populate('userId', 'name email university branch')
      .sort({ reviewSignalsCount: -1, createdAt: -1 })
      .lean();
  }
}

export default AssessmentsService;
