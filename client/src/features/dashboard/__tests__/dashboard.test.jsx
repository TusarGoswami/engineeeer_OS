import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../DashboardPage.jsx';
import { dashboardService } from '../../../services/dashboard.service.js';
import profileService from '../../../services/profile.service.js';
import ToastProvider from '../../../components/Toast.jsx';

vi.mock('../../../services/dashboard.service.js', () => ({
  dashboardService: {
    getSummary: vi.fn(),
    getTodayTasks: vi.fn(),
    updateTask: vi.fn(),
    getHeatmap: vi.fn(),
  },
}));

vi.mock('../../../services/profile.service.js', () => ({
  default: {
    getOwnerProfile: vi.fn(),
    getMyBadges: vi.fn(),
    getHeatmap: vi.fn(),
  },
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
  },
  stats: {
    coding: { solved: 42, easy: 20, medium: 18, hard: 4, accuracy: 84 },
    gate: { testsTaken: 5, bestScore: 68.5, accuracy: 78 },
    academic: { subjectsEnrolled: 6, syllabusProgress: 65 },
    interviews: { completed: 3, averageScore: 82 },
    streaks: { current: 14, longest: 28 },
  },
  topSkills: ['Arrays', 'Dynamic Programming'],
  badges: [{ badgeId: 'streak_7', name: '7-Day Streak', icon: '🔥', tier: 'bronze' }],
  recentActivity: [{ date: '2026-10-31', count: 5 }],
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

const mockToday = {
  date: '2026-10-31',
  total: 3,
  completed: 1,
  percent: 33,
  tasks: [
    {
      _id: 'task-1',
      title: 'Daily Challenge: Two Sum',
      estimatedMinutes: 20,
      module: 'coding',
      actionUrl: '/coding',
      status: 'pending',
    },
    {
      _id: 'task-2',
      title: 'Review Computer Networks Notes',
      estimatedMinutes: 25,
      module: 'academics',
      actionUrl: '/academics',
      status: 'completed',
    },
    {
      _id: 'task-3',
      title: 'Take GATE Mock: Data Structures',
      estimatedMinutes: 30,
      module: 'gate',
      actionUrl: '/gate',
      status: 'pending',
    },
  ],
};

describe('Redesigned DashboardPage Component (Phase 7)', () => {
  it('renders Hero Profile Card, What Should I Do Today panel, Heatmap and 6 Workspace Tiles', async () => {
    profileService.getOwnerProfile.mockResolvedValue(mockProfile);
    dashboardService.getSummary.mockResolvedValue({
      user: mockProfile.identity,
      stats: {
        coding: { solvedCount: 42, easyCount: 20, mediumCount: 18, hardCount: 4, accuracyRate: 84 },
        gate: { testsAttempted: 5, averageScore: 68.5, weakTopics: ['Computer Networks'] },
        academics: { percentComplete: 65, completedTopics: 13, totalTopics: 20 },
        interviews: { sessionsCompleted: 3, averageReadinessScore: 82 },
        overallStreak: 14,
      },
    });
    dashboardService.getTodayTasks.mockResolvedValue(mockToday);
    dashboardService.getHeatmap.mockResolvedValue([
      { date: '2026-10-30', count: 3 },
      { date: '2026-10-31', count: 5 },
    ]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <DashboardPage />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    );

    // 1. Check Hero Welcome & Profile Card
    await waitFor(() => {
      expect(screen.getByText('Alex Johnson')).toBeInTheDocument();
      expect(screen.getByText('@alexj')).toBeInTheDocument();
    });

    // 2. Check "What Should I Do Today?" section
    expect(screen.getByText('What Should I Do Today?')).toBeInTheDocument();
    expect(screen.getByText('Daily Challenge: Two Sum')).toBeInTheDocument();
    expect(screen.getByText('Review Computer Networks Notes')).toBeInTheDocument();
    expect(screen.getByText('Take GATE Mock: Data Structures')).toBeInTheDocument();

    // 3. Check Consistency Heatmap
    expect(screen.getByText('Annual Consistency Stream')).toBeInTheDocument();

    // 4. Check 6 Workspace tiles
    expect(screen.getByText('Coding & DSA')).toBeInTheDocument();
    expect(screen.getByText('GATE Preparation')).toBeInTheDocument();
    expect(screen.getByText('Curriculum Hub')).toBeInTheDocument();
    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Mock Interviews')).toBeInTheDocument();
    expect(screen.getByText('Senior Network')).toBeInTheDocument();
  });
});

