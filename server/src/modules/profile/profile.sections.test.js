import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileService } from './profile.service.js';
import { ProfileRepository } from './profile.repository.js';
import { ProfileSnapshotService } from './profileSnapshot.service.js';
import { User } from '../users/user.model.js';
import { ProgressSummary } from '../progress/progressSummary.model.js';
import { GateAttempt } from '../gate/gateAttempt.model.js';
import { CommunityPost } from '../community/communityPost.model.js';
import { CommunityReply } from '../community/communityReply.model.js';
import { DailyActivity } from '../progress/dailyActivity.model.js';
import { UserBadge } from './userBadge.model.js';

const chainLean = (val) => ({
  sort: () => ({
    limit: () => ({ lean: () => Promise.resolve(val) }),
    populate: () => ({ lean: () => Promise.resolve(val) }),
    lean: () => Promise.resolve(val),
  }),
  populate: () => ({ lean: () => Promise.resolve(val) }),
  lean: () => Promise.resolve(val),
});

describe('Profile Displayed Sections — Backend Snapshot & Privacy Filtering', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('populates gate accuracy, verified vs unverified skills, topicTags, and chronological recentActivity', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Alex Johnson',
      username: 'alexj',
      university: 'MIT',
      branch: 'Computer Science',
      semester: 4,
      profile: { graduationYear: 2027, currentCompany: '' },
      timezone: 'UTC',
    };

    const mockSummary = {
      codingStats: {
        solvedCount: 16,
        easyCount: 10,
        mediumCount: 5,
        hardCount: 1,
        accuracyRate: 75,
        topicCoverage: ['Arrays', 'Dynamic Programming'],
      },
      gateStats: {
        testsAttempted: 2,
        averageScore: 68,
        accuracyRate: 72,
      },
      academicsStats: {
        percentComplete: 43,
        subjectsInProgress: 4,
      },
      interviewStats: {
        sessionsCompleted: 0,
        averageReadinessScore: 0,
      },
    };

    vi.spyOn(User, 'findById').mockReturnValue({ lean: () => Promise.resolve(mockUser) });
    vi.spyOn(ProgressSummary, 'findOne').mockReturnValue({ lean: () => Promise.resolve(mockSummary) });
    vi.spyOn(GateAttempt, 'findOne').mockReturnValue(
      chainLean({ score: 74, accuracyRate: 80, testId: { subject: 'Operating Systems' } })
    );
    vi.spyOn(CommunityPost, 'countDocuments').mockResolvedValue(1);
    vi.spyOn(CommunityReply, 'countDocuments').mockResolvedValue(0);
    vi.spyOn(CommunityPost, 'aggregate').mockResolvedValue([{ total: 2 }]);
    vi.spyOn(CommunityReply, 'aggregate').mockResolvedValue([]);
    vi.spyOn(ProfileSnapshotService, 'calculateStreaks').mockResolvedValue({
      currentStreak: 4,
      longestStreak: 7,
      totalActiveDays: 10,
      lastActiveDate: '2026-11-28',
    });
    vi.spyOn(ProfileSnapshotService, 'evaluateBadges').mockResolvedValue([]);
    vi.spyOn(UserBadge, 'find').mockReturnValue(chainLean([]));
    // DailyActivity returns newest first
    vi.spyOn(DailyActivity, 'find').mockReturnValue(
      chainLean([
        { date: '2026-11-28', counts: { total: 5 } },
        { date: '2026-11-27', counts: { total: 2 } },
      ])
    );

    const upsertSpy = vi
      .spyOn(await import('./profileSnapshot.model.js').then((m) => m.ProfileSnapshot), 'findOneAndUpdate')
      .mockImplementation((_q, update) => Promise.resolve(update.$set));

    const snapshot = await ProfileSnapshotService.rebuildSnapshot(mockUser._id);

    expect(upsertSpy).toHaveBeenCalled();
    expect(snapshot.stats.gate).toEqual(
      expect.objectContaining({
        testsTaken: 2,
        averageScore: 68,
        bestScore: 74,
        accuracy: 72,
        topSubject: 'Operating Systems',
      })
    );
    expect(snapshot.topicTags).toEqual(['Arrays', 'Dynamic Programming']);
    // Earned coding/gate/academics skills are verified; 0-score interviews skill stays verified: false
    expect(snapshot.topSkills.find((s) => s.category === 'coding')?.verified).toBe(true);
    expect(snapshot.topSkills.find((s) => s.category === 'interviews')?.verified).toBe(false);
    // Chronological order (oldest -> newest)
    expect(snapshot.recentActivity).toEqual([
      { date: '2026-11-27', count: 2 },
      { date: '2026-11-28', count: 5 },
    ]);
  });

  it('strips all academic identity, streaks, and topicTags when privacy toggles are disabled on public profile', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      username: 'alexj',
      profileSettings: {
        visibility: 'public',
        theme: 'blueprint',
        sections: {
          showHeatmap: false,
          showGate: false,
          showInterviews: false,
          showUniversity: false,
          showPhoto: false,
          showSkills: false,
          showBadges: false,
        },
      },
    };

    const mockSnapshot = {
      identity: {
        name: 'Alex Johnson',
        username: 'alexj',
        university: 'MIT',
        branch: 'CSE',
        semester: 4,
        graduationYear: 2027,
        avatarKey: 'av_1.webp',
        avatarUrl: '/api/v1/users/avatar/av_1.webp',
      },
      stats: {
        coding: { solvedCount: 10 },
        gate: { testsTaken: 2, accuracy: 72 },
        interviews: { completedCount: 1, averageReadiness: 80 },
        streaks: { currentStreak: 7, longestStreak: 14 },
      },
      recentActivity: [{ date: '2026-11-28', count: 3 }],
      topSkills: [{ name: 'Algorithms & Data Structures', score: 40, verified: true }],
      topicTags: ['Arrays'],
      badges: [{ badgeId: 'coding_first', name: 'Hello World', tier: 'bronze' }],
    };

    vi.spyOn(ProfileRepository, 'findUserByUsername').mockResolvedValue(mockUser);
    vi.spyOn(ProfileRepository, 'findSnapshotByUserId').mockResolvedValue(mockSnapshot);

    const res = await ProfileService.getPublicProfile('alexj');

    expect(res.sections).toEqual({
      showHeatmap: false,
      showGate: false,
      showInterviews: false,
      showUniversity: false,
      showPhoto: false,
      showSkills: false,
      showBadges: false,
    });
    expect(res.card.identity.university).toBeUndefined();
    expect(res.card.identity.branch).toBeUndefined();
    expect(res.card.identity.semester).toBeUndefined();
    expect(res.card.identity.graduationYear).toBeUndefined();
    expect(res.card.identity.avatarKey).toBeUndefined();
    expect(res.card.identity.avatarUrl).toBeUndefined();
    expect(res.card.stats.gate).toBeUndefined();
    expect(res.card.stats.interviews).toBeUndefined();
    expect(res.card.stats.streaks).toBeUndefined();
    expect(res.card.recentActivity).toBeUndefined();
    expect(res.card.topSkills).toBeUndefined();
    expect(res.card.topicTags).toBeUndefined();
    expect(res.card.badges).toBeUndefined();
    expect(res.card.identity.name).toBe('Alex Johnson');
  });
});

