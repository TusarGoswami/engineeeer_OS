import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import InterviewHubPage from '../InterviewHubPage.jsx';
import InterviewSessionPage from '../InterviewSessionPage.jsx';
import { aiService } from '../../../services/ai.service.js';

vi.mock('../../../services/ai.service.js', () => ({
  aiService: {
    getMyInterviews: vi.fn(),
    createInterview: vi.fn(),
    getInterview: vi.fn(),
    submitTurn: vi.fn(),
    finishInterview: vi.fn(),
  },
}));

const mockSessionsList = [
  {
    _id: 'sess-eval-1',
    targetRole: 'Backend Engineer',
    mode: 'technical',
    status: 'evaluated',
    createdAt: '2026-11-10T10:00:00Z',
    turns: [
      { role: 'interviewer', message: 'Design a rate limiter.' },
      { role: 'candidate', message: 'Token bucket using Redis Lua scripts.' },
    ],
    evaluation: {
      overallScore: 86,
      readinessLevel: 'Strong SDE-1',
    },
  },
  {
    _id: 'sess-prog-2',
    targetRole: 'SDE Intern',
    mode: 'dsa',
    status: 'in_progress',
    createdAt: '2026-11-12T10:00:00Z',
    turns: [{ role: 'interviewer', message: 'Invert a binary tree.' }],
  },
];

const mockActiveSession = {
  _id: 'sess-new-99',
  targetRole: 'Systems Software Engineer',
  mode: 'technical',
  status: 'in_progress',
  turns: [
    {
      role: 'interviewer',
      message: 'Explain how consistent hashing handles node failures.',
    },
  ],
};

const mockEvaluatedSession = {
  ...mockActiveSession,
  status: 'evaluated',
  turns: [
    ...mockActiveSession.turns,
    { role: 'candidate', message: 'Virtual nodes distribute hash keys uniformly.' },
  ],
  evaluation: {
    overallScore: 91,
    readinessLevel: 'Strong Hire',
    feedbackSummary: 'Excellent grasp of hash rings and load balancing.',
    rubricScores: {
      technicalCorrectness: 9,
      relevanceAndDepth: 9,
      clarityAndCommunication: 9,
      problemSolving: 9,
    },
    strengths: ['Clear explanation of virtual nodes'],
    areasForImprovement: ['Elaborate on replication factor'],
    recommendedTopics: ['Consistent Hashing', 'DynamoDB Partitioning'],
  },
};

describe('AI Mock Interviews Module (Module 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiService.getMyInterviews.mockResolvedValue(mockSessionsList);
  });

  it('renders InterviewHubPage analytics, tracks, session filters, and creates a configured session', async () => {
    aiService.createInterview.mockResolvedValue({ _id: 'sess-new-99' });

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/interviews']}>
            <Routes>
              <Route path="/interviews" element={<InterviewHubPage />} />
              <Route path="/interviews/:id" element={<div>Session Room Loaded</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(aiService.getMyInterviews).toHaveBeenCalledTimes(1);
    });

    // Studio KPI & session history
    expect(screen.getByText('AI Mock Interview Studio')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getAllByText('Evaluated').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('View Rubric')).toBeInTheDocument();
    expect(screen.getByText('Resume')).toBeInTheDocument();

    // Filter sessions by DSA track
    fireEvent.click(screen.getByRole('button', { name: 'DSA' }));
    expect(screen.queryByText('Backend Engineer')).not.toBeInTheDocument();
    expect(screen.getByText('SDE Intern')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();

    // Click DSA track card to configure & initialize session
    fireEvent.click(screen.getByText('Algorithms & Data Structures'));
    expect(screen.getByText('Initialize AI Mock Interview')).toBeInTheDocument();

    const roleInput = screen.getByLabelText(/Target Position/i);
    fireEvent.change(roleInput, { target: { value: 'Systems Software Engineer' } });
    fireEvent.click(screen.getByRole('button', { name: /Enter Session/i }));

    await waitFor(() => {
      expect(aiService.createInterview).toHaveBeenCalledWith({
        mode: 'dsa',
        targetRole: 'Systems Software Engineer',
      });
    });
    expect(await screen.findByText('Session Room Loaded')).toBeInTheDocument();
  });

  it('runs complete InterviewSessionPage journey from active turns through finish confirmation and evaluation scorecard', async () => {
    aiService.getInterview.mockResolvedValue(mockActiveSession);
    aiService.submitTurn.mockResolvedValue({
      ...mockActiveSession,
      turns: [
        ...mockActiveSession.turns,
        { role: 'candidate', message: 'Virtual nodes balance key ring distribution.' },
        { role: 'interviewer', message: 'Good. Now how would you mitigate hot partitions?' },
      ],
    });
    aiService.finishInterview.mockResolvedValue(mockEvaluatedSession);

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/interviews/sess-new-99']}>
            <Routes>
              <Route path="/interviews/:id" element={<InterviewSessionPage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(aiService.getInterview).toHaveBeenCalledWith('sess-new-99');
    });

    // Active studio environment renders role, question, and track rubric rail
    expect(await screen.findByText('Systems Software Engineer')).toBeInTheDocument();
    expect(screen.getByText(/Explain how consistent hashing handles node failures/i)).toBeInTheDocument();
    expect(screen.getByText('Track Rubric Focus')).toBeInTheDocument();

    // Submit candidate answer
    const textarea = screen.getByPlaceholderText(/Articulate your structured engineering answer/i);
    fireEvent.change(textarea, { target: { value: 'Virtual nodes balance key ring distribution.' } });
    fireEvent.click(screen.getByRole('button', { name: /Reply/i }));

    await waitFor(() => {
      expect(aiService.submitTurn).toHaveBeenCalledWith(
        'sess-new-99',
        'Virtual nodes balance key ring distribution.'
      );
    });
    expect(
      await screen.findByText(/Good\. Now how would you mitigate hot partitions\?/i)
    ).toBeInTheDocument();

    // Conclude & Evaluate via confirmation modal
    fireEvent.click(screen.getByRole('button', { name: /Finish & Evaluate/i }));
    expect(
      screen.getByText(/Finish Interview & Submit for Evaluation\?/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Conclude & Evaluate/i }));

    await waitFor(() => {
      expect(aiService.finishInterview).toHaveBeenCalledWith('sess-new-99');
    });

    // Evaluated Rubric Scorecard renders
    expect(await screen.findByText('Hiring Committee Executive Summary')).toBeInTheDocument();
    expect(screen.getByText('Strong Hire')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('Rubric Competency Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Demonstrated Strengths')).toBeInTheDocument();
    expect(screen.getByText('Areas for Targeted Growth')).toBeInTheDocument();
    expect(screen.getByText('#Consistent Hashing')).toBeInTheDocument();
  });
});

