import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  LayoutGrid,
  Code2,
  FileCheck2,
  ShieldAlert,
  AlertTriangle,
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  Award,
  Sparkles,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import adminService from '../../services/admin.service.js';
import academicsService from '../../services/academics.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Input,
  Select,
  Modal,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  EmptyState,
  ErrorState,
  useToast,
} from '../../components/index.js';

import ProblemModal from './components/ProblemModal.jsx';
import AssessmentModal from './components/AssessmentModal.jsx';
import IntegrityVerdictModal from './components/IntegrityVerdictModal.jsx';
import VerifyAlumniModal from './components/VerifyAlumniModal.jsx';

/**
 * Institutional Governance Studio for content & platform administrators.
 * Covers coding problem authoring, proctored assessment scheduling, integrity moderation, and alumni verification.
 */
export const AdminStudioPage = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filter state
  const [problemSearch, setProblemSearch] = useState('');
  const [problemDifficulty, setProblemDifficulty] = useState('');
  const [assessmentSearch, setAssessmentSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Modals state
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);

  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState(null);

  const [isVerdictModalOpen, setIsVerdictModalOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  const [isAlumniModalOpen, setIsAlumniModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirmDelete, setConfirmDelete] = useState(null);

  // Queries
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const {
    data: problemsData,
    isLoading: problemsLoading,
    error: problemsError,
    refetch: refetchProblems,
  } = useQuery({
    queryKey: ['admin-problems', problemSearch, problemDifficulty],
    queryFn: () =>
      adminService.getProblems({ search: problemSearch, difficulty: problemDifficulty }),
    enabled: activeTab === 'problems' || activeTab === 'overview',
  });

  const {
    data: assessmentsData,
    isLoading: assessmentsLoading,
    error: assessmentsError,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: ['admin-assessments', assessmentSearch],
    queryFn: () => adminService.getAssessments({ search: assessmentSearch }),
    enabled: activeTab === 'assessments' || activeTab === 'overview',
  });

  const {
    data: integrityData,
    isLoading: integrityLoading,
    error: integrityError,
    refetch: refetchIntegrity,
  } = useQuery({
    queryKey: ['admin-integrity'],
    queryFn: () => adminService.getIntegritySignals({ verdict: 'pending' }),
    enabled: activeTab === 'integrity' || activeTab === 'overview',
  });

  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ['admin-users', userSearch, userRoleFilter],
    queryFn: () => adminService.getUsers({ search: userSearch, role: userRoleFilter }),
    enabled: activeTab === 'users',
  });

  const { data: subjectsData } = useQuery({
    queryKey: ['admin-curriculum-subjects'],
    queryFn: () => academicsService.getSubjects(),
  });

  // Mutations
  const saveProblemMutation = useMutation({
    mutationFn: async ({ problemData, testCases }) => {
      let saved;
      if (selectedProblem?._id) {
        saved = await adminService.updateProblem(selectedProblem._id, problemData);
      } else {
        saved = await adminService.createProblem(problemData);
      }

      if (testCases?.length) {
        for (const tc of testCases) {
          if (!tc._id) {
            await adminService.addTestCase(saved._id, tc);
          }
        }
      }
      return saved;
    },
    onSuccess: () => {
      showToast('Algorithm problem saved successfully', 'success');
      refetchProblems();
      refetchStats();
    },
    onError: (err) => {
      showToast(
        err.response?.data?.error?.message || err.response?.data?.message || 'Failed to save problem',
        'error'
      );
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: (id) => adminService.deleteProblem(id),
    onSuccess: () => {
      showToast('Problem deleted successfully', 'info');
      setConfirmDelete(null);
      refetchProblems();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete problem', 'error');
    },
  });

  const saveAssessmentMutation = useMutation({
    mutationFn: (assessmentData) => {
      if (selectedAssessment?._id) {
        return adminService.updateAssessment(selectedAssessment._id, assessmentData);
      }
      return adminService.createAssessment(assessmentData);
    },
    onSuccess: () => {
      showToast('Assessment saved & scheduled', 'success');
      refetchAssessments();
      refetchStats();
    },
    onError: (err) => {
      showToast(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to save assessment',
        'error'
      );
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id) => adminService.deleteAssessment(id),
    onSuccess: () => {
      showToast('Assessment deleted', 'info');
      setConfirmDelete(null);
      refetchAssessments();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to delete assessment', 'error');
    },
  });

  const resolveVerdictMutation = useMutation({
    mutationFn: ({ attemptId, verdictData }) =>
      adminService.resolveIntegrityVerdict(attemptId, verdictData),
    onSuccess: () => {
      showToast('Moderation verdict applied', 'success');
      refetchIntegrity();
      refetchStats();
    },
    onError: (err) => {
      showToast(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to apply verdict',
        'error'
      );
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      showToast('User role updated', 'success');
      refetchUsers();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to update user role', 'error');
    },
  });

  const verifyAlumniMutation = useMutation({
    mutationFn: ({ userId, alumniData }) => adminService.verifyAlumniStatus(userId, alumniData),
    onSuccess: () => {
      showToast('Alumni status verified & badge issued', 'success');
      refetchUsers();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.message || 'Failed to verify alumni status', 'error');
    },
  });

  const problems = problemsData?.problems || [];
  const assessments = assessmentsData?.assessments || [];
  const integrityAttempts = integrityData?.attempts || [];
  const users = usersData?.users || [];
  const subjects = subjectsData?.data || [];

  const handleRefreshAll = () => {
    refetchStats();
    refetchProblems();
    refetchAssessments();
    refetchIntegrity();
    if (activeTab === 'users') {
      refetchUsers();
    }
    showToast('Studio metrics synchronized', 'info');
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'problem') {
      deleteProblemMutation.mutate(confirmDelete.id);
    } else if (confirmDelete.type === 'assessment') {
      deleteAssessmentMutation.mutate(confirmDelete.id);
    }
  };

  const isDeleting = deleteProblemMutation.isPending || deleteAssessmentMutation.isPending;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <PageHeader
        eyebrow="~/admin-studio · Institutional Governance"
        title="Admin & Faculty Studio"
        description="Institutional console for algorithm authoring, proctored exam scheduling, integrity moderation, and alumni verification."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="compiler" size="md">
              Staff Console
            </Badge>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={RefreshCw}
              onClick={handleRefreshAll}
            >
              Refresh
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setSelectedProblem(null);
                setIsProblemModalOpen(true);
              }}
            >
              Author Problem
            </Button>
          </div>
        }
      />

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="problems">
            <Code2 className="w-3.5 h-3.5 mr-1.5" />
            Problems ({stats?.coding?.problems || 0})
          </TabsTrigger>
          <TabsTrigger value="assessments">
            <FileCheck2 className="w-3.5 h-3.5 mr-1.5" />
            Exams &amp; Assessments ({stats?.assessments?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="integrity">
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            Integrity Queue ({stats?.assessments?.pendingReviewFlags || 0})
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            Users &amp; Alumni ({stats?.users?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                              */}
        {/* ======================================================== */}
        <TabsContent value="overview" className="space-y-6 pt-2">
          {statsLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : statsError ? (
            <ErrorState
              title="Unable to load studio telemetry"
              message={statsError?.response?.data?.message || statsError.message}
              onRetry={refetchStats}
            />
          ) : (
            <MetricStrip>
              <MetricItem
                label="Total Platform Users"
                value={stats?.users?.total || 0}
                subvalue={`${stats?.users?.students || 0} Students · ${stats?.users?.seniors || 0} Seniors`}
                icon={Users}
              />
              <MetricItem
                label="Verified Alumni"
                value={stats?.users?.alumni || 0}
                subvalue="Mentorship badge holders"
                icon={Award}
                accent="brand"
              />
              <MetricItem
                label="Coding Problems"
                value={stats?.coding?.problems || 0}
                subvalue={`${stats?.coding?.submissions || 0} Total submissions`}
                icon={Code2}
                accent="compiler"
              />
              <MetricItem
                label="Pending Integrity Flags"
                value={stats?.assessments?.pendingReviewFlags || 0}
                subvalue="Requires faculty review"
                icon={AlertTriangle}
              />
            </MetricStrip>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Quick Actions Card */}
            <Card className="p-5 space-y-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-700" />
                  <span>Quick Faculty Workflows</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Launch authoring workflows to publish coding challenges and schedule proctored assessments.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProblem(null);
                    setIsProblemModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-elevated/60 border border-surface-700 text-left hover:border-brand-500/45 hover:bg-elevated transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-700 mb-2.5 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    <Code2 className="w-4 h-4" />
                  </div>
                  <div className="font-display font-semibold text-surface-100 text-sm">
                    Create Problem
                  </div>
                  <div className="text-xs text-surface-400 mt-0.5">
                    Author algorithm challenge &amp; test cases
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedAssessment(null);
                    setIsAssessmentModalOpen(true);
                  }}
                  className="p-4 rounded-xl bg-elevated/60 border border-surface-700 text-left hover:border-brand-500/45 hover:bg-elevated transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-compiler-500/10 border border-compiler-500/25 flex items-center justify-center badge-compiler mb-2.5">
                    <FileCheck2 className="w-4 h-4" />
                  </div>
                  <div className="font-display font-semibold text-surface-100 text-sm">
                    Schedule Exam
                  </div>
                  <div className="text-xs text-surface-400 mt-0.5">
                    Configure timed proctored assessment
                  </div>
                </button>
              </div>
            </Card>

            {/* Pending Flags Alert Card */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Proctoring Signals Queue</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Attempts flagged by automated focus and fullscreen auditing.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('integrity')}
                >
                  View All
                </Button>
              </div>

              {integrityLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                </div>
              ) : integrityAttempts.length > 0 ? (
                <div className="space-y-2">
                  {integrityAttempts.slice(0, 3).map((att) => (
                    <div
                      key={att._id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl bg-elevated/60 border border-surface-700 text-xs"
                    >
                      <div className="min-w-0">
                        <span className="font-semibold text-surface-100 block truncate">
                          {att.userId?.name || 'Examinee'}
                        </span>
                        <span className="text-[11px] text-surface-400 truncate block">
                          {att.assessmentId?.title || 'Assessment'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="warning" size="sm">
                          <AlertTriangle className="w-3 h-3" />
                          {att.reviewSignalsCount || 0} signals
                        </Badge>
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            setSelectedAttempt(att);
                            setIsVerdictModalOpen(true);
                          }}
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-elevated/45 border border-surface-700 text-center space-y-1.5">
                  <CheckCircle2 className="w-5 h-5 badge-compiler mx-auto" />
                  <p className="text-xs font-medium text-surface-200">
                    No pending proctoring flags
                  </p>
                  <p className="text-[11px] text-surface-400">
                    All submitted examinations have cleared integrity moderation.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: PROBLEM AUTHORING STUDIO                          */}
        {/* ======================================================== */}
        <TabsContent value="problems" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-xl">
              <div className="flex-1 min-w-0">
                <Input
                  aria-label="Search coding problems"
                  placeholder="Search problem title or tags..."
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  leftIcon={Search}
                />
              </div>

              <div className="w-full sm:w-44 shrink-0">
                <Select
                  aria-label="Filter by difficulty"
                  value={problemDifficulty}
                  onChange={(e) => setProblemDifficulty(e.target.value)}
                  options={[
                    { value: '', label: 'All Difficulties' },
                    { value: 'easy', label: 'Easy' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'hard', label: 'Hard' },
                  ]}
                />
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setSelectedProblem(null);
                setIsProblemModalOpen(true);
              }}
            >
              Create New Problem
            </Button>
          </div>

          {problemsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : problemsError ? (
            <ErrorState
              title="Unable to load problem catalogue"
              message={problemsError?.response?.data?.message || problemsError.message}
              onRetry={refetchProblems}
            />
          ) : problems.length === 0 ? (
            <EmptyState
              icon={Code2}
              title="No algorithm problems found"
              description="No coding challenges match your current search or difficulty filter."
              actionLabel="Create New Problem"
              onAction={() => {
                setSelectedProblem(null);
                setIsProblemModalOpen(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Problem Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Test Cases</TableHead>
                  <TableHead>Time Limit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((p) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      <div className="font-semibold text-surface-100">{p.title}</div>
                      <span className="text-[11px] font-mono text-surface-400">/{p.slug}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.difficulty === 'easy'
                            ? 'success'
                            : p.difficulty === 'medium'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {p.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-md bg-elevated border border-surface-700 font-mono text-[10px] text-surface-300"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-300">
                      {p.testCaseCount || p.sampleTestCases?.length || 0} cases
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-400">
                      {p.constraints?.timeLimitMs || 2000} ms
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const full = await adminService.getProblemById(p._id);
                              setSelectedProblem(full);
                              setIsProblemModalOpen(true);
                            } catch (err) {
                              showToast(
                                err.response?.data?.message || 'Failed to load problem details',
                                'error'
                              );
                            }
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors"
                          aria-label={`Edit ${p.title}`}
                          title="Edit Problem"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'problem',
                              id: p._id,
                              title: p.title,
                            })
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          aria-label={`Delete ${p.title}`}
                          title="Delete Problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: ASSESSMENTS & EXAMS                               */}
        {/* ======================================================== */}
        <TabsContent value="assessments" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                aria-label="Search assessments"
                placeholder="Search scheduled assessments..."
                value={assessmentSearch}
                onChange={(e) => setAssessmentSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Plus}
              onClick={() => {
                setSelectedAssessment(null);
                setIsAssessmentModalOpen(true);
              }}
            >
              Schedule New Exam
            </Button>
          </div>

          {assessmentsLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : assessmentsError ? (
            <ErrorState
              title="Unable to load assessments"
              message={assessmentsError?.response?.data?.message || assessmentsError.message}
              onRetry={refetchAssessments}
            />
          ) : assessments.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No proctored assessments scheduled"
              description="Create and configure an assessment to enable student testing and telemetry."
              actionLabel="Schedule New Exam"
              onAction={() => {
                setSelectedAssessment(null);
                setIsAssessmentModalOpen(true);
              }}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Student Attempts</TableHead>
                  <TableHead>Proctoring Rules</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell>
                      <div className="font-semibold text-surface-100">{a.title}</div>
                      <span className="text-[11px] font-mono text-surface-400">
                        {a.questionsCount || a.questions?.length || 0} Questions
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-surface-300">
                      {a.subjectId?.name || 'General Curriculum'}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-300">
                      {a.durationMinutes} mins
                    </TableCell>
                    <TableCell className="font-mono font-bold text-brand-700 text-xs">
                      {a.totalMarks} pts
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      <span className="text-surface-100 font-semibold">
                        {a.stats?.totalAttempts || 0}
                      </span>
                      {a.stats?.flaggedCount > 0 && (
                        <span className="ml-2 text-amber-700 dark:text-amber-400 text-[11px]">
                          ({a.stats.flaggedCount} flagged)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1 text-[10px]">
                        {a.rules?.fullScreenRequired && (
                          <Badge variant="surface" size="sm">
                            Fullscreen
                          </Badge>
                        )}
                        {a.rules?.trackTabSwitches && (
                          <Badge variant="surface" size="sm">
                            Tab Audited
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssessment(a);
                            setIsAssessmentModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors"
                          aria-label={`Edit ${a.title}`}
                          title="Edit Assessment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setConfirmDelete({
                              type: 'assessment',
                              id: a._id,
                              title: a.title,
                            })
                          }
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          aria-label={`Delete ${a.title}`}
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: INTEGRITY QUEUE & MODERATION                      */}
        {/* ======================================================== */}
        <TabsContent value="integrity" className="space-y-4 pt-2">
          {integrityLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : integrityError ? (
            <ErrorState
              title="Unable to load integrity signals"
              message={integrityError?.response?.data?.message || integrityError.message}
              onRetry={refetchIntegrity}
            />
          ) : integrityAttempts.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No pending proctoring flags"
              description="All student examination attempts have cleared automated integrity verification."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Student Candidate</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Current Score</TableHead>
                  <TableHead>Audit Signals</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Moderation Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrityAttempts.map((att) => (
                  <TableRow key={att._id}>
                    <TableCell>
                      <div className="font-semibold text-surface-100">{att.userId?.name}</div>
                      <div className="text-[11px] font-mono text-surface-400">
                        {att.userId?.email}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-surface-300">
                      {att.assessmentId?.title}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-brand-700 text-xs">
                      {att.score} / {att.assessmentId?.totalMarks || 100}
                    </TableCell>
                    <TableCell>
                      <Badge variant="warning" size="sm">
                        <AlertTriangle className="w-3 h-3" />
                        {att.reviewSignalsCount || 0} signals
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={att.status === 'submitted' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {att.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedAttempt(att);
                          setIsVerdictModalOpen(true);
                        }}
                      >
                        Review Verdict
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 5: USERS & ALUMNI GOVERNANCE                         */}
        {/* ======================================================== */}
        <TabsContent value="users" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 max-w-xl">
            <div className="flex-1 min-w-0">
              <Input
                aria-label="Search students or faculty"
                placeholder="Search students or faculty by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                leftIcon={Search}
              />
            </div>

            <div className="w-full sm:w-48 shrink-0">
              <Select
                aria-label="Filter users by role"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Roles' },
                  { value: 'student', label: 'Student' },
                  { value: 'senior', label: 'Senior' },
                  { value: 'contentAdmin', label: 'Content Admin' },
                  { value: 'platformAdmin', label: 'Platform Admin' },
                ]}
              />
            </div>
          </div>

          {usersLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : usersError ? (
            <ErrorState
              title="Unable to load user directory"
              message={usersError?.response?.data?.message || usersError.message}
              onRetry={refetchUsers}
            />
          ) : users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users matched your filter"
              description="Try adjusting your name/email query or role filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>User</TableHead>
                  <TableHead>Role Assignment</TableHead>
                  <TableHead>University / Branch</TableHead>
                  <TableHead>Alumni Status</TableHead>
                  <TableHead className="text-right">Governance Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="font-semibold text-surface-100">{u.name}</div>
                      <div className="text-[11px] font-mono text-surface-400">
                        {u.email} · @{u.username || 'user'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        aria-label={`Role for ${u.name}`}
                        value={u.role}
                        onChange={(e) =>
                          updateUserRoleMutation.mutate({ userId: u._id, role: e.target.value })
                        }
                        className="h-8 text-xs rounded-lg bg-auth-input border border-surface-600 text-surface-100 px-2.5 focus:outline-none focus:border-brand-500 cursor-pointer"
                      >
                        <option value="student">student</option>
                        <option value="senior">senior</option>
                        <option value="contentAdmin">contentAdmin</option>
                        <option value="platformAdmin">platformAdmin</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-xs text-surface-300">
                      {u.university || 'MIT'} · {u.branch || 'CSE'}
                    </TableCell>
                    <TableCell>
                      {u.isAlumni ? (
                        <Badge variant="gold" size="sm">
                          <Award className="w-3 h-3" />
                          Verified Alumni ({u.profile?.currentCompany || 'Alumni'})
                        </Badge>
                      ) : (
                        <span className="text-surface-400 text-xs">Undergraduate</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant={u.isAlumni ? 'secondary' : 'primary'}
                        size="sm"
                        leftIcon={Award}
                        onClick={() => {
                          setSelectedUser(u);
                          setIsAlumniModalOpen(true);
                        }}
                      >
                        {u.isAlumni ? 'Edit Alumni' : 'Verify Alumni'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProblemModal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        problem={selectedProblem}
        onSave={(problemData, testCases) =>
          saveProblemMutation.mutateAsync({ problemData, testCases })
        }
      />

      <AssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        assessment={selectedAssessment}
        subjects={subjects}
        onSave={(assessmentData) => saveAssessmentMutation.mutateAsync(assessmentData)}
      />

      <IntegrityVerdictModal
        isOpen={isVerdictModalOpen}
        onClose={() => setIsVerdictModalOpen(false)}
        attempt={selectedAttempt}
        onResolve={(attemptId, verdictData) =>
          resolveVerdictMutation.mutateAsync({ attemptId, verdictData })
        }
      />

      <VerifyAlumniModal
        isOpen={isAlumniModalOpen}
        onClose={() => setIsAlumniModalOpen(false)}
        user={selectedUser}
        onVerify={(userId, alumniData) =>
          verifyAlumniMutation.mutateAsync({ userId, alumniData })
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(confirmDelete)}
        onClose={() => !isDeleting && setConfirmDelete(null)}
        title={
          confirmDelete?.type === 'problem'
            ? 'Delete Coding Problem?'
            : 'Delete Proctored Assessment?'
        }
        description="This institutional action permanently removes the selected item and cannot be undone."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300">
            Confirm deletion of <strong>{confirmDelete?.title}</strong>.
          </div>
          <div className="flex justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminStudioPage;
