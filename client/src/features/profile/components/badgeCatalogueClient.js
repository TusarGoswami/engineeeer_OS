/**
 * Client-side Badge Catalogue for EngineerOS
 * Mirrors server/src/modules/profile/badge.catalogue.js but without
 * the server-only check() functions.
 */
export const BADGE_CATALOGUE = [
  // ── Streaks ──
  {
    badgeId: 'streak_7',
    name: 'Week of Fire',
    description:
      'Maintained an active engineering streak for 7 consecutive days',
    tier: 'bronze',
    category: 'streak',
  },
  {
    badgeId: 'streak_30',
    name: 'Monthly Engine',
    description:
      'Maintained an active engineering streak for 30 consecutive days',
    tier: 'silver',
    category: 'streak',
  },
  {
    badgeId: 'streak_100',
    name: 'Centurion Streak',
    description: '100 days of relentless engineering consistency',
    tier: 'platinum',
    category: 'streak',
  },

  // ── Coding / DSA ──
  {
    badgeId: 'coding_first',
    name: 'Hello World',
    description:
      'Solved your first DSA algorithmic challenge on EngineerOS',
    tier: 'bronze',
    category: 'coding',
  },
  {
    badgeId: 'coding_25',
    name: 'Algorithm Apprentice',
    description:
      'Solved 25 algorithmic problems across arrays, trees, and graphs',
    tier: 'bronze',
    category: 'coding',
  },
  {
    badgeId: 'coding_50',
    name: 'Code Virtuoso',
    description:
      'Achieved 50 solved DSA problems with verified test case passing',
    tier: 'bronze',
    category: 'coding',
  },
  {
    badgeId: 'coding_100',
    name: 'DSA Centurion',
    description: 'Solved 100 competitive programming challenges',
    tier: 'gold',
    category: 'coding',
  },

  // ── GATE Preparation ──
  {
    badgeId: 'gate_debut',
    name: 'GATE Aspirant',
    description:
      'Completed your first full-length timed GATE mock examination',
    tier: 'bronze',
    category: 'gate',
  },
  {
    badgeId: 'gate_veteran',
    name: 'Exam Veteran',
    description:
      'Completed 5 GATE mock tests with automated topic diagnostics',
    tier: 'silver',
    category: 'gate',
  },

  // ── Mock Interviews ──
  {
    badgeId: 'interview_first',
    name: 'System Candidate',
    description:
      'Completed your first technical AI mock interview session',
    tier: 'bronze',
    category: 'interviews',
  },

  // ── Community ──
  {
    badgeId: 'community_helper',
    name: 'Senior Counsel',
    description:
      'Had an answer accepted by a peer in the engineering community',
    tier: 'bronze',
    category: 'community',
  },

  // ── Academics ──
  {
    badgeId: 'academic_master',
    name: 'Honor Roll',
    description:
      'Completed 100% of syllabus topics for the active semester',
    tier: 'silver',
    category: 'academics',
  },

  // ── Alumni & Faculty Verification ──
  {
    badgeId: 'alumni_verified',
    name: 'Verified Alumni Mentor',
    description:
      'Officially verified alumni engineer offering mentorship and guidance',
    tier: 'gold',
    category: 'community',
  },
];

export const CUSTOM_BADGE_ARTWORK = {
  streak_30: {
    front: '/badges/monthly-engine-front.png',
    back: '/badges/centurion-streak-back.png',
  },
  streak_100: {
    front: '/badges/centurion-streak-front.png',
    back: '/badges/centurion-streak-back.png',
  },
  coding_50: {
    front: '/badges/code-virtuoso-front.png',
    back: '/badges/centurion-streak-back.png',
  },
  coding_100: {
    front: '/badges/dsa-centurion-front.png',
    back: '/badges/centurion-streak-back.png',
  },
  gate_veteran: {
    front: '/badges/exam-veteran-front.png',
    back: '/badges/centurion-streak-back.png',
  },
  alumni_verified: {
    front: '/badges/alumni-mentor-front.png',
    back: '/badges/centurion-streak-back.png',
  },
};

export const HEX_CLIP_PATH = 'polygon(50% 2%, 93% 25%, 93% 75%, 50% 98%, 7% 75%, 7% 25%)';

export default BADGE_CATALOGUE;

