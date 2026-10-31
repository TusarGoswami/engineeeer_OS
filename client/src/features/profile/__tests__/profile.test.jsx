import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProfileCard, { THEMES } from '../components/ProfileCard.jsx';
import CardCustomizerDrawer from '../components/CardCustomizerDrawer.jsx';
import ToastProvider from '../../../components/Toast.jsx';

const mockProfile = {
  identity: {
    name: 'Alex Johnson',
    username: 'alexj',
    headline: 'Systems Engineer & DSA Enthusiast',
    university: 'Apex Institute of Technology',
    branch: 'Computer Science & Engineering',
    semester: 6,
    graduationYear: 2026,
    avatarUrl: '/avatar.png',
  },
  stats: {
    coding: { solved: 42, easy: 20, medium: 18, hard: 4, accuracy: 84 },
    gate: { testsTaken: 5, bestScore: 68.5, accuracy: 78 },
    academic: { subjectsEnrolled: 6, syllabusProgress: 65 },
    interviews: { completed: 3, averageScore: 82 },
    streaks: { current: 14, longest: 28 },
  },
  topSkills: ['Arrays', 'Dynamic Programming', 'OS'],
  badges: [
    { badgeId: 'streak_7', name: '7-Day Streak', icon: '🔥', tier: 'bronze' },
    { badgeId: 'coding_25', name: 'Algorithm Apprentice', icon: '⚡', tier: 'silver' },
  ],
  recentActivity: [
    { date: '2026-10-30', count: 4 },
    { date: '2026-10-31', count: 6 },
  ],
  profileSettings: {
    theme: 'terminal',
    visibility: 'public',
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
};

describe('ProfileCard Component', () => {
  it('renders student identity and stats in default terminal theme', () => {
    render(<ProfileCard profile={mockProfile} />);

    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('@alexj')).toBeInTheDocument();
    expect(screen.getByText('Systems Engineer & DSA Enthusiast')).toBeInTheDocument();
    expect(screen.getByText('Apex Institute of Technology')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // Coding solved
    expect(screen.getByText(/14d streak/i)).toBeInTheDocument();
    expect(screen.getByText('7-Day Streak')).toBeInTheDocument();
    expect(screen.getByText('#Arrays')).toBeInTheDocument();
  });

  it('renders across all 5 themes without crashing', () => {
    Object.keys(THEMES).forEach((themeKey) => {
      const { container } = render(
        <ProfileCard profile={mockProfile} themeOverride={themeKey} />
      );
      expect(container.querySelector('#engineeros-profile-card')).toBeInTheDocument();
    });
  });

  it('respects privacy toggles and hides toggled-off sections', () => {
    const hiddenSectionsProfile = {
      ...mockProfile,
      profileSettings: {
        theme: 'terminal',
        visibility: 'public',
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

    render(<ProfileCard profile={hiddenSectionsProfile} />);

    expect(screen.queryByText('GATE Prep')).not.toBeInTheDocument();
    expect(screen.queryByText('Readiness')).not.toBeInTheDocument();
    expect(screen.queryByText('Apex Institute of Technology')).not.toBeInTheDocument();
    expect(screen.queryByText('#Arrays')).not.toBeInTheDocument();
    expect(screen.queryByText('7-Day Streak')).not.toBeInTheDocument();
  });
});

describe('CardCustomizerDrawer Component', () => {
  it('renders theme selector and allows selection', () => {
    const onProfileUpdated = vi.fn();
    const onClose = vi.fn();

    render(
      <ToastProvider>
        <CardCustomizerDrawer
          isOpen={true}
          onClose={onClose}
          profile={mockProfile}
          onProfileUpdated={onProfileUpdated}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Visual Aesthetics Theme')).toBeInTheDocument();
    expect(screen.getByText('Terminal')).toBeInTheDocument();
    expect(screen.getByText('Minimalist')).toBeInTheDocument();
    expect(screen.getByText('Silicon Neon')).toBeInTheDocument();
    expect(screen.getByText('Varsity Academic')).toBeInTheDocument();
    expect(screen.getByText('Blueprint CAD')).toBeInTheDocument();

    // Click Minimalist theme
    fireEvent.click(screen.getByText('Minimalist'));
    expect(screen.getByText('Minimalist')).toBeInTheDocument();
  });
});

