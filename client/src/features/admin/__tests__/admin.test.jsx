import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { AdminStudioPage } from '../AdminStudioPage.jsx';
import adminService from '../../../services/admin.service.js';
import academicsService from '../../../services/academics.service.js';

vi.mock('../../../services/admin.service.js', () => ({
  default: {
    getStats: vi.fn(),
    getProblems: vi.fn(),
    getProblemById: vi.fn(),
    createProblem: vi.fn(),
    updateProblem: vi.fn(),
    deleteProblem: vi.fn(),
    addTestCase: vi.fn(),
    getAssessments: vi.fn(),
    createAssessment: vi.fn(),
    updateAssessment: vi.fn(),
    deleteAssessment: vi.fn(),
    getIntegritySignals: vi.fn(),
    resolveIntegrityVerdict: vi.fn(),
    getUsers: vi.fn(),
    updateUserRole: vi.fn(),
    verifyAlumniStatus: vi.fn(),
  },
}));

vi.mock('../../../services/academics.service.js', () => ({
  default: {
    getSubjects: vi.fn(),
  },
}));

function renderAdminStudio() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter>
            <AdminStudioPage />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Admin Studio Module (Module 9)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminService.getStats.mockResolvedValue({
      users: { total: 140, students: 120, seniors: 18, alumni: 12 },
      coding: { problems: 35, submissions: 420 },
      assessments: { total: 8, pendingReviewFlags: 1 },
    });
    adminService.getProblems.mockResolvedValue({
      problems: [
        {
          _id: 'prob-1',
          title: 'LRU Cache',
          slug: 'lru-cache',
          difficulty: 'medium',
          tags: ['hash-table', 'design'],
          testCaseCount: 6,
          constraints: { timeLimitMs: 2000 },
        },
      ],
    });
    adminService.getAssessments.mockResolvedValue({
      assessments: [
        {
          _id: 'asm-1',
          title: 'OS Midterm Exam',
          durationMinutes: 60,
          totalMarks: 50,
          questionsCount: 15,
          rules: { fullScreenRequired: true, trackTabSwitches: true },
          stats: { totalAttempts: 42, flaggedCount: 1 },
        },
      ],
    });
    adminService.getIntegritySignals.mockResolvedValue({
      attempts: [
        {
          _id: 'att-1',
          userId: { name: 'Rohan Kumar', email: 'rohan@mit.edu', university: 'MIT' },
          assessmentId: { title: 'OS Midterm Exam', totalMarks: 50 },
          score: 41,
          reviewSignalsCount: 3,
          status: 'submitted',
          events: [
            { eventType: 'tab_hidden', occurredAt: '2026-11-24T10:15:00Z' },
          ],
        },
      ],
    });
    adminService.getUsers.mockResolvedValue({
      users: [
        {
          _id: 'usr-1',
          name: 'Sneha Rao',
          email: 'sneha@mit.edu',
          username: 'sneharao',
          role: 'senior',
          university: 'IIT Bombay',
          branch: 'CSE',
          isAlumni: false,
        },
      ],
    });
    academicsService.getSubjects.mockResolvedValue({
      data: [{ _id: 'sub-1', code: 'CS301', name: 'Operating Systems', semester: 5 }],
    });
  });

  it('renders overview metrics, integrity review modal verdict, problem authoring/deletion confirmation, and alumni verification', async () => {
    adminService.resolveIntegrityVerdict.mockResolvedValue({ resolved: true });
    adminService.deleteProblem.mockResolvedValue({ deleted: true });
    adminService.verifyAlumniStatus.mockResolvedValue({ isAlumni: true });

    renderAdminStudio();

    expect(await screen.findByText('Admin & Faculty Studio')).toBeInTheDocument();
    expect(await screen.findByText('140')).toBeInTheDocument();
    expect(await screen.findByText('Rohan Kumar')).toBeInTheDocument();

    // Open Integrity Verdict Modal from Overview queue
    fireEvent.click(screen.getByRole('button', { name: 'Review' }));
    expect(
      await screen.findByText('Faculty Review: Student Integrity Signals')
    ).toBeInTheDocument();
    expect(screen.getByText('Tab Switch / Hidden')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Verdict' }));
    await waitFor(() => {
      expect(adminService.resolveIntegrityVerdict).toHaveBeenCalledWith('att-1', {
        action: 'approve',
        penaltyMarks: 0,
        notes: '',
      });
    });

    // Switch to Problems tab and trigger accessible Delete Confirmation Modal
    fireEvent.click(screen.getByRole('tab', { name: /Problems/i }));
    expect(await screen.findByText('LRU Cache')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete LRU Cache' }));
    expect(await screen.findByText('Delete Coding Problem?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    await waitFor(() => {
      expect(adminService.deleteProblem).toHaveBeenCalledWith('prob-1');
    });

    // Switch to Users & Alumni tab and open Verify Alumni modal
    fireEvent.click(screen.getByRole('tab', { name: /Users & Alumni/i }));
    expect(await screen.findByText('Sneha Rao')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Verify Alumni' }));
    expect(
      await screen.findByText('Verify Alumni & Issue Mentorship Badge')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.change(screen.getByLabelText('Current Company / Organization'), {
      target: { value: 'Stripe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save & Issue Badge/i }));

    await waitFor(() => {
      expect(adminService.verifyAlumniStatus).toHaveBeenCalledWith(
        'usr-1',
        expect.objectContaining({
          isAlumni: true,
          currentCompany: 'Stripe',
        })
      );
    });
  });
});

