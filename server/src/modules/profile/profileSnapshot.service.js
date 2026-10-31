import { DailyActivity } from '../progress/dailyActivity.model.js';
import { UserBadge } from './userBadge.model.js';
import { ProfileSnapshot } from './profileSnapshot.model.js';
import { User } from '../users/user.model.js';
import { ProgressSummary } from '../progress/progressSummary.model.js';
import { BADGE_CATALOGUE } from './badge.catalogue.js';
import { getRedisClient } from '../../config/redis.js';

export class ProfileSnapshotService {
  /**
   * Format current date in a specific timezone as YYYY-MM-DD
   */
  static getTodayInTimezone(timezone = 'UTC') {
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  /**
   * Record daily activity rollup in user timezone
   */
  static async recordDailyActivity(userId, module, timezone = 'UTC') {
    const dateStr = this.getTodayInTimezone(timezone);
    const validModule = ['coding', 'gate', 'academics', 'interviews', 'community'].includes(module)
      ? module
      : 'coding';

    const incField = `counts.${validModule === 'academics' ? 'academic' : validModule === 'interviews' ? 'interview' : validModule}`;

    return await DailyActivity.findOneAndUpdate(
      { userId, date: dateStr },
      {
        $inc: { [incField]: 1, 'counts.total': 1 },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  /**
   * Compute consecutive active day streaks for user
   */
  static async calculateStreaks(userId, timezone = 'UTC') {
    const activities = await DailyActivity.find({ userId })
      .sort({ date: -1 })
      .limit(365)
      .lean();

    if (!activities.length) {
      return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0, lastActiveDate: '' };
    }

    const totalActiveDays = await DailyActivity.countDocuments({ userId, 'counts.total': { $gt: 0 } });
    const dates = new Set(activities.map((a) => a.date));

    // Calculate current streak
    let currentStreak = 0;
    const checkDate = new Date();

    // Check today, if not active today check yesterday
    let checkDateStr = this.getTodayInTimezone(timezone);
    if (!dates.has(checkDateStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(checkDate);
    }

    while (dates.has(checkDateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
      checkDateStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(checkDate);
    }

    // Calculate longest streak from sorted dates
    let longestStreak = currentStreak;
    let tempStreak = 0;
    let prevDate = null;

    // Ascending for longest streak
    const sortedAsc = [...activities].reverse();
    for (const act of sortedAsc) {
      const cur = new Date(act.date);
      if (prevDate) {
        const diffDays = Math.round((cur - prevDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = cur;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }

    return {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      totalActiveDays,
      lastActiveDate: activities[0].date,
    };
  }

  /**
   * Evaluate deterministic badges and award new ones idempotently
   */
  static async evaluateBadges(userId, stats) {
    const awarded = [];

    for (const badgeDef of BADGE_CATALOGUE) {
      if (badgeDef.check(stats)) {
        const existing = await UserBadge.findOne({ userId, badgeId: badgeDef.badgeId }).lean();
        if (!existing) {
          const badge = await UserBadge.create({
            userId,
            badgeId: badgeDef.badgeId,
            name: badgeDef.name,
            description: badgeDef.description,
            icon: badgeDef.icon,
            tier: badgeDef.tier,
            category: badgeDef.category,
            earnedAt: new Date(),
          });
          awarded.push(badge);
        }
      }
    }

    return awarded;
  }

  /**
   * Rebuild or update profile snapshot for a user
   */
  static async rebuildSnapshot(userId) {
    const user = await User.findById(userId).lean();
    if (!user) return null;

    const summary = (await ProgressSummary.findOne({ userId }).lean()) || {};
    const streaks = await this.calculateStreaks(userId, user.timezone || 'UTC');

    const codingStats = {
      solvedCount: summary.codingStats?.solvedCount || 0,
      easyCount: summary.codingStats?.easyCount || 0,
      mediumCount: summary.codingStats?.mediumCount || 0,
      hardCount: summary.codingStats?.hardCount || 0,
      accuracy: summary.codingStats?.accuracyRate || 0,
      ranking: summary.codingStats?.solvedCount ? Math.max(1, 500 - summary.codingStats.solvedCount * 3) : 0,
    };

    const gateStats = {
      testsTaken: summary.gateStats?.testsAttempted || 0,
      averageScore: summary.gateStats?.averageScore || 0,
      percentile: summary.gateStats?.averageScore ? Math.min(99, Math.round(summary.gateStats.averageScore * 1.1)) : 0,
      topSubject: 'Computer Networks',
    };

    const interviewStats = {
      completedCount: summary.interviewStats?.sessionsCompleted || 0,
      averageReadiness: summary.interviewStats?.averageReadinessScore || 0,
      level: (summary.interviewStats?.averageReadinessScore || 0) >= 80 ? 'Advanced' : 'Intermediate',
    };

    const academicStats = {
      completionPercentage: summary.academicsStats?.percentComplete || 0,
      currentSemester: user.semester || 1,
      activeSubjectsCount: summary.academicsStats?.subjectsInProgress || 0,
    };

    const communityStats = {
      postsCount: 0,
      acceptedAnswersCount: 0,
      helpfulVotesCount: 0,
    };

    const statsPayload = {
      coding: codingStats,
      gate: gateStats,
      interviews: interviewStats,
      academics: academicStats,
      community: communityStats,
      streaks,
    };

    // Check & award badges
    await this.evaluateBadges(userId, statsPayload);
    const userBadges = await UserBadge.find({ userId }).sort({ earnedAt: -1 }).lean();

    // Query 365-day activity rollup
    const dailyRollups = await DailyActivity.find({ userId })
      .sort({ date: -1 })
      .limit(365)
      .lean();

    const recentActivity = dailyRollups.map((d) => ({
      date: d.date,
      count: d.counts?.total || 0,
    }));

    // Derived top skills
    const topSkills = [
      { name: 'Algorithms & Data Structures', category: 'coding', score: Math.min(100, (codingStats.solvedCount || 0) * 4), level: codingStats.solvedCount > 25 ? 'Master' : 'Proficient' },
      { name: 'GATE Core Concepts', category: 'gate', score: gateStats.averageScore || 0, level: gateStats.averageScore > 70 ? 'Advanced' : 'Practicing' },
      { name: 'Semester Academics', category: 'academics', score: academicStats.completionPercentage || 0, level: `${academicStats.completionPercentage}% Done` },
      { name: 'Technical Communication', category: 'interviews', score: interviewStats.averageReadiness || 0, level: interviewStats.level },
    ];

    const snapshotData = {
      userId,
      username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      identity: {
        name: user.name,
        username: user.username || user.name.toLowerCase().replace(/[^a-z0-9]/g, ''),
        university: user.university || '',
        branch: user.branch || '',
        semester: user.semester || 1,
        graduationYear: user.profile?.graduationYear,
        headline: user.headline || '',
        bio: user.bio || '',
        role: user.role || 'student',
        company: user.profile?.currentCompany || '',
        avatarKey: user.avatarKey || '',
        avatarVersion: user.avatarVersion || 1,
      },
      stats: statsPayload,
      topSkills,
      badges: userBadges,
      recentActivity,
      version: (user.avatarVersion || 1),
      lastAggregatedAt: new Date(),
    };

    const snapshot = await ProfileSnapshot.findOneAndUpdate(
      { userId },
      { $set: snapshotData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Invalidate Redis caches
    try {
      const redis = getRedisClient();
      await redis.del(`cache:profile:me:${userId}`);
      await redis.del(`cache:dashboard:summary:${userId}`);
      if (user.username) {
        await redis.del(`cache:profile:public:${user.username}`);
      }
    } catch {
      // Safe to ignore redis errors
    }

    return snapshot;
  }
}

export default ProfileSnapshotService;
