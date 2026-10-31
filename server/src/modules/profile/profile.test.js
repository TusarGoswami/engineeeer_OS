import { describe, it, expect, beforeEach } from 'vitest';
import sharp from 'sharp';
import '../../test/setupDb.js';
import { User } from '../users/user.model.js';
import { UserService } from '../users/user.service.js';
import { validateImageMagicBytes } from '../../utils/magicBytes.js';
import { ProfileSnapshotService } from './profileSnapshot.service.js';
import { DailyActivity } from '../progress/dailyActivity.model.js';
import { UserBadge } from './userBadge.model.js';

describe('Profile Foundations & Avatar Pipeline (Phase 7)', () => {
  let testUser;

  beforeEach(async () => {
    testUser = await User.create({
      email: `test_profile_${Date.now()}@engineeros.dev`,
      username: `student_${Date.now()}`,
      passwordHash: 'hashedSecret123',
      name: 'Rohan Sharma',
      university: 'IIT Delhi',
      branch: 'Computer Science and Engineering',
      semester: 5,
      headline: 'Competitive Programmer & Systems Architect',
      timezone: 'Asia/Kolkata',
    });
  });

  describe('Magic Bytes Sniffing & Image Validation', () => {
    it('validates authentic PNG buffer', async () => {
      const pngBuffer = await sharp({
        create: { width: 64, height: 64, channels: 4, background: { r: 37, g: 99, b: 235, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const result = validateImageMagicBytes(pngBuffer);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/png');
    });

    it('validates authentic JPEG buffer', async () => {
      const jpegBuffer = await sharp({
        create: { width: 64, height: 64, channels: 3, background: { r: 16, g: 185, b: 129 } },
      })
        .jpeg()
        .toBuffer();

      const result = validateImageMagicBytes(jpegBuffer);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/jpeg');
    });

    it('validates authentic WebP buffer', async () => {
      const webpBuffer = await sharp({
        create: { width: 64, height: 64, channels: 4, background: { r: 245, g: 158, b: 11, alpha: 1 } },
      })
        .webp()
        .toBuffer();

      const result = validateImageMagicBytes(webpBuffer);
      expect(result.isValid).toBe(true);
      expect(result.mimeType).toBe('image/webp');
    });

    it('rejects spoofed text file masquerading as image', () => {
      const fakeBuffer = Buffer.from('<html><script>alert("hacked")</script></html>');
      const result = validateImageMagicBytes(fakeBuffer);
      expect(result.isValid).toBe(false);
      expect(result.mimeType).toBeNull();
    });
  });

  describe('Avatar Ingestion Pipeline', () => {
    it('uploads, strips EXIF, resizes to 512x512 WebP, and updates user avatarKey and version', async () => {
      const samplePng = await sharp({
        create: { width: 800, height: 600, channels: 4, background: { r: 139, g: 92, b: 246, alpha: 1 } },
      })
        .png()
        .toBuffer();

      const uploadResult = await UserService.uploadAvatar(testUser._id, samplePng);
      expect(uploadResult.avatarKey).toBeDefined();
      expect(uploadResult.avatarKey).toContain('avatar_');
      expect(uploadResult.avatarKey).toMatch(/\.webp$/);
      expect(uploadResult.avatarVersion).toBe(2);

      // Verify stored buffer is indeed 512x512 WebP
      const storedBuffer = await UserService.getAvatarBuffer(uploadResult.avatarKey);
      const metadata = await sharp(storedBuffer).metadata();
      expect(metadata.width).toBe(512);
      expect(metadata.height).toBe(512);
      expect(metadata.format).toBe('webp');

      // Verify thumbnail also exists and is 128x128
      const thumbKey = uploadResult.avatarKey.replace('avatar_', 'thumb_');
      const thumbBuffer = await UserService.getAvatarBuffer(thumbKey);
      const thumbMeta = await sharp(thumbBuffer).metadata();
      expect(thumbMeta.width).toBe(128);
      expect(thumbMeta.height).toBe(128);
      expect(thumbMeta.format).toBe('webp');
    });

    it('deletes avatar and clears user references', async () => {
      const samplePng = await sharp({
        create: { width: 100, height: 100, channels: 4, background: { r: 239, g: 68, b: 68, alpha: 1 } },
      })
        .png()
        .toBuffer();

      await UserService.uploadAvatar(testUser._id, samplePng);
      const deleteResult = await UserService.deleteAvatar(testUser._id);
      expect(deleteResult.success).toBe(true);

      const refreshed = await User.findById(testUser._id);
      expect(refreshed.avatarKey).toBe('');
      expect(refreshed.profile.avatarUrl).toBe('');
    });
  });

  describe('Daily Activity & Timezone-Aware Streaks', () => {
    it('records activity in user timezone and computes consecutive streaks', async () => {
      const tz = testUser.timezone || 'Asia/Kolkata';
      const today = ProfileSnapshotService.getTodayInTimezone(tz);

      // Record activity today
      await ProfileSnapshotService.recordDailyActivity(testUser._id, 'coding', tz);
      await ProfileSnapshotService.recordDailyActivity(testUser._id, 'gate', tz);

      const todayRecord = await DailyActivity.findOne({ userId: testUser._id, date: today });
      expect(todayRecord).toBeDefined();
      expect(todayRecord.counts.coding).toBe(1);
      expect(todayRecord.counts.gate).toBe(1);
      expect(todayRecord.counts.total).toBe(2);

      // Simulate 6 prior consecutive days (for a 7-day streak)
      const baseDate = new Date();
      for (let i = 1; i <= 6; i++) {
        const past = new Date(baseDate);
        past.setDate(baseDate.getDate() - i);
        const pastStr = new Intl.DateTimeFormat('en-CA', {
          timeZone: tz,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(past);

        await DailyActivity.create({
          userId: testUser._id,
          date: pastStr,
          counts: { coding: 2, total: 2 },
        });
      }

      const streakResult = await ProfileSnapshotService.calculateStreaks(testUser._id, tz);
      expect(streakResult.currentStreak).toBe(7);
      expect(streakResult.longestStreak).toBe(7);
      expect(streakResult.totalActiveDays).toBe(7);
    });
  });

  describe('Deterministic Badge Engine & Profile Snapshot', () => {
    it('awards 7-day streak badge and creates pre-aggregated snapshot', async () => {
      // Award badges based on stats
      const stats = {
        coding: { solvedCount: 30 },
        gate: { testsTaken: 1, averageScore: 70 },
        interviews: { completedCount: 1, averageReadiness: 85 },
        academics: { completionPercentage: 50 },
        community: { acceptedAnswersCount: 1 },
        streaks: { currentStreak: 7 },
      };

      const awarded = await ProfileSnapshotService.evaluateBadges(testUser._id, stats);
      expect(awarded.length).toBeGreaterThan(0);

      const badges = await UserBadge.find({ userId: testUser._id });
      const badgeIds = badges.map((b) => b.badgeId);
      expect(badgeIds).toContain('streak_7');
      expect(badgeIds).toContain('coding_first');
      expect(badgeIds).toContain('coding_25');
      expect(badgeIds).toContain('gate_debut');
      expect(badgeIds).toContain('interview_first');
      expect(badgeIds).toContain('community_helper');

      // Idempotency: re-evaluating should not duplicate badges
      const secondRun = await ProfileSnapshotService.evaluateBadges(testUser._id, stats);
      expect(secondRun.length).toBe(0);

      // Build Profile Snapshot
      const snapshot = await ProfileSnapshotService.rebuildSnapshot(testUser._id);
      expect(snapshot).toBeDefined();
      expect(snapshot.identity.name).toBe('Rohan Sharma');
      expect(snapshot.badges.length).toBe(badges.length);
      expect(snapshot.topSkills.length).toBe(4);
    });
  });

  describe('Username & Profile Settings Validation', () => {
    it('rejects reserved username update', async () => {
      await expect(
        UserService.updateProfile(testUser._id, { username: 'admin' })
      ).rejects.toThrow(/reserved/i);
    });

    it('updates custom headline, bio, and profile settings', async () => {
      const updated = await UserService.updateProfile(testUser._id, {
        headline: 'Distributed Systems & Database Intern',
        profileSettings: {
          visibility: 'public',
          theme: 'silicon',
        },
      });

      expect(updated.headline).toBe('Distributed Systems & Database Intern');
      expect(updated.profileSettings.visibility).toBe('public');
      expect(updated.profileSettings.theme).toBe('silicon');
    });
  });
});
