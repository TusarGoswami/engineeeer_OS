import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import '../../test/setupDb.js';
import { User } from '../users/user.model.js';
import { TokenService } from '../auth/token.service.js';
import { Notification } from './notification.model.js';

describe('Notifications Module Integration', () => {
  const app = createApp();
  let studentToken;
  let studentUser;
  let testNotificationId;

  beforeEach(async () => {
    studentUser = await User.create({
      email: 'notif_student@engineeros.dev',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$dummyhash',
      name: 'Notif Student',
      role: 'student',
      isEmailVerified: true,
      profile: { college: 'IIT Bombay', department: 'CSE', year: 3, semester: 6 },
    });

    studentToken = TokenService.signAccessToken(studentUser);

    // Create 2 test notifications
    const n1 = await Notification.create({
      userId: studentUser._id,
      title: 'New Reply Received',
      message: 'Senior Jane replied to your question about Compiler Design',
      type: 'community',
      link: '/community/post-1',
    });
    testNotificationId = n1._id.toString();

    await Notification.create({
      userId: studentUser._id,
      title: 'Assessment Scheduled',
      message: 'Operating Systems Midterm starts tomorrow at 10 AM',
      type: 'assessment',
      link: '/assessments',
    });
  });

  it('GET /api/v1/notifications lists notifications and unreadCount', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBe(2);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('PATCH /api/v1/notifications/:id/read marks single notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${testNotificationId}/read`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.body.data.unreadCount).toBe(1);
  });

  it('PATCH /api/v1/notifications/read-all marks all user notifications as read', async () => {
    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listRes.body.data.unreadCount).toBe(0);
  });
});
