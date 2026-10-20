import { ProgressSummary } from '../progress/progressSummary.model.js';
import { RecommendationEngine } from './recommendation.service.js';
import { UserRepository } from '../users/user.repository.js';
import { getRedisClient } from '../../config/redis.js';
import { NotFoundError } from '../../middleware/error.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

export class DashboardService {
  /**
   * Get pre-aggregated summary with "What should I do today?" recommendations
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getSummary(userId) {
    const cacheKey = `cache:dashboard:summary:${userId}`;
    const redis = getRedisClient();

    // 1. Check Redis cache
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Continue to DB
    }

    // 2. Fetch user profile
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // 3. Fetch pre-aggregated ProgressSummary (O(1) read)
    let summary = await ProgressSummary.findOne({ userId }).lean();
    if (!summary) {
      // Initialize blank summary if user has no activity yet
      summary = await ProgressSummary.create({
        userId,
        academicsStats: {
          totalTopics: 0,
          completedTopics: 0,
          percentComplete: 0,
          subjectsInProgress: 0,
        },
        codingStats: {
          solvedCount: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          totalSubmissions: 0,
          acceptedSubmissions: 0,
          accuracyRate: 0,
          topicCoverage: [],
          streak: 0,
        },
        gateStats: {
          testsAttempted: 0,
          averageScore: 0,
          questionsAttempted: 0,
          accuracyRate: 0,
          weakTopics: [],
        },
        assessmentStats: { totalAttempted: 0, averageScore: 0, upcomingScheduled: 0 },
        interviewStats: { sessionsCompleted: 0, averageReadinessScore: 0 },
        overallStreak: 0,
        recentActivities: [],
      });
      summary = summary.toObject();
    }

    // 4. Compute deterministic "What should I do today?" actionable recommendations
    const recommendations = await RecommendationEngine.getRecommendations(user, summary);

    const payload = {
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        isAlumni: user.isAlumni,
        university: user.university,
        branch: user.branch,
        semester: user.semester,
        goals: user.goals,
      },
      whatShouldIDoToday: recommendations,
      stats: {
        academics: summary.academicsStats,
        coding: summary.codingStats,
        gate: summary.gateStats,
        assessments: summary.assessmentStats,
        interviews: summary.interviewStats,
        overallStreak: summary.overallStreak || 0,
      },
      recentActivities: summary.recentActivities || [],
      generatedAt: new Date().toISOString(),
    };

    // 5. Cache summary with jittered TTL (prevent stampede)
    try {
      const jitter = Math.floor(Math.random() * 30);
      await redis.set(cacheKey, JSON.stringify(payload), 'EX', CACHE_TTL_SECONDS + jitter);
    } catch {
      // Safe to ignore cache set failure
    }

    return payload;
  }
}

export default DashboardService;
