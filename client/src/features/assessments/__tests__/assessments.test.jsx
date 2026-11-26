import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { AssessmentCataloguePage } from '../AssessmentCataloguePage.jsx';
import { AssessmentTakePage } from '../AssessmentTakePage.jsx';
import { AssessmentReviewPage } from '../AssessmentReviewPage.jsx';
import { assessmentService } from '../../../services/assessment.service.js';

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      _id: 'user-1',
      name: 'Faculty User',
      role: 'contentAdmin',
    },
  }),
}));

vi.mock('../../../services/assessment.service.js', () => ({
  assessmentService: {
    getAssessments: vi.fn(),
    startAttempt: vi.fn(),
    autosave: vi.fn(),
    recordIntegrity: vi.fn(),
    submitAttempt: vi.fn(),
    getReviewSignals: vi.fn(),
  },
}));

const mockAssessmentsList = [
  {
    _id: 'assess-1',
    title: 'CS301: Operating Systems Midterm',
    description: 'CPU scheduling, paging algorithms, and deadlock analysis.',
    durationMinutes: 30,
    totalMarks: 8,
    subjectId: { name: 'Operating Systems', code: 'CS301' },
    rules: { fullScreenRequired: true, trackTabSwitches: true, allowResumption: true },
  },
  {
    _id: 'assess-future',
    title: 'CS401: Distributed Systems Final',
    description: 'Consensus protocols and clock synchronization.',
    durationMinutes: 60,
    totalMarks: 62,
    scheduledStartTime: new Date(Date.now() + 86400000).toISOString(),
    subjectId: { name: 'Distributed Systems', code: 'CS401' },
    rules: { fullScreenRequired: true, trackTabSwitches: true },
  },
];

const mockStartAttemptPayload = {
  data: {
    remainingSeconds: 1800,
    assessment: {
      _id: 'assess-1',
      title: 'CS301: Operating Systems Midterm',
      durationMinutes: 30,
      totalMarks: 8,
      questions: [
        {
          questionId: 'q1',
          type: 'mcq',
          marks: 2,
          topic: 'Virtual Memory',
          questionText: 'Which replacement policy suffers from Belady Anomaly?',
          options: [
            { id: 'A', text: 'LRU' },
            { id: 'B', text: 'FIFO' },
          ],
        },
        {
          questionId: 'q2',
          type: 'msq',
          marks: 4,
          topic: 'Deadlocks',
          questionText: 'Select mandatory Coffman deadlock conditions:',
          options: [
            { id: 'A', text: 'Mutual Exclusion' },
            { id: 'D', text: 'Circular Wait' },
          ],
        },
        {
          questionId: 'q3',
          type: 'nat',
          marks: 2,
          topic: 'Paging',
          questionText: 'Enter page table entries count:',
        },
      ],
    },
    attempt: {
      _id: 'att-10',
      answers: [{ questionId: 'q1', selectedOptions: ['B'], natAnswer: null }],
    },
  },
};

function renderWithRoutes(initialPath) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/assessments" element={<AssessmentCataloguePage />} />
            <Route path="/assessments/take/:id" element={<AssessmentTakePage />} />
            <Route path="/assessments/review/:id" element={<AssessmentReviewPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('Assessments Module (Module 7)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assessmentService.autosave.mockResolvedValue({ success: true });
    assessmentService.recordIntegrity.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders AssessmentCataloguePage metrics, schedule filters, instructions consent checklist, and launches test', async () => {
    assessmentService.getAssessments.mockResolvedValue({ data: mockAssessmentsList });
    assessmentService.startAttempt.mockResolvedValue(mockStartAttemptPayload);

    renderWithRoutes('/assessments');

    expect(await screen.findByText('CS301: Operating Systems Midterm')).toBeInTheDocument();
    expect(screen.getByText('CS401: Distributed Systems Final')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument(); // 8 + 62 cumulative marks

    // Schedule filtering & search
    fireEvent.click(screen.getByRole('button', { name: 'Upcoming (1)' }));
    expect(screen.queryByText('CS301: Operating Systems Midterm')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scheduled Later' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Available (1)' }));
    expect(screen.getByText('CS301: Operating Systems Midterm')).toBeInTheDocument();

    // Open instructions consent modal -> require acknowledgment before launching
    fireEvent.click(screen.getByRole('button', { name: 'Take Assessment' }));
    expect(
      await screen.findByText('Proctored Assessment Instructions & Consent')
    ).toBeInTheDocument();

    const startTestBtn = screen.getByRole('button', { name: /I Agree & Enter Test/i });
    expect(startTestBtn).toBeDisabled();

    fireEvent.click(
      screen.getByRole('checkbox', { name: /agree to abide by the assessment timer/i })
    );
    expect(startTestBtn).toBeEnabled();
    fireEvent.click(startTestBtn);

    expect(
      await screen.findByText('Mandatory Exam Security & Proctoring Setup')
    ).toBeInTheDocument();
  });

  it('enforces proctoring verification, preserves timer, autosave, integrity auditing, MCQ/MSQ/NAT, and submission evaluation', async () => {
    assessmentService.getAssessments.mockResolvedValue({ data: mockAssessmentsList });
    assessmentService.startAttempt.mockResolvedValue(mockStartAttemptPayload);
    assessmentService.submitAttempt.mockResolvedValue({
      data: {
        _id: 'att-10',
        score: 6,
        accuracyRate: 67,
        reviewSignalsCount: 1,
        isFlaggedForReview: false,
        answers: [
          { questionId: 'q1', selectedOptions: ['B'], isCorrect: true, marksAwarded: 2 },
          { questionId: 'q2', selectedOptions: ['A', 'D'], isCorrect: true, marksAwarded: 4 },
          { questionId: 'q3', selectedOptions: [], natAnswer: 512, isCorrect: false, marksAwarded: 0 },
        ],
      },
    });

    const mockTrack = { stop: vi.fn() };
    const mockMediaStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [{}],
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream),
      },
      configurable: true,
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithRoutes('/assessments/take/assess-1');

    // Hardware proctoring gate disabled until camera + screen share verified
    expect(
      await screen.findByText('Mandatory Exam Security & Proctoring Setup')
    ).toBeInTheDocument();
    const enterExamBtn = screen.getByRole('button', { name: /Enter Fullscreen & Begin Exam/i });
    expect(enterExamBtn).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Enable Camera' }));
    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Share Screen' }));
    await waitFor(() => {
      expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledTimes(1);
    });

    expect(enterExamBtn).toBeEnabled();
    fireEvent.click(enterExamBtn);

    // Proctoring PiP active + timer countdown works
    expect(await screen.findByText(/REC · PROCTOR LIVE/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('30:00');
    await vi.advanceTimersByTimeAsync(2100);
    expect(screen.getByLabelText('Time remaining')).not.toHaveTextContent('30:00');

    // Q1 restored option 'B' already selected; navigate Next -> Q2 (MSQ)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Select mandatory Coffman deadlock conditions:')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Mutual Exclusion/i }));
    fireEvent.click(screen.getByRole('button', { name: /Circular Wait/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark for Review' }));

    // Next -> Q3 (NAT)
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.change(screen.getByLabelText('Numerical Answer (NAT)'), {
      target: { value: '512' },
    });

    // Advance 30s to verify automatic server autosave fires cleanly
    await vi.advanceTimersByTimeAsync(30000);
    await waitFor(() => {
      expect(assessmentService.autosave).toHaveBeenCalledWith(
        'att-10',
        expect.arrayContaining([
          { questionId: 'q1', selectedOptions: ['B'], natAnswer: null },
          { questionId: 'q2', selectedOptions: ['A', 'D'], natAnswer: null },
          { questionId: 'q3', selectedOptions: [], natAnswer: 512 },
        ])
      );
    });

    // Trigger window blur to confirm integrity auditing fires recordIntegrity
    fireEvent(window, new Event('blur'));
    await waitFor(() => {
      expect(assessmentService.recordIntegrity).toHaveBeenCalledWith(
        'att-10',
        'window_blur',
        expect.any(Object)
      );
    });

    // Submit confirmation modal -> Confirm Submission -> Result Summary
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Submit Assessment?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Submission' }));

    await waitFor(() => {
      expect(assessmentService.submitAttempt).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByText('Assessment Completed')).toBeInTheDocument();
    expect(screen.getByText('6/8')).toBeInTheDocument();
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('Submitted Response Breakdown')).toBeInTheDocument();
  });

  it('renders AssessmentReviewPage moderation console, filters flagged attempts, and opens Telemetry Modal', async () => {
    assessmentService.getReviewSignals.mockResolvedValue({
      data: [
        {
          _id: 'att-flag-1',
          userId: { name: 'Riya Patel', email: 'riya@mit.edu' },
          score: 24,
          accuracyRate: 80,
          reviewSignalsCount: 3,
          isFlaggedForReview: true,
          isAutoSubmitted: false,
          submittedAt: '2026-11-25T10:00:00Z',
          events: [{ eventType: 'tab_hidden', timestamp: '2026-11-25T09:50:00Z' }],
        },
        {
          _id: 'att-clean-2',
          userId: { name: 'Arjun Nair', email: 'arjun@mit.edu' },
          score: 28,
          accuracyRate: 93,
          reviewSignalsCount: 0,
          isFlaggedForReview: false,
          submittedAt: '2026-11-25T10:15:00Z',
        },
      ],
    });

    renderWithRoutes('/assessments/review/assess-1');

    expect(await screen.findByText('Riya Patel')).toBeInTheDocument();
    expect(screen.getByText('Arjun Nair')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Filter Flagged' }));
    expect(screen.queryByText('Arjun Nair')).not.toBeInTheDocument();
    expect(screen.getByText('Riya Patel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View Telemetry' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('tab hidden');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    fireEvent.click(screen.getByRole('button', { name: 'Clear Review' }));
    expect(screen.getByRole('button', { name: 'Cleared' })).toBeDisabled();
  });

  it('shows centered proctoring warning modal for 3 violations and auto-submits + redirects on the 4th', async () => {
    assessmentService.startAttempt.mockResolvedValue(mockStartAttemptPayload);
    assessmentService.recordIntegrity.mockResolvedValue({ success: true });
    assessmentService.submitAttempt.mockResolvedValue({
      data: { _id: 'att-10', score: 2, accuracyRate: 33, isAutoSubmitted: true },
    });
    assessmentService.getAssessments.mockResolvedValue({ data: mockAssessmentsList });

    const mockTrack = { stop: vi.fn() };
    const mockMediaStream = {
      getTracks: () => [mockTrack],
      getVideoTracks: () => [{}],
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream),
      },
      configurable: true,
    });

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithRoutes('/assessments/take/assess-1');

    expect(
      await screen.findByText('Mandatory Exam Security & Proctoring Setup')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enable Camera' }));
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Share Screen' }));
    await waitFor(() => expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: /Enter Fullscreen & Begin Exam/i }));
    expect(await screen.findByText(/REC · PROCTOR LIVE/i)).toBeInTheDocument();

    // Violation 1
    await vi.advanceTimersByTimeAsync(500);
    fireEvent(document, new Event('fullscreenchange'));
    expect(await screen.findByText('Proctoring Rule Violation Warning')).toBeInTheDocument();
    expect(screen.getByText('Warning 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('2 chances remaining')).toBeInTheDocument();

    // Violation 2
    await vi.advanceTimersByTimeAsync(500);
    fireEvent(window, new Event('blur'));
    expect(await screen.findByText('Warning 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('1 chance remaining')).toBeInTheDocument();

    // Violation 3
    await vi.advanceTimersByTimeAsync(500);
    fireEvent(document, new Event('fullscreenchange'));
    expect(await screen.findByText('Warning 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('0 chances remaining')).toBeInTheDocument();
    expect(assessmentService.submitAttempt).not.toHaveBeenCalled();

    // Violation 4 -> auto-submit & redirect out of exam
    await vi.advanceTimersByTimeAsync(500);
    fireEvent(window, new Event('blur'));
    await waitFor(() => {
      expect(assessmentService.submitAttempt).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText('CS301: Operating Systems Midterm')).toBeInTheDocument();
  });
});

