import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { CodingCataloguePage } from '../CodingCataloguePage.jsx';
import { ProblemSolvePage } from '../ProblemSolvePage.jsx';
import { codingService } from '../../../services/coding.service.js';

vi.mock('../../../services/coding.service.js', () => ({
  codingService: {
    getProblems: vi.fn(),
    getProblemBySlug: vi.fn(),
    runSampleTest: vi.fn(),
    submitSolution: vi.fn(),
    getSubmissionById: vi.fn(),
    getMySubmissions: vi.fn(),
  },
}));

vi.mock('@monaco-editor/react', () => ({
  default: function MockMonacoEditor({ value, language, theme, onChange, onMount }) {
    return (
      <textarea
        data-testid="monaco-editor"
        data-language={language}
        data-theme={theme}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        ref={(el) => {
          if (el && onMount && !el.dataset.mounted) {
            el.dataset.mounted = '1';
            onMount(
              { addCommand: vi.fn() },
              { KeyMod: { CtrlCmd: 2048, Shift: 1024 }, KeyCode: { Enter: 3 } }
            );
          }
        }}
      />
    );
  },
}));

const mockProblemsList = [
  {
    _id: 'prob-hard',
    title: 'Word Ladder',
    slug: 'word-ladder',
    difficulty: 'hard',
    tags: ['Graph', 'String'],
    sampleTestCases: [{ input: 'hit -> cog', output: '5' }],
    acceptanceRate: 42,
  },
  {
    _id: 'prob-1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'easy',
    tags: ['Array', 'Hash Table'],
    sampleTestCases: [
      { input: '2 7 11 15\n9', output: '0 1' },
      { input: '3 2 4\n6', output: '1 2' },
    ],
    isSolved: true,
  },
  {
    _id: 'prob-med',
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: 'medium',
    tags: ['Hash Table'],
    sampleTestCases: [{ input: 'cap=2', output: 'null' }],
  },
];

const mockTwoSumProblem = {
  _id: 'prob-1',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'easy',
  statementMarkdown: 'Find two distinct indices whose values sum to target.',
  tags: ['Array', 'Hash Table'],
  constraints: {
    timeLimitMs: 1500,
    memoryLimitKb: 262144,
    customNotes: '2 <= nums.length <= 10^4',
  },
  starterCode: {
    python: 'def solve():\n    return []',
    cpp: '#include <iostream>\nint main() { return 0; }',
    java: 'class Solution {}',
    javascript: 'function solve() {}',
  },
  sampleTestCases: [
    {
      input: '4\n2 7 11 15\n9',
      output: '0 1',
      explanation: 'nums[0] + nums[1] == 9',
    },
    {
      input: '3\n3 2 4\n6',
      output: '1 2',
    },
  ],
};

describe('Coding Platform Module (Module 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders CodingCataloguePage real problem metrics, filters, client sorting, and navigates to Solve', async () => {
    codingService.getProblems.mockResolvedValue({ data: mockProblemsList });

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/coding']}>
            <Routes>
              <Route path="/coding" element={<CodingCataloguePage />} />
              <Route path="/coding/solve/:slug" element={<div>IDE Workspace Loaded</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(codingService.getProblems).toHaveBeenCalledWith({});
    });

    expect(screen.getByText('Coding Challenges')).toBeInTheDocument();
    expect(screen.getByText('42% Acc')).toBeInTheDocument();
    expect(screen.getByText('2 Samples')).toBeInTheDocument();
    expect(screen.queryByText(/65%/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Solved')).toBeInTheDocument();

    // Client sorting by title (LRU Cache -> Two Sum -> Word Ladder)
    const sortSelect = screen.getByLabelText('Sort problems');
    fireEvent.change(sortSelect, { target: { value: 'title' } });
    const titlesByAlpha = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
    expect(titlesByAlpha).toEqual(['LRU Cache', 'Two Sum', 'Word Ladder']);

    // Client sorting by difficulty ascending (Easy -> Medium -> Hard)
    fireEvent.change(sortSelect, { target: { value: 'diff-asc' } });
    const titlesByDiff = screen.getAllByRole('heading', { level: 3 }).map((el) => el.textContent);
    expect(titlesByDiff).toEqual(['Two Sum', 'LRU Cache', 'Word Ladder']);

    // Difficulty filter, topic tag filter, and keyword search trigger backend params
    fireEvent.click(screen.getByRole('button', { name: 'Medium' }));
    await waitFor(() => {
      expect(codingService.getProblems).toHaveBeenLastCalledWith({ difficulty: 'medium' });
    });

    fireEvent.click(screen.getByRole('button', { name: '#Array' }));
    await waitFor(() => {
      expect(codingService.getProblems).toHaveBeenLastCalledWith({
        difficulty: 'medium',
        tag: 'Array',
      });
    });

    const searchInput = screen.getByPlaceholderText('Search problem title, keyword, or concept...');
    fireEvent.change(searchInput, { target: { value: 'Two' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => {
      expect(codingService.getProblems).toHaveBeenLastCalledWith({
        difficulty: 'medium',
        tag: 'Array',
        search: 'Two',
      });
    });

    // Clear resets filters
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => {
      expect(codingService.getProblems).toHaveBeenLastCalledWith({});
    });

    // Navigate to solve page via Solve CTA on row 2 (Two Sum, idx=1 in default order)
    const solveButtons = screen.getAllByRole('button', { name: /Solve/i });
    fireEvent.click(solveButtons[1]);
    expect(await screen.findByText('IDE Workspace Loaded')).toBeInTheDocument();
  });

  it('runs ProblemSolvePage workflow: schema fields, language/theme/draft persistence, Run, Submit polling verdict, and shortcuts', async () => {
    codingService.getProblemBySlug.mockResolvedValue(mockTwoSumProblem);
    codingService.getMySubmissions
      .mockResolvedValueOnce([
        {
          _id: 'sub-old',
          status: 'wrong_answer',
          language: 'python',
          runtimeMs: 42,
          submittedAt: '2026-11-10T10:00:00Z',
        },
      ])
      .mockResolvedValueOnce([
        {
          _id: 'sub-99',
          status: 'accepted',
          language: 'cpp',
          runtimeMs: 18,
          submittedAt: '2026-11-25T10:00:00Z',
        },
      ]);

    codingService.runSampleTest.mockResolvedValue({
      totalSamples: 1,
      passedSamples: 1,
      sampleResults: [
        {
          sampleIndex: 1,
          passed: true,
          input: '9\n2 7',
          expectedOutput: '0 1',
          actualOutput: '0 1',
          runtime: 0.012,
        },
      ],
    });

    codingService.submitSolution.mockResolvedValue({ submissionId: 'sub-99', status: 'queued' });
    codingService.getSubmissionById
      .mockResolvedValueOnce({ status: 'queued' })
      .mockResolvedValueOnce({
        status: 'accepted',
        testCasesPassed: 2,
        totalTestCases: 2,
        runtimeMs: 18,
        memoryKb: 16384,
        executionTrace: [
          {
            testCaseIndex: 1,
            statusId: 3,
            statusDescription: 'Accepted',
            input: '4\n2 7 11 15\n9',
            stdout: '0 1',
            expectedOutput: '0 1',
            isHidden: false,
          },
          {
            testCaseIndex: 2,
            statusId: 3,
            statusDescription: 'Accepted',
            isHidden: true,
          },
        ],
      });

    render(
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/coding/solve/two-sum']}>
            <Routes>
              <Route path="/coding/solve/:slug" element={<ProblemSolvePage />} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    );

    // Schema alignment checks (statementMarkdown, sample output, object constraints)
    expect(await screen.findByRole('heading', { name: 'Two Sum' })).toBeInTheDocument();
    expect(screen.getByText('Find two distinct indices whose values sum to target.')).toBeInTheDocument();
    expect(screen.getByText('0 1')).toBeInTheDocument();
    expect(screen.getByText('Time: 1500 ms')).toBeInTheDocument();
    expect(screen.getByText('Memory: 256 MB')).toBeInTheDocument();
    expect(screen.getByText('2 <= nums.length <= 10^4')).toBeInTheDocument();

    // Editor language & theme switching + localStorage draft saving + Reset Starter
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toHaveAttribute('data-language', 'python');
    expect(editor.value).toContain('def solve():');

    fireEvent.change(screen.getByLabelText('Editor theme'), { target: { value: 'hc-black' } });
    expect(editor).toHaveAttribute('data-theme', 'hc-black');
    expect(localStorage.getItem('engineeros_editor_theme')).toBe('hc-black');

    fireEvent.change(screen.getByLabelText('Programming language'), { target: { value: 'cpp' } });
    expect(editor).toHaveAttribute('data-language', 'cpp');
    expect(editor.value).toBe('#include <iostream>\nint main() { return 0; }');

    fireEvent.change(editor, { target: { value: '// edited draft code' } });
    expect(localStorage.getItem('code_draft_two-sum_cpp')).toBe('// edited draft code');

    fireEvent.click(screen.getByRole('button', { name: 'Reset Starter' }));
    expect(editor.value).toBe('#include <iostream>\nint main() { return 0; }');
    expect(localStorage.getItem('code_draft_two-sum_cpp')).toBeNull();

    // Open Console with Ctrl+' shortcut and switch to Testcase tab to enter custom stdin
    fireEvent.keyDown(window, { key: "'", ctrlKey: true });
    fireEvent.click(await screen.findByRole('button', { name: 'Testcase' }));
    fireEvent.click(screen.getByRole('button', { name: '+ Custom Input' }));
    fireEvent.change(screen.getByPlaceholderText('Type or paste custom input values here...'), {
      target: { value: '9\n2 7' },
    });

    // Run sample tests with Ctrl+Enter shortcut
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    await waitFor(() => {
      expect(codingService.runSampleTest).toHaveBeenCalledWith(
        'prob-1',
        '#include <iostream>\nint main() { return 0; }',
        'cpp',
        '9\n2 7'
      );
    });
    expect(await screen.findByText('All Sample Test Cases Passed!')).toBeInTheDocument();

    // Switch to Submissions tab
    fireEvent.click(screen.getByRole('button', { name: /Submissions/i }));
    expect(screen.getByText('wrong answer')).toBeInTheDocument();

    // Submit with Ctrl+Shift+Enter + verify polling verdict and hidden trace redaction
    vi.useFakeTimers({ shouldAdvanceTime: true });
    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(codingService.submitSolution).toHaveBeenCalledWith(
        'prob-1',
        '#include <iostream>\nint main() { return 0; }',
        'cpp'
      );
    });

    await vi.advanceTimersByTimeAsync(1250);
    await vi.advanceTimersByTimeAsync(1250);

    expect(await screen.findByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('18 ms')).toBeInTheDocument();
    expect(screen.getByText('16 MB')).toBeInTheDocument();

    // Inspect hidden testcase breakdown redaction
    fireEvent.click(screen.getByRole('button', { name: /Case 2/i }));
    expect(
      screen.getByText(/Hidden system test case used for validation\. Inputs and outputs are redacted\./)
    ).toBeInTheDocument();
  });
});

