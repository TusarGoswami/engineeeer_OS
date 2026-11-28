import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { toPng } from 'html-to-image';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import ProfileCard, { THEMES } from '../components/ProfileCard.jsx';
import AchievementGallery from '../components/AchievementGallery.jsx';
import CardCustomizerDrawer from '../components/CardCustomizerDrawer.jsx';
import CardExportModal from '../components/CardExportModal.jsx';
import AvatarCropperModal from '../components/AvatarCropperModal.jsx';
import ProfilePage from '../ProfilePage.jsx';
import PublicProfilePage from '../PublicProfilePage.jsx';
import profileService from '../../../services/profile.service.js';
import { userService } from '../../../services/user.service.js';
import { useAuth } from '../../auth/AuthContext.jsx';

vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockResolvedValue('data:image/png;base64,MOCK'),
  toBlob: vi.fn().mockResolvedValue(new Blob(['png'], { type: 'image/png' })),
}));

vi.mock('../../../services/profile.service.js', () => ({
  default: {
    getOwnerProfile: vi.fn(),
    updateOwnerProfile: vi.fn(),
    getMyBadges: vi.fn(),
    getHeatmap: vi.fn(),
    getPublicProfile: vi.fn(),
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
    const { container } = render(<ProfileCard profile={mockProfile} />);

    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.getByText('@alexj')).toBeInTheDocument();
    expect(screen.getByText('Systems Engineer & DSA Enthusiast')).toBeInTheDocument();
    expect(screen.getByText('Apex Institute of Technology')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument(); // Coding solved
    expect(screen.getByText(/14d streak/i)).toBeInTheDocument();
    expect(screen.getByText('7-Day Streak')).toBeInTheDocument();
    expect(screen.queryByText('#Arrays')).not.toBeInTheDocument();
    const landscapeCrests = container.querySelectorAll('[data-face="front"] svg');
    expect(landscapeCrests.length).toBeGreaterThanOrEqual(2);
  });

  it('renders across all 5 distinct themes and normalizes legacy brutal theme', () => {
    const themeHeaders = {
      terminal: /alexj@engineeros:~\$ id/i,
      minimalist: /NO\. 01 · ENGINEEROS INDEX/i,
      silicon: /SILICON \/\/ REV\.4/i,
      varsity: /EngineerOS Academy/i,
      blueprint: /\[SCHEMA \/\/ OS-CAD\]/i,
    };

    Object.keys(THEMES).forEach((themeKey) => {
      const { container, unmount } = render(
        <ProfileCard profile={mockProfile} themeOverride={themeKey} />
      );
      const card = container.querySelector('#engineeros-profile-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('data-card-theme', themeKey);
      expect(card).toHaveClass(`pc-theme-${themeKey}`);
      expect(screen.getByText(themeHeaders[themeKey])).toBeInTheDocument();
      unmount();
    });

    // Legacy 'brutal' maps cleanly to 'blueprint'
    const { container: legacyContainer } = render(
      <ProfileCard
        profile={{
          ...mockProfile,
          profileSettings: { ...mockProfile.profileSettings, theme: 'brutal' },
        }}
      />
    );
    const legacyCard = legacyContainer.querySelector('#engineeros-profile-card');
    expect(legacyCard).toHaveAttribute('data-card-theme', 'blueprint');
    expect(legacyCard).toHaveClass('pc-theme-blueprint');
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
    const streakBadge = screen.getByLabelText('7-Day Streak');
    const apprenticeBadge = screen.getByLabelText('Algorithm Apprentice');
    expect(streakBadge).toBeInTheDocument();
    expect(apprenticeBadge).toBeInTheDocument();
    expect(streakBadge.querySelector('[data-face="front"] svg')).toBeInTheDocument();
    expect(apprenticeBadge.querySelector('[data-face="front"] svg')).toBeInTheDocument();
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

describe('AchievementGallery Component', () => {
  it('renders all 13 3D rotating metallic medallions, unlock progress, and opens badge detail modal', () => {
    const { container } = render(<AchievementGallery earnedBadges={mockProfile.badges} />);

    expect(screen.getByText('Achievement Vault')).toBeInTheDocument();
    expect(screen.getByText('2 of 13 badges unlocked')).toBeInTheDocument();

    const medallions = container.querySelectorAll('[data-testid="achievement-badge-3d"]');
    expect(medallions).toHaveLength(13);
    expect(container.querySelectorAll('.eo-medal-rotor')).toHaveLength(13);
    expect(container.querySelectorAll('[data-face="front"]')).toHaveLength(13);
    expect(container.querySelectorAll('[data-face="side"]')).toHaveLength(13);
    expect(container.querySelectorAll('[data-face="back"]')).toHaveLength(13);

    expect(container.querySelectorAll('[data-unlocked="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-unlocked="false"]')).toHaveLength(11);

    // Reverse coin face monogram and engraved badge codes
    expect(screen.getAllByText('OS')).toHaveLength(13);
    expect(screen.getByText('STR-007')).toBeInTheDocument();
    expect(screen.getByText('DSA-025')).toBeInTheDocument();
    expect(screen.getByText('ALU-PRO')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Week of Fire — Unlocked Bronze badge/i }));
    expect(screen.getByText('Bronze Tier')).toBeInTheDocument();
    expect(
      screen.getByText('Maintained an active engineering streak for 7 consecutive days')
    ).toBeInTheDocument();
    expect(screen.getByRole('dialog').querySelector('[data-testid="achievement-badge-3d"]')).toBeInTheDocument();
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

  it('triggers live theme preview, maps legacy brutal theme to blueprint, and saves blueprint', async () => {
    const onThemePreview = vi.fn();
    const onProfileUpdated = vi.fn();
    const onClose = vi.fn();

    profileService.updateOwnerProfile.mockResolvedValueOnce({
      profile: mockProfile,
      settings: { ...mockProfile.profileSettings, theme: 'blueprint' },
    });

    render(
      <ToastProvider>
        <CardCustomizerDrawer
          isOpen={true}
          onClose={onClose}
          profile={{
            ...mockProfile,
            profileSettings: { ...mockProfile.profileSettings, theme: 'brutal' },
          }}
          onThemePreview={onThemePreview}
          onProfileUpdated={onProfileUpdated}
        />
      </ToastProvider>
    );

    const blueprintBtn = screen.getByRole('button', { name: /Blueprint CAD/i });
    expect(blueprintBtn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: /Silicon Neon/i }));
    expect(onThemePreview).toHaveBeenCalledWith('silicon');

    fireEvent.click(blueprintBtn);
    expect(onThemePreview).toHaveBeenCalledWith('blueprint');

    fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));

    await waitFor(() => {
      expect(profileService.updateOwnerProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          profileSettings: expect.objectContaining({ theme: 'blueprint' }),
        })
      );
    });
    expect(onProfileUpdated).toHaveBeenCalled();
  });
});

describe('CardExportModal Component', () => {
  it('displays share URL with unlisted token and exports themed card PNG', async () => {
    const themedEl = document.createElement('div');
    themedEl.id = 'engineeros-profile-card';
    themedEl.setAttribute('data-card-theme', 'blueprint');
    themedEl.className = 'pc-card pc-theme-blueprint';

    render(
      <ToastProvider>
        <CardExportModal
          isOpen={true}
          onClose={vi.fn()}
          cardElementRef={{ current: themedEl }}
          profile={{
            ...mockProfile,
            shareToken: 'sec_tok_123',
            profileSettings: {
              ...mockProfile.profileSettings,
              theme: 'blueprint',
              visibility: 'unlisted',
            },
          }}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Share & Export Profile Card')).toBeInTheDocument();
    expect(screen.getByText('Secret Token Included')).toBeInTheDocument();
    expect(screen.getByLabelText('Direct public link').value).toContain('/u/alexj?token=sec_tok_123');

    const downloadBtn = screen.getByRole('button', { name: /Download PNG/i });
    expect(downloadBtn).toBeInTheDocument();
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(toPng).toHaveBeenCalledWith(
        themedEl,
        expect.objectContaining({ pixelRatio: 2 })
      );
    });
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

  it('previews theme immediately when selected, reverts on cancel, and applies saved blueprint theme', async () => {
    useAuth.mockReturnValue({
      user: { name: 'Alex Johnson', university: 'Apex Institute of Technology', semester: 6 },
      updateUser: vi.fn(),
    });

    profileService.updateOwnerProfile.mockResolvedValue({
      profile: mockProfile,
      settings: { ...mockProfile.profileSettings, theme: 'blueprint' },
    });

    const { container } = render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await screen.findByText('My EngineerOS Card');
    expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
      'data-card-theme',
      'terminal'
    );

    // Open Customize drawer, click Varsity -> immediate preview -> Cancel reverts back to terminal
    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Varsity Academic/i }));
    expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
      'data-card-theme',
      'varsity'
    );

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
      'data-card-theme',
      'terminal'
    );

    // Reopen drawer, choose Blueprint CAD, Save Changes -> persists blueprint theme
    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    fireEvent.click(screen.getByRole('button', { name: /Blueprint CAD/i }));
    expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
      'data-card-theme',
      'blueprint'
    );

    const dialog = screen.getByRole('dialog');
    const saveBtns = Array.from(dialog.querySelectorAll('button')).filter((btn) =>
      /Save Changes/i.test(btn.textContent || '')
    );
    fireEvent.click(saveBtns[0]);

    await waitFor(() => {
      expect(profileService.updateOwnerProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          profileSettings: expect.objectContaining({ theme: 'blueprint' }),
        })
      );
      expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
        'data-card-theme',
        'blueprint'
      );
      expect(container.querySelector('#engineeros-profile-card')).toHaveClass('pc-theme-blueprint');
    });

    // Reopening drawer still shows Blueprint CAD selected
    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    expect(screen.getByRole('button', { name: /Blueprint CAD/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});

describe('PublicProfilePage Theme Rendering', () => {
  it('renders public profile card with normalized theme returned from server', async () => {
    profileService.getPublicProfile.mockResolvedValue({
      card: mockProfile,
      theme: 'silicon',
      visibility: 'public',
      isUnlisted: false,
    });

    const { container } = render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/u/alexj']}>
            <Routes>
              <Route path="/u/:username" element={<PublicProfilePage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(profileService.getPublicProfile).toHaveBeenCalledWith('alexj', null);
    });

    const card = await waitFor(() => container.querySelector('#engineeros-profile-card'));
    expect(card).toHaveAttribute('data-card-theme', 'silicon');
    expect(card).toHaveClass('pc-theme-silicon');
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
  });

  it('respects public profile section privacy flags when sections are disabled', async () => {
    profileService.getPublicProfile.mockResolvedValue({
      card: {
        ...mockProfile,
        identity: { name: 'Alex Johnson', username: 'alexj' },
        stats: { coding: mockProfile.stats.coding, academic: mockProfile.stats.academic },
        topSkills: undefined,
        topicTags: undefined,
        badges: undefined,
        recentActivity: undefined,
      },
      theme: 'blueprint',
      visibility: 'public',
      isUnlisted: false,
      sections: {
        showHeatmap: false,
        showGate: false,
        showInterviews: false,
        showUniversity: false,
        showPhoto: false,
        showSkills: false,
        showBadges: false,
      },
    });

    const { container } = render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/u/alexj']}>
            <Routes>
              <Route path="/u/:username" element={<PublicProfilePage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await screen.findByText('Alex Johnson');
    const card = container.querySelector('#engineeros-profile-card');
    expect(card).toHaveAttribute('data-card-theme', 'blueprint');
    expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
    expect(screen.queryByText('GATE Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Readiness')).not.toBeInTheDocument();
    expect(screen.queryByText(/Apex Institute/i)).not.toBeInTheDocument();
    expect(container.querySelector('[data-section="heatmap"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-section="skills"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-section="badges"]')).not.toBeInTheDocument();
  });
});

describe('Displayed Sections — Comprehensive Visibility, Data, Themes & API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      user: { name: 'Alex Johnson', university: 'Apex Institute of Technology', semester: 6 },
      updateUser: vi.fn().mockResolvedValue({}),
    });
    if (!window.IntersectionObserver) {
      window.IntersectionObserver = class {
        observe() {}
        disconnect() {}
      };
    }
  });

  it('renders all 7 sections cleanly in portrait and landscape, handles overflow, and excludes unearned badges/skills', () => {
    const richProfile = {
      ...mockProfile,
      topSkills: [
        { name: 'Algorithms & Data Structures', score: 80, level: 'Master', verified: true },
        { name: 'Technical Communication', score: 0, level: 'Intermediate', verified: false },
      ],
      topicTags: ['Arrays', 'Dynamic Programming', 'Graphs', 'Trees', 'Tries', 'Greedy'],
      badges: [
        ...mockProfile.badges,
        { badgeId: 'coding_first', name: 'Hello World', tier: 'bronze', isUnlocked: true },
        { badgeId: 'coding_50', name: 'Code Virtuoso', tier: 'bronze', isUnlocked: true },
        { badgeId: 'coding_100', name: 'DSA Centurion', tier: 'gold', isUnlocked: true },
        { badgeId: 'gate_debut', name: 'GATE Aspirant', tier: 'bronze', isUnlocked: true },
        { badgeId: 'gate_veteran', name: 'Exam Veteran', tier: 'silver', isUnlocked: true },
        // Locked badge must never render on earned card strip
        { badgeId: 'streak_100', name: 'Centurion Streak', tier: 'platinum', isUnlocked: false },
      ],
      stats: {
        ...mockProfile.stats,
        gate: { testsTaken: 5, bestScore: 68.5, accuracy: 78, topSubject: 'Operating Systems' },
        interviews: { completed: 3, averageScore: 82, level: 'Advanced' },
      },
    };

    const { container, rerender } = render(
      <ProfileCard profile={richProfile} orientation="portrait" />
    );

    // 1. Heatmap + streak + 10 chronological events
    expect(container.querySelector('[data-section="heatmap"]')).toBeInTheDocument();
    expect(screen.getByText('10 events')).toBeInTheDocument();
    expect(screen.getByText(/14d streak/i)).toBeInTheDocument();

    // 2. GATE + 3. Interviews + 4. University & graduation year ('26) + 5. Avatar
    expect(screen.getByText('GATE Hub')).toBeInTheDocument();
    expect(screen.getByText(/Operating Systems/i)).toBeInTheDocument();
    expect(screen.getByText('AI Readiness')).toBeInTheDocument();
    expect(screen.getByText(/3 mocks · Advanced/i)).toBeInTheDocument();
    expect(screen.getByText(/Apex Institute of Technology.*'26/i)).toBeInTheDocument();

    // 6. Verified Skills + Topic Tags rendered cleanly (zero-score unverified omitted; overflow +N capped)
    const skillsEl = container.querySelector('[data-section="skills"]');
    expect(skillsEl).toBeInTheDocument();
    expect(screen.getByText('Algorithms & Data Structures')).toBeInTheDocument();
    expect(screen.queryByText('Technical Communication')).not.toBeInTheDocument();
    expect(screen.getByText('+3')).toBeInTheDocument();

    // 7. Earned Badges filtered strictly to unlocked (7 unlocked -> 6 shown + '+1', locked Centurion excluded)
    expect(screen.getByText('Badges (7)')).toBeInTheDocument();
    expect(screen.queryByLabelText('Centurion Streak')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();

    // Verify sections persist visually across all 5 visual themes without disappearing
    Object.keys(THEMES).forEach((themeId) => {
      rerender(<ProfileCard profile={richProfile} themeOverride={themeId} orientation="portrait" />);
      expect(container.querySelector('#engineeros-profile-card')).toHaveAttribute(
        'data-card-theme',
        themeId
      );
      expect(container.querySelector('[data-section="heatmap"]')).toBeInTheDocument();
      expect(container.querySelector('[data-section="skills"]')).toBeInTheDocument();
      expect(container.querySelector('[data-section="badges"]')).toBeInTheDocument();
    });

    // Disabling sections hides each section cleanly and adapts overallProgress across visible modules
    rerender(
      <ProfileCard
        profile={richProfile}
        orientation="portrait"
        sectionsOverride={{
          showHeatmap: false,
          showGate: false,
          showInterviews: false,
          showUniversity: false,
          showPhoto: false,
          showSkills: false,
          showBadges: false,
        }}
      />
    );
    expect(container.querySelector('[data-section="heatmap"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-section="skills"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-section="badges"]')).not.toBeInTheDocument();
    expect(screen.queryByText(/14d streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText('GATE Hub')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Readiness')).not.toBeInTheDocument();
    expect(screen.queryByText(/Apex Institute of Technology/i)).not.toBeInTheDocument();
    // Overall progress recalculates over active Coding(100) + Academics(65) -> 83%
    expect(screen.getByText('83%')).toBeInTheDocument();
  });

  it('handles ProfilePage real API shapes (13 badges with isUnlocked, object heatmap) and live section toggle preview/save', async () => {
    const fullCatalogueFromServer = Array.from({ length: 13 }, (_, idx) => ({
      badgeId: idx === 0 ? 'streak_7' : idx === 1 ? 'coding_25' : `locked_${idx}`,
      name: idx === 0 ? 'Week of Fire' : idx === 1 ? 'Algorithm Apprentice' : `Locked ${idx}`,
      tier: 'bronze',
      isUnlocked: idx < 2,
    }));

    profileService.getOwnerProfile.mockResolvedValue({
      profile: mockProfile,
      settings: mockProfile.profileSettings,
    });
    profileService.getMyBadges.mockResolvedValue(fullCatalogueFromServer);
    profileService.getHeatmap.mockResolvedValue({
      days: [{ date: '2026-11-28', count: 6 }],
      currentStreak: 9,
      longestStreak: 14,
      totalActiveDays: 22,
    });
    profileService.updateOwnerProfile.mockResolvedValue({
      profile: mockProfile,
      settings: {
        ...mockProfile.profileSettings,
        sections: {
          ...mockProfile.profileSettings.sections,
          showSkills: false,
          showHeatmap: false,
        },
      },
    });

    const { container } = render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await screen.findByText('My EngineerOS Card');

    // Only 2 genuinely unlocked badges are counted & passed to Achievement Vault
    expect(screen.getByRole('tab', { name: /Badges \(2\)/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: /Badges \(2\)/i }));
    expect(screen.getByText('2 of 13 badges unlocked')).toBeInTheDocument();

    // Activity Stream tab parses object heatmap { days, currentStreak, totalActiveDays } cleanly
    fireEvent.click(screen.getByRole('tab', { name: /Activity Stream/i }));
    expect(screen.getByText('9 Days')).toBeInTheDocument();
    expect(screen.getByText(/Active Days:/i)).toBeInTheDocument();
    expect(screen.getByText('22')).toBeInTheDocument();

    // Open Customize drawer, toggle Skills & Heatmap OFF -> immediate preview, Cancel reverts -> reopen & Save persists
    expect(container.querySelector('[data-section="skills"]')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    fireEvent.click(screen.getByLabelText(/Verified Skills & Topic Tags/i));
    expect(container.querySelector('[data-section="skills"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(container.querySelector('[data-section="skills"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    fireEvent.click(screen.getByLabelText(/Verified Skills & Topic Tags/i));
    fireEvent.click(screen.getByLabelText(/Activity Heatmap & Streak Stream/i));

    const dialog = screen.getByRole('dialog');
    const saveBtn = Array.from(dialog.querySelectorAll('button')).find((b) =>
      /Save Changes/i.test(b.textContent || '')
    );
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(profileService.updateOwnerProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          profileSettings: expect.objectContaining({
            sections: expect.objectContaining({
              showSkills: false,
              showHeatmap: false,
            }),
          }),
        })
      );
      expect(container.querySelector('[data-section="skills"]')).not.toBeInTheDocument();
      expect(container.querySelector('[data-section="heatmap"]')).not.toBeInTheDocument();
    });

    // Reopening drawer retains persisted unchecked section toggles
    fireEvent.click(screen.getByRole('button', { name: /^Customize$/i }));
    expect(screen.getByLabelText(/Verified Skills & Topic Tags/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Activity Heatmap & Streak Stream/i)).not.toBeChecked();
  }, 15000);

  it('validates unsupported avatar MIME formats cleanly in AvatarCropperModal', () => {
    const { container } = render(
      <ToastProvider>
        <AvatarCropperModal isOpen={true} onClose={vi.fn()} onAvatarUpdated={vi.fn()} />
      </ToastProvider>
    );

    const fileInput = container.querySelector('input[type="file"]');
    const badFile = new File(['hello'], 'script.svg', { type: 'image/svg+xml' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(
      screen.getByText(/Unsupported format\. Please select PNG, JPG, or WebP\./i)
    ).toBeInTheDocument();
  });
});
