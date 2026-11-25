import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../../../context/ThemeContext.jsx';
import ToastProvider from '../../../components/Toast.jsx';
import { AcademicsPage } from '../AcademicsPage.jsx';
import { academicsService } from '../../../services/academics.service.js';
import { dashboardService } from '../../../services/dashboard.service.js';

vi.mock('../../auth/AuthContext.jsx', () => ({
  useAuth: () => ({
    user: {
      _id: 'user-1',
      name: 'Alex Johnson',
      university: 'MIT',
      branch: 'Computer Science and Engineering',
      semester: 4,
      role: 'student',
    },
  }),
}));

vi.mock('../../../services/academics.service.js', () => ({
  academicsService: {
    getSubjects: vi.fn(),
    getSubjectById: vi.fn(),
    toggleTopic: vi.fn(),
    getResources: vi.fn(),
  },
}));

vi.mock('../../../services/dashboard.service.js', () => ({
  dashboardService: {
    getSummary: vi.fn(),
  },
}));

const mockSubjectsSem4 = [
  {
    _id: 'sub-1',
    code: 'CS203',
    name: 'Design and Analysis of Algorithms',
    university: 'MIT',
    branch: 'Computer Science and Engineering',
    semester: 4,
    credits: 4,
    description: 'Core algorithmic paradigms, asymptotics, DP, and NP-completeness.',
    syllabusOutline: 'Unit I: Asymptotics • Unit II: Dynamic Programming • Unit III: Graph Paths',
    topics: [
      {
        topicId: 't1',
        title: 'Unit I: Divide and Conquer',
        description: 'Recurrence trees, Master theorem, Strassen matrix multiplication.',
        order: 1,
        estimatedHours: 3,
      },
      {
        topicId: 't2',
        title: 'Unit II: Dynamic Programming',
        description: 'Optimal substructure, overlapping subproblems, LCS, knapsack.',
        order: 2,
        estimatedHours: 4,
      },
    ],
  },
  {
    _id: 'sub-2',
    code: 'CS204',
    name: 'Theory of Computation',
    university: 'MIT',
    branch: 'Computer Science and Engineering',
    semester: 4,
    credits: 4,
    description: 'Automata theory, grammars, and Turing computability.',
    syllabusOutline: 'Unit I: DFA & NFA • Unit II: Pushdown Automata',
    topics: [
      {
        topicId: 't3',
        title: 'Finite Automata',
        description: 'DFA minimization and regular language closure.',
        order: 1,
        estimatedHours: 2,
      },
    ],
  },
];

const mockSubject1DetailsInitial = {
  ...mockSubjectsSem4[0],
  completedTopicIds: ['t1'],
  completionPercentage: 50,
};

const mockSubject1DetailsCompleted = {
  ...mockSubjectsSem4[0],
  completedTopicIds: ['t1', 't2'],
  completionPercentage: 100,
};

const mockResources = [
  {
    _id: 'res-1',
    subjectId: 'sub-1',
    topicId: 't1',
    title: 'Asymptotics & Master Theorem Notes',
    type: 'notes',
    author: 'Faculty Department',
    textContent: 'Master theorem cases and recurrence tree derivations.',
    tags: ['Asymptotics', 'Midterm'],
  },
  {
    _id: 'res-2',
    subjectId: 'sub-1',
    topicId: 't2',
    title: 'CS203 End-Sem PYQ 2024',
    type: 'pyq',
    year: 2024,
    author: 'Academic Council',
    contentUrl: 'https://example.edu/cs203-pyq-2024.pdf',
    textContent: 'Solve 0/1 Knapsack using bottom-up dynamic programming table.',
  },
  {
    _id: 'res-3',
    subjectId: 'sub-1',
    title: 'MIT OpenCourseWare Algorithms Video Series',
    type: 'lecture',
    contentUrl: 'https://youtube.com/playlist?list=sample',
    textContent: 'Full semester recorded lectures.',
  },
];

function renderAcademics() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={['/academics']}>
            <AcademicsPage />
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Academic Hub Module (Module 4)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService.getSummary.mockResolvedValue({
      stats: {
        academics: {
          percentComplete: 43,
          completedTopics: 12,
          totalTopics: 28,
        },
      },
    });
    academicsService.getSubjects.mockResolvedValue({ data: mockSubjectsSem4 });
    academicsService.getSubjectById.mockResolvedValue(mockSubject1DetailsInitial);
    academicsService.getResources.mockResolvedValue(mockResources);
  });

  it('renders Academic Hub overview metrics, semester/branch switcher, search, and opens Subject & Syllabus Workspace', async () => {
    renderAcademics();

    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenCalledWith({
        semester: 4,
        branch: 'Computer Science and Engineering',
        search: undefined,
      });
    });

    // Overview metrics & subject cards
    expect(screen.getByText('Academic Curriculum Hub')).toBeInTheDocument();
    expect(await screen.findByText('43%')).toBeInTheDocument();
    expect(screen.getByText('12/28 topics completed')).toBeInTheDocument();
    expect(screen.getByText('Design and Analysis of Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Unit I: Asymptotics')).toBeInTheDocument();

    // Semester switching & jump-to-current button
    fireEvent.click(screen.getByRole('button', { name: /Semester 5/i }));
    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenLastCalledWith({
        semester: 5,
        branch: 'Computer Science and Engineering',
        search: undefined,
      });
    });

    const jumpBtn = screen.getByRole('button', { name: 'Jump to Sem 4' });
    fireEvent.click(jumpBtn);
    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenLastCalledWith({
        semester: 4,
        branch: 'Computer Science and Engineering',
        search: undefined,
      });
    });

    // Branch change & search filtering
    fireEvent.change(screen.getByLabelText('Engineering branch'), {
      target: { value: 'Information Technology' },
    });
    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenLastCalledWith({
        semester: 4,
        branch: 'Information Technology',
        search: undefined,
      });
    });

    const searchInput = screen.getByLabelText('Search subjects or syllabus topics');
    fireEvent.change(searchInput, { target: { value: 'Algorithms' } });
    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenLastCalledWith({
        semester: 4,
        branch: 'Information Technology',
        search: 'Algorithms',
      });
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clear Search' }));
    await waitFor(() => {
      expect(academicsService.getSubjects).toHaveBeenLastCalledWith({
        semester: 4,
        branch: 'Information Technology',
        search: undefined,
      });
    });

    // Open Subject Detail & Syllabus Workspace
    fireEvent.click(screen.getByText('Design and Analysis of Algorithms'));

    await waitFor(() => {
      expect(academicsService.getSubjectById).toHaveBeenCalledWith('sub-1');
      expect(academicsService.getResources).toHaveBeenCalledWith('sub-1');
    });

    // Subject detail hero, syllabus unit cards, topic inspector with linked PYQ
    expect(await screen.findByText('1 / 2 Topics')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Design and Analysis of Algorithms' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Topic Completion Progress' })).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
    expect(screen.getByText('Course Syllabus Units')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Unit II: Dynamic Programming' })).toBeInTheDocument();
    expect(screen.getByText('Topic 02 Details')).toBeInTheDocument();
    expect(screen.getByText('CS203 End-Sem PYQ 2024')).toBeInTheDocument();

    // Toggle topic completion & verify progress updates to 100%
    academicsService.toggleTopic.mockResolvedValue({
      subjectId: 'sub-1',
      topicId: 't2',
      completedTopicIds: ['t1', 't2'],
      completionPercentage: 100,
    });
    academicsService.getSubjectById.mockResolvedValue(mockSubject1DetailsCompleted);

    fireEvent.click(screen.getByRole('button', { name: 'Mark Topic Complete' }));
    await waitFor(() => {
      expect(academicsService.toggleTopic).toHaveBeenCalledWith('sub-1', 't2');
    });
    expect(await screen.findByText('2 / 2 Topics')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Topic Completion Progress' })).toHaveAttribute(
      'aria-valuenow',
      '100'
    );
  });

  it('filters subject Study Resources by category, opens ResourcePreviewModal, and navigates back cleanly', async () => {
    renderAcademics();

    fireEvent.click(await screen.findByText('Design and Analysis of Algorithms'));
    await waitFor(() => {
      expect(academicsService.getResources).toHaveBeenCalledWith('sub-1');
    });

    // Switch to Study Resources & PYQs tab
    fireEvent.click(screen.getByRole('tab', { name: /Study Resources & PYQs/i }));
    expect(screen.getByText('Asymptotics & Master Theorem Notes')).toBeInTheDocument();
    expect(screen.getByText('MIT OpenCourseWare Algorithms Video Series')).toBeInTheDocument();

    // Filter to PYQs only
    fireEvent.click(screen.getByRole('button', { name: /PYQs/i }));
    expect(screen.queryByText('Asymptotics & Master Theorem Notes')).not.toBeInTheDocument();
    expect(screen.getByText('CS203 End-Sem PYQ 2024')).toBeInTheDocument();

    // Preview PYQ in ResourcePreviewModal
    fireEvent.click(screen.getByRole('button', { name: 'Quick View' }));
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveTextContent('Exam Year: 2024');
    expect(dialog).toHaveTextContent('Solve 0/1 Knapsack using bottom-up dynamic programming table.');

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Back to Semester Overview
    fireEvent.click(screen.getByRole('button', { name: /Back to Semester 4/i }));
    expect(await screen.findByText('Academic Curriculum Hub')).toBeInTheDocument();
  });
});
