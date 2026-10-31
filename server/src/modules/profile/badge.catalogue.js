/**
 * Deterministic Badge Catalogue for EngineerOS
 */
export const BADGE_CATALOGUE = [
  // Streaks
  {
    badgeId: 'streak_7',
    name: 'Week of Fire',
    description: 'Maintained an active engineering streak for 7 consecutive days',
    icon: '🔥',
    tier: 'bronze',
    category: 'streak',
    check: (stats) => (stats.streaks?.currentStreak || 0) >= 7,
  },
  {
    badgeId: 'streak_30',
    name: 'Monthly Engine',
    description: 'Maintained an active engineering streak for 30 consecutive days',
    icon: '⚡',
    tier: 'silver',
    category: 'streak',
    check: (stats) => (stats.streaks?.currentStreak || 0) >= 30,
  },
  {
    badgeId: 'streak_100',
    name: 'Centurion Streak',
    description: '100 days of relentless engineering consistency',
    icon: '👑',
    tier: 'platinum',
    category: 'streak',
    check: (stats) => (stats.streaks?.currentStreak || 0) >= 100,
  },

  // Coding / DSA
  {
    badgeId: 'coding_first',
    name: 'Hello World',
    description: 'Solved your first DSA algorithmic challenge on EngineerOS',
    icon: '💻',
    tier: 'bronze',
    category: 'coding',
    check: (stats) => (stats.coding?.solvedCount || 0) >= 1,
  },
  {
    badgeId: 'coding_25',
    name: 'Algorithm Apprentice',
    description: 'Solved 25 algorithmic problems across arrays, trees, and graphs',
    icon: '⚔️',
    tier: 'bronze',
    category: 'coding',
    check: (stats) => (stats.coding?.solvedCount || 0) >= 25,
  },
  {
    badgeId: 'coding_50',
    name: 'Code Virtuoso',
    description: 'Achieved 50 solved DSA problems with verified test case passing',
    icon: '🎯',
    tier: 'silver',
    category: 'coding',
    check: (stats) => (stats.coding?.solvedCount || 0) >= 50,
  },
  {
    badgeId: 'coding_100',
    name: 'DSA Centurion',
    description: 'Solved 100 competitive programming challenges',
    icon: '🏆',
    tier: 'gold',
    category: 'coding',
    check: (stats) => (stats.coding?.solvedCount || 0) >= 100,
  },

  // GATE Preparation
  {
    badgeId: 'gate_debut',
    name: 'GATE Aspirant',
    description: 'Completed your first full-length timed GATE mock examination',
    icon: '📝',
    tier: 'bronze',
    category: 'gate',
    check: (stats) => (stats.gate?.testsTaken || 0) >= 1,
  },
  {
    badgeId: 'gate_veteran',
    name: 'Exam Veteran',
    description: 'Completed 5 GATE mock tests with automated topic diagnostics',
    icon: '🛡️',
    tier: 'silver',
    category: 'gate',
    check: (stats) => (stats.gate?.testsTaken || 0) >= 5,
  },

  // Mock Interviews
  {
    badgeId: 'interview_first',
    name: 'System Candidate',
    description: 'Completed your first technical AI mock interview session',
    icon: '🎙️',
    tier: 'bronze',
    category: 'interviews',
    check: (stats) => (stats.interviews?.completedCount || 0) >= 1,
  },

  // Community
  {
    badgeId: 'community_helper',
    name: 'Senior Counsel',
    description: 'Had an answer accepted by a peer in the engineering community',
    icon: '🤝',
    tier: 'bronze',
    category: 'community',
    check: (stats) => (stats.community?.acceptedAnswersCount || 0) >= 1,
  },

  // Academics
  {
    badgeId: 'academic_master',
    name: 'Honor Roll',
    description: 'Completed 100% of syllabus topics for the active semester',
    icon: '🎓',
    tier: 'silver',
    category: 'academics',
    check: (stats) => (stats.academics?.completionPercentage || 0) >= 100,
  },
];

export default BADGE_CATALOGUE;

