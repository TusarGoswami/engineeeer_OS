import { ActivityEvent } from './activityEvent.model.js';
import { progressQueue } from '../../jobs/queues.js';
import { logger } from '../../config/logger.js';
import { ProgressWorkerService } from '../../jobs/workers/progress.worker.js';
import { env } from '../../config/env.js';

export class ActivityService {
  /**
   * Record domain activity event and queue progress aggregation
   * @param {Object} eventData - { userId, module, action, payload }
   */
  static async record({ userId, module, action, payload = {} }) {
    if (!userId || !module || !action) {
      throw new Error('ActivityService.record requires userId, module, and action');
    }

    try {
      // 1. Append event to activityEvents (TTL: 90 days)
      const event = await ActivityEvent.create({
        userId,
        module,
        action,
        payload,
        occurredAt: new Date(),
      });

      // 2. Dispatch to progress queue with idempotency key
      const queue = progressQueue();
      await queue.add(
        'aggregate-user-progress',
        {
          eventId: event._id.toString(),
          userId: userId.toString(),
          module,
          action,
          payload,
        },
        {
          jobId: `progress_${event._id.toString()}`,
        }
      );

      // In unit test environments without Redis queue worker daemon, process aggregation directly
      if (env.NODE_ENV === 'test') {
        await ProgressWorkerService.processProgressJob({
          data: {
            eventId: event._id.toString(),
            userId: userId.toString(),
            module,
            action,
            payload,
          },
        });
      }

      return event;
    } catch (error) {
      logger.error(
        { err: error.message, userId, module, action },
        '[ActivityService] Error recording event'
      );
      throw error;
    }
  }

  /**
   * Get user's recent activity stream (cursor paginated)
   */
  static async getUserActivities(userId, limit = 10, cursor = null) {
    const query = { userId };
    if (cursor) {
      query._id = { $lt: cursor };
    }

    const items = await ActivityEvent.find(query)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = items.length > limit;
    const data = hasMore ? items.slice(0, limit) : items;
    const nextCursor = hasMore && data.length > 0 ? data[data.length - 1]._id : null;

    return {
      data,
      pagination: {
        hasMore,
        nextCursor,
        limit,
      },
    };
  }
}

export default ActivityService;
