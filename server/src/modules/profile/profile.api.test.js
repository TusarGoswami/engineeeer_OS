import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import '../../test/setupDb.js';
import { createApp } from '../../app.js';
import { User } from '../users/user.model.js';
import { TokenService } from '../auth/token.service.js';
import { ProfileSnapshotService } from './profileSnapshot.service.js';

describe('Profile Module API Integration Tests (Phase 7)', () => {
  const app = createApp();
  let studentUser;
  let studentToken;

  beforeEach(async () => {
    studentUser = await User.create({
      email: `student_profile_${Date.now()}@engineeros.dev`,
      username: `student_${Date.now()}`,
      passwordHash: 'hashedPass123',
      name: 'Aditya Verma',
      headline: 'Competitive Programmer & Cloud Enthusiast',
      university: 'BITS Pilani',
      branch: 'Computer Science and Engineering',
      semester: 6,
      profileSettings: {
        visibility: 'public',
        theme: 'silicon',
        sections: {
          showHeatmap: true,
          showGate: true,
          showInterviews: true,
          showUniversity: true,
          showPhoto: true,
          showSkills: true,
          showBadges: true,
        },
      },
    });

    studentToken = TokenService.signAccessToken({
      _id: studentUser._id,
      role: studentUser.role,
      email: studentUser.email,
      name: studentUser.name,
    });

    // Populate initial activity & snapshot
    await ProfileSnapshotService.recordDailyActivity(studentUser._id, 'coding');
    await ProfileSnapshotService.rebuildSnapshot(studentUser._id);
  });

  describe('Owner Profile Endpoints (GET / PATCH / REGENERATE)', () => {
    it('GET /api/v1/profile/me retrieves full owner profile and share metadata', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile).toBeDefined();
      expect(res.body.data.profile.identity.name).toBe('Aditya Verma');
      expect(res.body.data.settings.theme).toBe('silicon');
      expect(res.body.data.shareUrl).toContain(studentUser.username);
    });

    it('blocks unauthenticated access to /api/v1/profile/me', async () => {
      const res = await request(app).get('/api/v1/profile/me');
      expect(res.status).toBe(401);
    });

    it('PATCH /api/v1/profile/me updates theme, headline, and privacy toggles', async () => {
      const res = await request(app)
        .patch('/api/v1/profile/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          headline: 'Full-Stack Distributed Systems Architect',
          profileSettings: {
            theme: 'terminal',
            visibility: 'unlisted',
            sections: {
              showGate: false,
              showUniversity: false,
            },
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.settings.theme).toBe('terminal');
      expect(res.body.data.settings.visibility).toBe('unlisted');
      expect(res.body.data.settings.sections.showGate).toBe(false);
      expect(res.body.data.settings.sections.showUniversity).toBe(false);
      expect(res.body.data.profile.identity.headline).toBe('Full-Stack Distributed Systems Architect');
    });

    it('POST /api/v1/profile/me/regenerate-share-token rotates unlisted share token', async () => {
      const oldToken = studentUser.profileSettings?.shareToken;
      const res = await request(app)
        .post('/api/v1/profile/me/regenerate-share-token')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.shareToken).toBeDefined();
      expect(res.body.data.shareToken).not.toBe(oldToken);
      expect(res.body.data.shareUrl).toContain(res.body.data.shareToken);
    });

    it('GET /api/v1/profile/me/badges lists badges with unlock state', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me/badges')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('badgeId');
      expect(res.body.data[0]).toHaveProperty('isUnlocked');
    });

    it('GET /api/v1/profile/me/heatmap retrieves activity calendar and streaks', async () => {
      const res = await request(app)
        .get('/api/v1/profile/me/heatmap')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty('days');
      expect(res.body.data).toHaveProperty('currentStreak');
      expect(res.body.data).toHaveProperty('totalActiveDays');
    });
  });

  describe('Public Profile & Server-Side Privacy Filtering (GET /api/v1/profile/:username)', () => {
    it('returns sanitized public card for public profile without exposing sensitive fields', async () => {
      const res = await request(app).get(`/api/v1/profile/${studentUser.username}`);

      expect(res.status).toBe(200);
      expect(res.body.data.card).toBeDefined();
      expect(res.body.data.card.identity.name).toBe('Aditya Verma');
      expect(res.body.data.theme).toBe('silicon');

      // Assert private fields are NEVER leaked
      expect(res.body.data.card.email).toBeUndefined();
      expect(res.body.data.card.passwordHash).toBeUndefined();
      expect(res.body.data.card.userId).toBeUndefined();
      expect(res.body.data.card.shareToken).toBeUndefined();
    });

    it('enforces private visibility: returns 403 Forbidden', async () => {
      await User.findByIdAndUpdate(studentUser._id, {
        'profileSettings.visibility': 'private',
      });

      const res = await request(app).get(`/api/v1/profile/${studentUser.username}`);
      expect(res.status).toBe(403);
    });

    it('enforces unlisted visibility: requires valid share token in query parameter', async () => {
      await User.findByIdAndUpdate(studentUser._id, {
        'profileSettings.visibility': 'unlisted',
      });

      // Without token -> 404
      const deniedRes = await request(app).get(`/api/v1/profile/${studentUser.username}`);
      expect(deniedRes.status).toBe(404);

      // With wrong token -> 404
      const wrongTokenRes = await request(app).get(`/api/v1/profile/${studentUser.username}?token=invalidToken`);
      expect(wrongTokenRes.status).toBe(404);

      // With authentic token -> 200 OK
      const validToken = studentUser.profileSettings.shareToken;
      const allowedRes = await request(app).get(
        `/api/v1/profile/${studentUser.username}?token=${validToken}`
      );
      expect(allowedRes.status).toBe(200);
      expect(allowedRes.body.data.card.identity.name).toBe('Aditya Verma');
    });

    it('server-side omits disabled sections from public JSON payload', async () => {
      // Toggle off university, gate stats, and heatmap
      await User.findByIdAndUpdate(studentUser._id, {
        'profileSettings.sections.showUniversity': false,
        'profileSettings.sections.showGate': false,
        'profileSettings.sections.showHeatmap': false,
      });

      const res = await request(app).get(`/api/v1/profile/${studentUser.username}`);
      expect(res.status).toBe(200);

      const card = res.body.data.card;
      // University must be completely deleted from identity
      expect(card.identity.university).toBeUndefined();
      // GATE stats must be completely deleted from stats
      expect(card.stats.gate).toBeUndefined();
      // Heatmap activity array must be completely deleted
      expect(card.recentActivity).toBeUndefined();

      // Remaining allowed sections must still be present
      expect(card.identity.name).toBe('Aditya Verma');
      expect(card.stats.coding).toBeDefined();
    });
  });
});
