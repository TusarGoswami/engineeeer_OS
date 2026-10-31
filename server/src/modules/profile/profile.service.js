import crypto from 'crypto';
import { ProfileRepository } from './profile.repository.js';
import { ProfileSnapshotService } from './profileSnapshot.service.js';
import { BADGE_CATALOGUE } from './badge.catalogue.js';
import { NotFoundError, ForbiddenError, ValidationError, ConflictError } from '../../middleware/error.js';
import { RESERVED_USERNAMES } from '../users/user.schema.js';
import { getRedisClient } from '../../config/redis.js';

export class ProfileService {
  /**
   * Get full profile for authenticated owner
   */
  static async getOwnerProfile(userId) {
    const user = await ProfileRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let snapshot = await ProfileRepository.findSnapshotByUserId(userId);
    if (!snapshot) {
      snapshot = await ProfileSnapshotService.rebuildSnapshot(userId);
    }

    const shareToken = user.profileSettings?.shareToken;
    const username = user.username || snapshot?.identity?.username || 'user';
    const isPublic = user.profileSettings?.visibility === 'public';
    const shareUrl = isPublic
      ? `/u/${encodeURIComponent(username)}`
      : `/u/${encodeURIComponent(username)}?token=${encodeURIComponent(shareToken || '')}`;

    return {
      profile: snapshot,
      settings: user.profileSettings,
      shareToken,
      shareUrl,
    };
  }

  /**
   * Update owner profile details and settings
   */
  static async updateOwnerProfile(userId, updateData) {
    const user = await ProfileRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const sanitized = { ...updateData };

    if (sanitized.username) {
      sanitized.username = sanitized.username.toLowerCase().trim();
      if (RESERVED_USERNAMES.has(sanitized.username)) {
        throw new ValidationError(`Username '${sanitized.username}' is reserved`);
      }
      const existing = await ProfileRepository.findUserByUsername(sanitized.username);
      if (existing && existing._id.toString() !== userId.toString()) {
        throw new ConflictError(`Username '${sanitized.username}' is already taken`);
      }
    }

    // Merge nested profileSettings
    if (sanitized.profileSettings) {
      sanitized.profileSettings = {
        ...user.profileSettings,
        ...sanitized.profileSettings,
        sections: {
          ...user.profileSettings?.sections,
          ...sanitized.profileSettings.sections,
        },
      };
    }

    const updatedUser = await ProfileRepository.updateUser(userId, sanitized);
    const snapshot = await ProfileSnapshotService.rebuildSnapshot(userId);

    return {
      profile: snapshot,
      settings: updatedUser.profileSettings,
    };
  }

  /**
   * Get public profile with strict server-side privacy filtering
   */
  static async getPublicProfile(username, queryToken = null) {
    if (!username) {
      throw new NotFoundError('User profile not found');
    }

    const cleanUsername = username.toLowerCase().trim();

    // Check Redis cache first for high-concurrency performance
    const cacheKey = `cache:profile:public:${cleanUsername}:${queryToken || 'none'}`;
    try {
      const redis = getRedisClient();
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Safe to continue on Redis miss/failure
    }

    const user = await ProfileRepository.findUserByUsername(cleanUsername);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }

    const visibility = user.profileSettings?.visibility || 'private';

    // Enforcement of visibility rules
    if (visibility === 'private') {
      throw new ForbiddenError('This profile is private');
    }

    if (visibility === 'unlisted') {
      const expectedToken = user.profileSettings?.shareToken;
      if (!queryToken || queryToken !== expectedToken) {
        throw new NotFoundError('User profile not found or invalid access token');
      }
    }

    let snapshot = await ProfileRepository.findSnapshotByUserId(user._id);
    if (!snapshot) {
      snapshot = await ProfileSnapshotService.rebuildSnapshot(user._id);
    }

    // Server-side privacy filtering: Deep clone and omit restricted sections
    const publicProfile = JSON.parse(JSON.stringify(snapshot));

    // Never expose private account metadata
    delete publicProfile._id;
    delete publicProfile.__v;
    delete publicProfile.userId;
    delete publicProfile.updatedAt;

    const sections = user.profileSettings?.sections || {};

    if (sections.showUniversity === false) {
      delete publicProfile.identity.university;
    }
    if (sections.showPhoto === false) {
      delete publicProfile.identity.avatarKey;
      delete publicProfile.identity.avatarUrl;
    }
    if (sections.showGate === false) {
      delete publicProfile.stats.gate;
    }
    if (sections.showInterviews === false) {
      delete publicProfile.stats.interviews;
    }
    if (sections.showHeatmap === false) {
      delete publicProfile.recentActivity;
    }
    if (sections.showSkills === false) {
      delete publicProfile.topSkills;
    }
    if (sections.showBadges === false) {
      delete publicProfile.badges;
    }

    const result = {
      card: publicProfile,
      theme: user.profileSettings?.theme || 'terminal',
      visibility,
      isUnlisted: visibility === 'unlisted',
    };

    // Cache filtered result for 120 seconds in Redis
    try {
      const redis = getRedisClient();
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 120);
    } catch {
      // Safe to ignore
    }

    return result;
  }

  /**
   * Rotate unlisted share token
   */
  static async regenerateShareToken(userId) {
    const newToken = crypto.randomBytes(16).toString('hex');
    const updatedUser = await ProfileRepository.updateUser(userId, {
      'profileSettings.shareToken': newToken,
    });

    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    const username = updatedUser.username || 'user';
    const shareUrl = `/u/${encodeURIComponent(username)}?token=${encodeURIComponent(newToken)}`;

    return {
      shareToken: newToken,
      shareUrl,
    };
  }

  /**
   * Get complete badge catalogue with user's earned status
   */
  static async getMyBadges(userId) {
    const earned = await ProfileRepository.findBadgesByUserId(userId);
    const earnedMap = new Map(earned.map((b) => [b.badgeId, b.earnedAt]));

    return BADGE_CATALOGUE.map((badge) => ({
      badgeId: badge.badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,
      category: badge.category,
      isUnlocked: earnedMap.has(badge.badgeId),
      earnedAt: earnedMap.get(badge.badgeId) || null,
    }));
  }

  /**
   * Get 365-day activity heatmap data with streaks
   */
  static async getHeatmap(userId, days = 365) {
    const user = await ProfileRepository.findUserById(userId);
    const timezone = user?.timezone || 'UTC';

    const rawActivities = await ProfileRepository.findDailyActivityByUserId(userId, days);
    const streakInfo = await ProfileSnapshotService.calculateStreaks(userId, timezone);

    const formattedDays = rawActivities.map((a) => ({
      date: a.date,
      count: a.counts?.total || 0,
      breakdown: a.counts,
    }));

    return {
      days: formattedDays,
      ...streakInfo,
    };
  }
}

export default ProfileService;

