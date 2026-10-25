import { Notification } from './notification.model.js';

export class NotificationsService {
  static async getNotifications(userId, limit = 20) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  static async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, isRead: false });
  }

  static async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true }
    );
  }

  static async markAllAsRead(userId) {
    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });
    return { success: true };
  }
}

export default NotificationsService;
