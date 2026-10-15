import { ProgressSummary } from '../../modules/progress/progressSummary.model.js';
import { AcademicProgress } from '../../modules/academics/academicProgress.model.js';
import { Subject } from '../../modules/academics/subject.model.js';
import { getRedisClient } from '../../config/redis.js';
import { logger } from '../../config/logger.js';

export class ProgressWorkerService {
  /**
   * Process a single progress aggregation job idempotently
   */
  static async processProgressJob(job) {
    const { userId, module, action, payload } = job.data;

    try {
      // 1. Ensure a ProgressSummary document exists
      let summary = await ProgressSummary.findOne({ userId });
      if (!summary) {
        summary = new ProgressSummary({ userId });
      }

      // 2. Module-specific aggregations
      if (module === 'academics') {
        await this.aggregateAcademics(summary, userId);
      } else if (module === 'coding') {
        this.aggregateCoding(summary, action, payload);
      } else if (module === 'gate') {
        this.aggregateGate(summary, action, payload);
      } else if (module === 'assessments') {
        this.aggregateAssessments(summary, action, payload);
      } else if (module === 'interviews') {
        this.aggregateInterviews(summary, action, payload);
      }

      // 3. Update recent activity feed (keep last 5)
      const activityTitle =
        payload?.title || `${module.toUpperCase()}: ${action.replace(/_/g, ' ')}`;
      summary.recentActivities.unshift({
        module,
        action,
        title: activityTitle,
        occurredAt: new Date(),
      });
      if (summary.recentActivities.length > 5) {
        summary.recentActivities = summary.recentActivities.slice(0, 5);
      }

      // 4. Update overall streak tracking
      const today = new Date().toISOString().slice(0, 10);
      if (summary.lastActiveDate !== today) {
        summary.overallStreak = (summary.overallStreak || 0) + 1;
        summary.lastActiveDate = today;
      }

      await summary.save();

      // 5. Invalidate Redis dashboard summary cache for this user
      try {
        const redis = getRedisClient();
        await redis.del(`cache:dashboard:summary:${userId}`);
      } catch {
        // Safe to ignore cache deletion failure
      }

      return summary;
    } catch (err) {
      logger.error({ err: err.message, userId, module }, '[ProgressWorker] Aggregation failed');
      throw err;
    }
  }

  /**
   * Compute exact academic topic completion metrics
   */
  static async aggregateAcademics(summary, userId) {
    const progressRecords = await AcademicProgress.find({ userId }).lean();
    const subjectIds = progressRecords.map(p => p.subjectId);
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();

    let totalTopics = 0;
    let completedTopics = 0;

    for (const sub of subjects) {
      totalTopics += sub.topics?.length || 0;
    }

    for (const prog of progressRecords) {
      completedTopics += prog.completedTopicIds?.length || 0;
    }

    const percentComplete = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    summary.academicsStats = {
      totalTopics: Math.max(totalTopics, completedTopics),
      completedTopics,
      percentComplete,
      subjectsInProgress: progressRecords.length,
    };
  }

  static aggregateCoding(summary, action, payload) {
    if (action === 'PROBLEM_SOLVED') {
      summary.codingStats.solvedCount = (summary.codingStats.solvedCount || 0) + 1;
      const diff = (payload?.difficulty || 'easy').toLowerCase();
      if (diff === 'easy') summary.codingStats.easyCount += 1;
      if (diff === 'medium') summary.codingStats.mediumCount += 1;
      if (diff === 'hard') summary.codingStats.hardCount += 1;

      if (payload?.tag && !summary.codingStats.topicCoverage.includes(payload.tag)) {
        summary.codingStats.topicCoverage.push(payload.tag);
      }
    }

    if (action === 'SUBMISSION_EVALUATED') {
      summary.codingStats.totalSubmissions = (summary.codingStats.totalSubmissions || 0) + 1;
      if (payload?.isAccepted) {
        summary.codingStats.acceptedSubmissions =
          (summary.codingStats.acceptedSubmissions || 0) + 1;
      }
      summary.codingStats.accuracyRate = Math.round(
        (summary.codingStats.acceptedSubmissions / summary.codingStats.totalSubmissions) * 100
      );
    }
  }

  static aggregateGate(summary, action, payload) {
    if (action === 'TEST_COMPLETED') {
      summary.gateStats.testsAttempted = (summary.gateStats.testsAttempted || 0) + 1;
      const score = payload?.score || 0;
      summary.gateStats.averageScore = Math.round(
        ((summary.gateStats.averageScore || 0) + score) / summary.gateStats.testsAttempted
      );
    }
  }

  static aggregateAssessments(summary, action, payload) {
    if (action === 'ASSESSMENT_SUBMITTED') {
      summary.assessmentStats.totalAttempted = (summary.assessmentStats.totalAttempted || 0) + 1;
      const score = payload?.score || 0;
      summary.assessmentStats.averageScore = Math.round(
        ((summary.assessmentStats.averageScore || 0) + score) /
          summary.assessmentStats.totalAttempted
      );
    }
  }

  static aggregateInterviews(summary, action, payload) {
    if (action === 'INTERVIEW_COMPLETED') {
      summary.interviewStats.sessionsCompleted =
        (summary.interviewStats.sessionsCompleted || 0) + 1;
      const readiness = payload?.readinessScore || 75;
      summary.interviewStats.averageReadinessScore = Math.round(
        ((summary.interviewStats.averageReadinessScore || 0) + readiness) /
          summary.interviewStats.sessionsCompleted
      );
    }
  }
}

export default ProgressWorkerService;
