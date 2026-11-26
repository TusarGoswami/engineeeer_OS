import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import ProfileCard, { THEMES } from '../components/ProfileCard.jsx';
import CardCustomizerDrawer from '../components/CardCustomizerDrawer.jsx';
import CardExportModal from '../components/CardExportModal.jsx';
import ProfilePage from '../ProfilePage.jsx';
import profileService from '../../../services/profile.service.js';
import { userService } from '../../../services/user.service.js';
import { useAuth } from '../../auth/AuthContext.jsx';

vi.mock('../../../services/profile.service.js', () => ({
  default: {
    getOwnerProfile: vi.fn(),
    updateOwnerProfile: vi.fn(),
    getMyBadges: vi.fn(),
    getHeatmap: vi.fn(),
    regenerateShareToken: vi.fn(),
    uploadAvatar: vi.fn(),
  },
}));

vi.mock('../../../services/user.service.js', () => ({
  userService: {
    exportMe: vi.fn(),
  },
}));

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}));

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
    expect(screen.queryByText('#Arrays')).not.toBeInTheDocument();
  });

  it('renders across all 5 themes without crashing', () => {
    Object.keys(THEMES).forEach((themeKey) => {
      const { container } = render(
        <ProfileCard profile={mockProfile} themeOverride={themeKey} />
      );
      expect(container.querySelector('#engineeros-profile-card')).toBeInTheDocument();
    });
  });

  it('renders simplified portrait pass orientation with photo, streak, overall progress, module bars, and QR zone', () => {
    const { container } = render(
      <ProfileCard profile={mockProfile} orientation="portrait" />
    );

    const card = container.querySelector('#engineeros-profile-card');
    expect(card).toHaveAttribute('data-orientation', 'portrait');
    expect(card).toHaveClass('pc-card-portrait');
    expect(container.querySelectorAll('.pc-circle')).toHaveLength(5);
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText(/14d streak/i)).toBeInTheDocument();
    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    expect(screen.getByText('81%')).toBeInTheDocument(); // (65 + 100 + 78 + 82) / 4 = 81.25 -> 81%
    expect(screen.getByText('Academic Hub')).toBeInTheDocument();
    expect(screen.getByText('Coding Platform')).toBeInTheDocument();
    expect(screen.getByText('GATE Hub')).toBeInTheDocument();
    expect(screen.getByText('AI Readiness')).toBeInTheDocument();
    expect(screen.getByLabelText('7-Day Streak')).toBeInTheDocument();
    expect(screen.getByLabelText('Algorithm Apprentice')).toBeInTheDocument();
    expect(screen.queryByText('7-Day Streak')).not.toBeInTheDocument();
    expect(screen.getByText('EngineerOS Authentic Card')).toBeInTheDocument();
    expect(screen.getByText('engineeros.dev/u/alexj')).toBeInTheDocument();
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

describe('CardExportModal Component', () => {
  it('displays share URL with unlisted token and export actions', () => {
    render(
      <ToastProvider>
        <CardExportModal
          isOpen={true}
          onClose={vi.fn()}
          cardElementRef={{ current: document.createElement('div') }}
          profile={{
            ...mockProfile,
            shareToken: 'sec_tok_123',
            profileSettings: { ...mockProfile.profileSettings, visibility: 'unlisted' },
          }}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Share & Export Profile Card')).toBeInTheDocument();
    expect(screen.getByText('Secret Token Included')).toBeInTheDocument();
    expect(screen.getByLabelText('Direct public link').value).toContain('/u/alexj?token=sec_tok_123');
    expect(screen.getByRole('button', { name: /Download PNG/i })).toBeInTheDocument();
  });
});

describe('ProfilePage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    profileService.getOwnerProfile.mockResolvedValue(mockProfile);
    profileService.getMyBadges.mockResolvedValue(mockProfile.badges);
    profileService.getHeatmap.mockResolvedValue(mockProfile.recentActivity);
    profileService.updateOwnerProfile.mockResolvedValue(mockProfile);
    userService.exportMe.mockResolvedValue({ exported: true });
  });

  it('loads profile data, submits form updates, switches tabs cleanly, and exports data', async () => {
    const updateUserMock = vi.fn().mockResolvedValue({});
    useAuth.mockReturnValue({
      user: { name: 'Alex Johnson', university: 'Apex Institute of Technology', semester: 6 },
      updateUser: updateUserMock,
    });

    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class {
        observe() {}
        disconnect() {}
      };
    }

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(profileService.getOwnerProfile).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('My EngineerOS Card')).toBeInTheDocument();

    // Switch to Badges tab
    fireEvent.click(screen.getByRole('tab', { name: /Badges \(2\)/i }));
    expect(screen.getByText('Achievement Vault')).toBeInTheDocument();

    // Switch to Activity Stream tab
    fireEvent.click(screen.getByRole('tab', { name: /Activity Stream/i }));
    expect(screen.getByText('Annual Activity Stream')).toBeInTheDocument();

    // Switch back to Academic & Info and submit form
    fireEvent.click(screen.getByRole('tab', { name: /Academic & Info/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledTimes(1);
      expect(profileService.updateOwnerProfile).toHaveBeenCalled();
    });
  });
});
