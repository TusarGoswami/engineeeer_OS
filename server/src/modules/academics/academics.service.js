import { Subject } from './subject.model.js';
import { AcademicResource } from './academicResource.model.js';
import { AcademicProgress } from './academicProgress.model.js';
import { ActivityService } from '../progress/activity.service.js';
import { getRedisClient } from '../../config/redis.js';
import { NotFoundError } from '../../middleware/error.js';
import { logger } from '../../config/logger.js';

const CACHE_TTL_SECONDS = 3600; // 1 hour

export class AcademicsService {
  /**
   * List subjects with filters, search and cursor pagination (Cache-aside)
   */
  static async getSubjects(filters = {}, pagination = {}) {
    const { university, branch, semester, search } = filters;
    const { limit = 20, cursor } = pagination;

    const cacheKey = `cache:academics:subjects:${university || 'all'}:${branch || 'all'}:${semester || 'all'}:${cursor || 'start'}`;
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Continue to DB on cache error
    }

    const query = { isPublished: true };
    if (university) query.university = university;
    if (branch) query.branch = branch;
    if (semester) query.semester = Number(semester);
    if (search) {
      query.$text = { $search: search };
    }
    if (cursor) {
      query._id = { $gt: cursor };
    }

    const subjects = await Subject.find(query)
      .sort({ semester: 1, code: 1, _id: 1 })
      .limit(limit + 1)
      .lean();

    const hasMore = subjects.length > limit;
    const data = hasMore ? subjects.slice(0, limit) : subjects;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : null;

    const result = {
      data,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };

    // Store in Redis with TTL
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL_SECONDS);
    } catch {
      // Safe to ignore cache set failure
    }

    return result;
  }

  /**
   * Get single subject details with user's topic progress merged
   */
  static async getSubjectById(subjectId, userId = null) {
    const subject = await Subject.findById(subjectId).lean();
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    let completedTopicIds = [];
    if (userId) {
      const progress = await AcademicProgress.findOne({ userId, subjectId }).lean();
      if (progress) {
        completedTopicIds = progress.completedTopicIds || [];
      }
    }

    return {
      ...subject,
      completedTopicIds,
      completionPercentage:
        subject.topics?.length > 0
          ? Math.round((completedTopicIds.length / subject.topics.length) * 100)
          : 0,
    };
  }

  /**
   * Toggle topic completion status for student
   */
  static async toggleTopicCompletion(subjectId, topicId, userId) {
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    let progress = await AcademicProgress.findOne({ userId, subjectId });
    if (!progress) {
      progress = new AcademicProgress({
        userId,
        subjectId,
        completedTopicIds: [],
      });
    }

    const isAlreadyCompleted = progress.completedTopicIds.includes(topicId);
    let action = 'TOPIC_COMPLETED';

    if (isAlreadyCompleted) {
      progress.completedTopicIds = progress.completedTopicIds.filter(id => id !== topicId);
      action = 'TOPIC_UNCOMPLETED';
    } else {
      progress.completedTopicIds.push(topicId);
    }

    progress.lastStudiedAt = new Date();
    await progress.save();

    // Emit domain activity event to trigger progress summary worker
    await ActivityService.record({
      userId,
      module: 'academics',
      action,
      payload: {
        subjectId: subject._id.toString(),
        subjectName: subject.name,
        topicId,
        completedCount: progress.completedTopicIds.length,
        totalTopics: subject.topics?.length || 0,
      },
    });

    return {
      subjectId,
      topicId,
      completedTopicIds: progress.completedTopicIds,
      completionPercentage:
        subject.topics?.length > 0
          ? Math.round((progress.completedTopicIds.length / subject.topics.length) * 100)
          : 0,
    };
  }

  /**
   * Get resources associated with a subject
   */
  static async getResources(subjectId, type = null) {
    const query = { subjectId, isPublished: true };
    if (type) {
      query.type = type;
    }

    return AcademicResource.find(query).sort({ type: 1, year: -1, createdAt: -1 }).lean();
  }

  /**
   * Content Admin: Create subject
   */
  static async createSubject(data) {
    const created = await Subject.create(data);
    await this.invalidateSubjectCache();
    return created;
  }

  /**
   * Content Admin: Update subject
   */
  static async updateSubject(id, updateData) {
    const updated = await Subject.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    if (!updated) {
      throw new NotFoundError('Subject not found');
    }
    await this.invalidateSubjectCache();
    return updated;
  }

  /**
   * Content Admin: Create resource
   */
  static async createResource(resourceData) {
    return AcademicResource.create(resourceData);
  }

  /**
   * Cache Invalidation Helper
   */
  static async invalidateSubjectCache() {
    try {
      const redis = getRedisClient();
      logger.info('[AcademicsService] Invalidating academics subject caches');
      // For clustered redis or key scanning
      if (typeof redis.keys === 'function') {
        const keys = await redis.keys('cache:academics:*');
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
    } catch {
      // Safe to ignore cache invalidation failure
    }
  }
}

export default AcademicsService;
