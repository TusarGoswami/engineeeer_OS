import mongoose from 'mongoose';
import { ProgressSummary } from '../progress/progressSummary.model.js';
import { RecommendationEngine } from './recommendation.service.js';
import { UserRepository } from '../users/user.repository.js';
import { DashboardTask } from './dashboardTask.model.js';
import { DailyActivity } from '../progress/dailyActivity.model.js';
import { ProfileSnapshotService } from '../profile/profileSnapshot.service.js';
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

  /**
   * Get or generate today's actionable prioritized tasks
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getTodayTasks(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const today = ProfileSnapshotService.getTodayInTimezone(user.timezone || 'UTC');

    // 1. Check if tasks exist for today
    let tasks = await DashboardTask.find({ userId, date: today }).sort({ createdAt: 1 });

    // 2. Generate if none exist for today
    if (!tasks || tasks.length === 0) {
      let summary = await ProgressSummary.findOne({ userId }).lean();
      const recs = await RecommendationEngine.getRecommendations(user, summary);

      const defaultEstimates = {
        coding: 20,
        gate: 30,
        academics: 25,
        interviews: 15,
        community: 10,
      };

      const validModules = ['coding', 'gate', 'academics', 'interviews', 'community'];

      const newDocs = (recs.length > 0 ? recs.slice(0, 5) : [
        {
          id: 'rec-coding-daily',
          type: 'coding',
          title: 'Daily Algorithmic Problem: Array Two-Sum',
          deepLink: '/coding',
        },
        {
          id: 'rec-gate-daily',
          type: 'gate',
          title: 'Practice 10 GATE CS PYQs',
          deepLink: '/gate',
        },
        {
          id: 'rec-academic-daily',
          type: 'academics',
          title: 'Review Operating Systems Module Notes',
          deepLink: '/academics',
        },
      ]).map(rec => ({
        userId,
        taskId: rec.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        date: today,
        title: rec.title,
        estimatedMinutes: defaultEstimates[rec.type] || 20,
        module: validModules.includes(rec.type) ? rec.type : 'coding',
        actionUrl: rec.deepLink || '/',
        status: 'pending',
      }));

      try {
        await DashboardTask.insertMany(newDocs, { ordered: false });
      } catch {
        // Handle race conditions gracefully
      }

      tasks = await DashboardTask.find({ userId, date: today }).sort({ createdAt: 1 });
    }

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      date: today,
      tasks,
      total,
      completed,
      percent,
    };
  }

  /**
   * Update task status (complete / snooze / pending)
   * @param {string} userId
   * @param {string} taskId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async updateTask(userId, taskId, { status }) {
    const user = await UserRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const query = {
      userId,
      $or: [
        { taskId },
        ...(mongoose.isValidObjectId(taskId) ? [{ _id: taskId }] : []),
      ],
    };

    const task = await DashboardTask.findOne(query);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    const prevStatus = task.status;
    task.status = status;

    if (status === 'completed') {
      task.completedAt = new Date();
      task.snoozedUntil = null;

      // Award daily activity telemetry if newly completed
      if (prevStatus !== 'completed') {
        await ProfileSnapshotService.recordDailyActivity(
          userId,
          task.module || 'coding',
          user.timezone || 'UTC'
        );
      }
    } else if (status === 'snoozed') {
      task.completedAt = null;
      task.snoozedUntil = new Date(Date.now() + 4 * 3600 * 1000); // 4 hours
    } else {
      task.completedAt = null;
      task.snoozedUntil = null;
    }

    await task.save();

    // Invalidate Redis dashboard summary cache
    try {
      const redis = getRedisClient();
      await redis.del(`cache:dashboard:summary:${userId}`);
    } catch {
      // Ignore Redis del failure
    }

    return task;
  }

  /**
   * Get 12-month activity heatmap data for user
   * @param {string} userId
   * @param {number} months
   * @returns {Promise<Array>}
   */
  static async getHeatmap(userId, months = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const startStr = startDate.toISOString().slice(0, 10);

    const rows = await DailyActivity.find({
      userId,
      date: { $gte: startStr },
    })
      .sort({ date: 1 })
      .lean();

    return rows.map(r => ({
      date: r.date,
      count: r.counts?.total || 0,
      details: r.counts || {},
    }));
  }
}

export default DashboardService;
