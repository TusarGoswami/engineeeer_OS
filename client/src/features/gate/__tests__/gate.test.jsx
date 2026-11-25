import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { GateCataloguePage } from '../GateCataloguePage.jsx';
import { GateTestPage } from '../GateTestPage.jsx';
import { GateResultPage } from '../GateResultPage.jsx';
import { gateService } from '../../../services/gate.service.js';

vi.mock('../../../services/gate.service.js', () => ({
  gateService: {
    getTests: vi.fn(),
    getMyAttempts: vi.fn(),
    getTestForAttempt: vi.fn(),
    submitAttempt: vi.fn(),
    getAttemptById: vi.fn(),
  },
}));

const mockTestsList = [
  {
    _id: 'test-1',
    title: 'GATE CS 2026 — National Mock 1',
    description: 'Full-length CS & IT paper covering Algorithms, OS, DBMS, and TOC.',
    subject: 'CS & IT',
    durationMinutes: 180,
    totalMarks: 20,
    totalQuestions: 3,
  },
  {
    _id: 'test-2',
    title: 'GATE Subject Test: DBMS & SQL',
    description: 'Targeted test on normalization, transactions, and B+ trees.',
    subject: 'DBMS',
    durationMinutes: 60,
    totalMarks: 25,
    totalQuestions: 15,
  },
];

const mockAttemptsHistory = [
  {
    _id: 'att-1',
    testId: { _id: 'test-1', title: 'GATE CS 2026 — National Mock 1' },
    score: 16,
    totalMarksAvailable: 20,
    accuracyRate: 85,
    weakTopics: ['Operating Systems'],
    submittedAt: '2026-11-18T12:00:00Z',
  },
];

const mockActiveExam = {
  _id: 'test-1',
  title: 'GATE CS 2026 — National Mock 1',
  subject: 'CS & IT',
  durationMinutes: 180,
  totalMarks: 5,
  totalQuestions: 3,
  questions: [
    {
      questionId: 'q1',
      type: 'mcq',
      marks: 1,
      negativeMarks: 0.33,
      topic: 'Algorithms',
      questionText: 'What is the worst-case time complexity of building a Binary Heap?',
      options: [
        { id: 'A', text: 'O(n log n)' },
        { id: 'B', text: 'O(n)' },
      ],
    },
    {
      questionId: 'q2',
      type: 'msq',
      marks: 2,
      negativeMarks: 0,
      topic: 'Theory of Computation',
      questionText: 'Which of the following problems are undecidable for Turing Machines?',
      options: [
        { id: 'A', text: 'Halting Problem' },
        { id: 'B', text: 'DFA Emptiness' },
        { id: 'C', text: 'TM Equivalence' },
      ],
    },
    {
      questionId: 'q3',
      type: 'nat',
      marks: 2,
      negativeMarks: 0,
      topic: 'Operating Systems',
      questionText: 'Calculate the decimal page frame count in a 42-entry table:',
    },
  ],
};

const mockEvaluatedAttempt = {
  _id: 'att-99',
  testId: { _id: 'test-1', title: 'GATE CS 2026 — National Mock 1' },
  score: 4,
  totalMarksAvailable: 5,
  totalQuestions: 3,
  correctCount: 2,
  incorrectCount: 1,
  unattemptedCount: 0,
  accuracyRate: 67,
  timeTakenSeconds: 185,
  topicBreakdown: [
    { topic: 'Algorithms', total: 1, correct: 1, accuracy: 100 },
    { topic: 'Operating Systems', total: 1, correct: 0, accuracy: 0 },
  ],
  weakTopics: ['Operating Systems'],
  submittedAt: '2026-11-25T14:30:00Z',
  reviewQuestions: [
    {
      questionId: 'q1',
      type: 'mcq',
      topic: 'Algorithms',
      questionText: 'What is the worst-case time complexity of building a Binary Heap?',
      options: [
        { id: 'A', text: 'O(n log n)' },
        { id: 'B', text: 'O(n)' },
      ],
      selectedOptions: ['B'],
      correctOptions: ['B'],
      isCorrect: true,
      marksAwarded: 1,
      negativeDeducted: 0,
      explanation: 'Bottom-up heapify sums height terms geometrically in O(n).',
    },
    {
      questionId: 'q3',
      type: 'nat',
      topic: 'Operating Systems',
      questionText: 'Calculate the decimal page frame count in a 42-entry table:',
      selectedOptions: [],
      natAnswer: 40,
      natRange: { min: 42, max: 42 },
      isCorrect: false,
      marksAwarded: 0,
      negativeDeducted: 0,
      explanation: 'Exact entry calculation equals 42 frames.',
    },
  ],
};

function renderWithRoutes(initialRoute) {
  return render(
    <ThemeProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <Routes>
            <Route path="/gate" element={<GateCataloguePage />} />
            <Route path="/gate/test/:id" element={<GateTestPage />} />
            <Route path="/gate/results/:id" element={<GateResultPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

describe('GATE Hub Module (Module 6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders GateCataloguePage real readiness telemetry, test filters, Revision Notes reader, and navigates to test', async () => {
    gateService.getTests.mockResolvedValue(mockTestsList);
    gateService.getMyAttempts.mockResolvedValue(mockAttemptsHistory);

    gateService.getTestForAttempt.mockResolvedValue(mockActiveExam);

    renderWithRoutes('/gate');

    await waitFor(() => {
      expect(gateService.getTests).toHaveBeenCalledTimes(1);
      expect(gateService.getMyAttempts).toHaveBeenCalledTimes(1);
    });

    // Real readiness telemetry & weak topic revision priority
    expect(screen.getByText('GATE Hub & Exam Simulator')).toBeInTheDocument();
    expect(screen.getByText('16/20')).toBeInTheDocument();
    expect(screen.getAllByText('85%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Revision Priorities From Your Attempts')).toBeInTheDocument();

    // Filter mock tests by search (only matches GATE Subject Test: DBMS & SQL)
    fireEvent.change(screen.getByLabelText('Search mock exams'), {
      target: { value: 'SQL' },
    });
    expect(
      screen.queryByRole('heading', { name: 'GATE CS 2026 — National Mock 1' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'GATE Subject Test: DBMS & SQL' })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Filters' }));
    expect(
      screen.getByRole('heading', { name: 'GATE CS 2026 — National Mock 1' })
    ).toBeInTheDocument();

    // Switch to Revision Notes & Formulas tab (dynamic count = 8), open GateNotesReader, copy formula, close
    fireEvent.click(screen.getByRole('button', { name: /Revision Notes & Formulas/i }));
    fireEvent.click(screen.getByRole('heading', { name: 'Operating Systems' }));
    const readerDialog = await screen.findByRole('dialog');
    expect(readerDialog).toBeInTheDocument();
    const copyBtns = screen.getAllByTitle('Copy Formula');
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TAT = CT - AT');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Navigate to mock exam via Start/Retake CTA
    fireEvent.click(screen.getByRole('button', { name: /Mock Tests/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Retake Exam' }));
    expect(await screen.findByText('GATE CBT Mode & Integrity Guidelines')).toBeInTheDocument();
  });

  it('runs complete active GateTestPage -> Calculator -> MCQ/MSQ/NAT -> Timer -> Submit -> GateResultPage flow', async () => {
    gateService.getTestForAttempt.mockResolvedValue(mockActiveExam);
    gateService.submitAttempt.mockResolvedValue({ _id: 'att-99' });
    gateService.getAttemptById.mockResolvedValue(mockEvaluatedAttempt);

    vi.useFakeTimers({ shouldAdvanceTime: true });
    renderWithRoutes('/gate/test/test-1');

    // Dismiss fullscreen modal cleanly
    expect(await screen.findByText('GATE CBT Mode & Integrity Guidelines')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stay Windowed' }));

    // Verify timer displays 03:00:00 and counts down cleanly without stale loop errors
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('03:00:00');
    await vi.advanceTimersByTimeAsync(2100);
    expect(screen.getByLabelText('Time remaining')).not.toHaveTextContent('03:00:00');

    // Question 1 (MCQ with schema opt.id & questionText)
    expect(
      screen.getByText('What is the worst-case time complexity of building a Binary Heap?')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /O\(n\)/i }));
    expect(localStorage.getItem('gate_attempt_test-1')).toContain('"B"');

    // Mark & Next -> moves to Question 2 (MSQ)
    fireEvent.click(screen.getByRole('button', { name: /Mark & Next/i }));
    expect(
      screen.getByText('Which of the following problems are undecidable for Turing Machines?')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Halting Problem/i }));
    fireEvent.click(screen.getByRole('button', { name: /TM Equivalence/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Clear Response' }));
    expect(localStorage.getItem('gate_attempt_test-1')).not.toContain('q2');

    // Re-select MSQ answers A and C, then Save & Next -> Question 3 (NAT)
    fireEvent.click(screen.getByRole('button', { name: /Halting Problem/i }));
    fireEvent.click(screen.getByRole('button', { name: /TM Equivalence/i }));
    fireEvent.click(screen.getByRole('button', { name: /Save & Next/i }));

    expect(
      screen.getByText('Calculate the decimal page frame count in a 42-entry table:')
    ).toBeInTheDocument();

    // Test Virtual Scientific Calculator
    fireEvent.click(screen.getByLabelText('Open scientific calculator'));
    const pressCalc = (k) => fireEvent.click(screen.getByRole('button', { name: k }));
    pressCalc('6');
    pressCalc('*');
    pressCalc('7');
    pressCalc('=');
    expect(screen.getByTestId('gate-calc-display')).toHaveTextContent('42');
    fireEvent.click(screen.getByRole('button', { name: 'Close modal' }));

    // Enter NAT answer
    fireEvent.change(screen.getByLabelText('Numerical Answer (NAT)'), {
      target: { value: '42' },
    });

    // Submit Exam via Confirmation Modal
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Submit GATE Examination?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Confirm & Submit/i }));

    await waitFor(() => {
      expect(gateService.submitAttempt).toHaveBeenCalledWith(
        'test-1',
        [
          { questionId: 'q1', selectedOptions: ['B'], natAnswer: null },
          { questionId: 'q2', selectedOptions: ['A', 'C'], natAnswer: null },
          { questionId: 'q3', selectedOptions: [], natAnswer: 42 },
        ],
        expect.any(Number)
      );
    });

    // Lands on GateResultPage with complete topic breakdown, weak topic alert, and solution filters
    expect(await screen.findByText(/Result Analysis/i)).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('Subject & Topic Performance Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Weak Topics (< 50% Accuracy)')).toBeInTheDocument();

    // Solution filtering (Incorrect shows only Q3 NAT breakdown)
    fireEvent.click(screen.getByRole('button', { name: /Incorrect \(1\)/i }));
    expect(
      screen.queryByText('What is the worst-case time complexity of building a Binary Heap?')
    ).not.toBeInTheDocument();
    expect(screen.getByText('Exact entry calculation equals 42 frames.')).toBeInTheDocument();
  });
});

