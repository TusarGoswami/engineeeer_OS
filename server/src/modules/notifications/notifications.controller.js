import { NotificationsService } from './notifications.service.js';

export class NotificationsController {
  static async getNotifications(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const [notifications, unreadCount] = await Promise.all([
        NotificationsService.getNotifications(userId),
        NotificationsService.getUnreadCount(userId),
      ]);

      res.json({
        success: true,
        data: {
          notifications,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await NotificationsService.markAsRead(req.params.id, userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id || req.user._id;
      const data = await NotificationsService.markAllAsRead(userId);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

export default NotificationsController;
