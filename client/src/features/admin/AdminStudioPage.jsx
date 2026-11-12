import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ShieldCheck,
  Code2,
  FileCheck2,
  AlertTriangle,
  Users,
  Plus,
  Search,
  Trash2,
  Edit3,
  Award,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import adminService from '../../services/admin.service.js';
import academicsService from '../../services/academics.service.js';
import { Card, CardTitle, CardDescription } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { StatCard } from '../../components/StatCard.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/Tabs.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/Table.jsx';
import { useToast } from '../../components/Toast.jsx';

import ProblemModal from './components/ProblemModal.jsx';
import AssessmentModal from './components/AssessmentModal.jsx';
import IntegrityVerdictModal from './components/IntegrityVerdictModal.jsx';
import VerifyAlumniModal from './components/VerifyAlumniModal.jsx';

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

  // Queries
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminService.getStats(),
  });

  const { data: problemsData, refetch: refetchProblems } = useQuery({
    queryKey: ['admin-problems', problemSearch, problemDifficulty],
    queryFn: () => adminService.getProblems({ search: problemSearch, difficulty: problemDifficulty }),
    enabled: activeTab === 'problems' || activeTab === 'overview',
  });

  const { data: assessmentsData, refetch: refetchAssessments } = useQuery({
    queryKey: ['admin-assessments', assessmentSearch],
    queryFn: () => adminService.getAssessments({ search: assessmentSearch }),
    enabled: activeTab === 'assessments' || activeTab === 'overview',
  });

  const { data: integrityData, refetch: refetchIntegrity } = useQuery({
    queryKey: ['admin-integrity'],
    queryFn: () => adminService.getIntegritySignals({ verdict: 'pending' }),
    enabled: activeTab === 'integrity' || activeTab === 'overview',
  });

  const { data: usersData, refetch: refetchUsers } = useQuery({
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
      showToast('Algorithm problem saved successfully!', 'success');
      refetchProblems();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.error?.message || 'Failed to save problem', 'error');
    },
  });

  const deleteProblemMutation = useMutation({
    mutationFn: (id) => adminService.deleteProblem(id),
    onSuccess: () => {
      showToast('Problem deleted successfully', 'info');
      refetchProblems();
      refetchStats();
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
      showToast('Assessment saved & scheduled!', 'success');
      refetchAssessments();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.error?.message || 'Failed to save assessment', 'error');
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id) => adminService.deleteAssessment(id),
    onSuccess: () => {
      showToast('Assessment deleted', 'info');
      refetchAssessments();
      refetchStats();
    },
  });

  const resolveVerdictMutation = useMutation({
    mutationFn: ({ attemptId, verdictData }) => adminService.resolveIntegrityVerdict(attemptId, verdictData),
    onSuccess: () => {
      showToast('Moderation verdict applied!', 'success');
      refetchIntegrity();
      refetchStats();
    },
    onError: (err) => {
      showToast(err.response?.data?.error?.message || 'Failed to apply verdict', 'error');
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => adminService.updateUserRole(userId, role),
    onSuccess: () => {
      showToast('User role updated!', 'success');
      refetchUsers();
      refetchStats();
    },
  });

  const verifyAlumniMutation = useMutation({
    mutationFn: ({ userId, alumniData }) => adminService.verifyAlumniStatus(userId, alumniData),
    onSuccess: () => {
      showToast('Alumni status verified & badge issued!', 'success');
      refetchUsers();
      refetchStats();
    },
  });

  const problems = problemsData?.problems || [];
  const assessments = assessmentsData?.assessments || [];
  const integrityAttempts = integrityData?.attempts || [];
  const users = usersData?.users || [];
  const subjects = subjectsData?.data || [];

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Faculty Studio</h1>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Phase 6 Active
            </span>
          </div>
          <p className="text-surface-400 text-xs">
            Institutional governance console for problem authoring, exam scheduling, proctoring integrity moderation, and alumni verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchProblems();
              refetchAssessments();
              refetchIntegrity();
              refetchUsers();
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedProblem(null);
              setIsProblemModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Author Problem</span>
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-surface-900 border border-surface-800 p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs">
            📊 Overview
          </TabsTrigger>
          <TabsTrigger value="problems" className="text-xs">
            💻 Problem Authoring ({stats?.coding?.problems || 0})
          </TabsTrigger>
          <TabsTrigger value="assessments" className="text-xs">
            🛡️ Exams & Assessments ({stats?.assessments?.total || 0})
          </TabsTrigger>
          <TabsTrigger value="integrity" className="text-xs">
            🚨 Integrity Queue ({stats?.assessments?.pendingReviewFlags || 0})
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            🎓 Users & Alumni ({stats?.users?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* ======================================================== */}
        {/* TAB 1: OVERVIEW & ANALYTICS                             */}
        {/* ======================================================== */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Students & Users"
              value={stats?.users?.total || 0}
              subtitle={`${stats?.users?.students || 0} Students • ${stats?.users?.seniors || 0} Seniors`}
              icon={Users}
            />
            <StatCard
              title="Verified Alumni Mentors"
              value={stats?.users?.alumni || 0}
              subtitle="Gold Badge holders"
              icon={Award}
            />
            <StatCard
              title="Coding Problems"
              value={stats?.coding?.problems || 0}
              subtitle={`${stats?.coding?.submissions || 0} Submissions`}
              icon={Code2}
            />
            <StatCard
              title="Pending Integrity Flags"
              value={stats?.assessments?.pendingReviewFlags || 0}
              subtitle="Requires faculty review"
              icon={AlertTriangle}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quick Actions Card */}
            <Card className="p-5 border-surface-800 bg-surface-900/60">
              <CardTitle className="text-base text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Quick Faculty Actions</span>
              </CardTitle>
              <CardDescription className="text-xs mb-4">
                Launch key faculty workflows to manage student assessments and coding tasks.
              </CardDescription>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setSelectedProblem(null);
                    setIsProblemModalOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 text-left hover:border-brand-500/50 transition-colors group"
                >
                  <Code2 className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-white text-xs">Create Problem</div>
                  <div className="text-[11px] text-surface-400 mt-0.5">Author algorithm challenge</div>
                </button>

                <button
                  onClick={() => {
                    setSelectedAssessment(null);
                    setIsAssessmentModalOpen(true);
                  }}
                  className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 text-left hover:border-brand-500/50 transition-colors group"
                >
                  <FileCheck2 className="w-5 h-5 text-brand-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-semibold text-white text-xs">Schedule Exam</div>
                  <div className="text-[11px] text-surface-400 mt-0.5">Setup proctored test</div>
                </button>
              </div>
            </Card>

            {/* Pending Flags Alert Card */}
            <Card className="p-5 border-surface-800 bg-surface-900/60">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Proctoring Signals Queue</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('integrity')} className="text-[11px]">
                  View All &rarr;
                </Button>
              </div>
              <CardDescription className="text-xs mb-4">
                Attempts flagged by the automated anti-cheat engine (tab hidden, window blur).
              </CardDescription>

              <div className="space-y-2">
                {integrityAttempts.slice(0, 3).map((att) => (
                  <div key={att._id} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-xs">
                    <div>
                      <span className="font-semibold text-white block">{att.userId?.name}</span>
                      <span className="text-[11px] text-surface-400">{att.assessmentId?.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono text-[11px]">⚠️ {att.reviewSignalsCount} signals</span>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedAttempt(att);
                          setIsVerdictModalOpen(true);
                        }}
                        className="text-[10px] h-7 px-2"
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
                {!integrityAttempts.length && (
                  <div className="text-center p-6 text-surface-500 text-xs">
                    ✨ No pending proctoring flags! All examinations cleared.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 2: PROBLEM AUTHORING STUDIO                         */}
        {/* ======================================================== */}
        <TabsContent value="problems" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-500" />
                <input
                  type="text"
                  placeholder="Search problem title or tags..."
                  value={problemSearch}
                  onChange={(e) => setProblemSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={problemDifficulty}
                onChange={(e) => setProblemDifficulty(e.target.value)}
                className="h-8 rounded-xl bg-surface-900 border border-surface-800 text-xs text-surface-300 px-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedProblem(null);
                setIsProblemModalOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Problem</span>
            </Button>
          </div>

          <Card className="border-surface-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
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
                  <TableRow key={p._id} className="hover:bg-surface-850/50 transition-colors">
                    <TableCell className="font-semibold text-white">
                      <div>{p.title}</div>
                      <span className="text-[11px] font-mono text-surface-500">/{p.slug}</span>
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
                          <span key={t} className="px-1.5 py-0.5 rounded bg-surface-800 text-[10px] text-surface-300">
                            {t}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-surface-300">
                      {p.testCaseCount || p.sampleTestCases?.length || 0} cases
                    </TableCell>
                    <TableCell className="text-surface-400 text-xs">
                      {p.constraints?.timeLimitMs || 2000} ms
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={async () => {
                            const full = await adminService.getProblemById(p._id);
                            setSelectedProblem(full);
                            setIsProblemModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                          title="Edit Problem"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete problem "${p.title}"?`)) {
                              deleteProblemMutation.mutate(p._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Problem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!problems.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-surface-500">
                      No algorithm problems found matching criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 3: ASSESSMENTS & EXAMS                              */}
        {/* ======================================================== */}
        <TabsContent value="assessments" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-500" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={assessmentSearch}
                onChange={(e) => setAssessmentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSelectedAssessment(null);
                setIsAssessmentModalOpen(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule New Exam</span>
            </Button>
          </div>

          <Card className="border-surface-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total Marks</TableHead>
                  <TableHead>Student Attempts</TableHead>
                  <TableHead>Anti-Cheat Rules</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((a) => (
                  <TableRow key={a._id}>
                    <TableCell className="font-semibold text-white">
                      <div>{a.title}</div>
                      <span className="text-[11px] text-surface-400">{a.questionsCount || a.questions?.length || 0} Questions</span>
                    </TableCell>
                    <TableCell className="text-surface-300 text-xs">
                      {a.subjectId?.name || 'General Curriculum'}
                    </TableCell>
                    <TableCell className="text-surface-300 text-xs">
                      {a.durationMinutes} mins
                    </TableCell>
                    <TableCell className="font-bold text-brand-400 text-xs">
                      {a.totalMarks} pts
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="text-white font-medium">{a.stats?.totalAttempts || 0}</span>
                      {a.stats?.flaggedCount > 0 && (
                        <span className="ml-2 text-amber-400 font-mono text-[11px]">
                          ({a.stats.flaggedCount} flagged)
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {a.rules?.fullScreenRequired && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-300">Fullscreen</span>
                        )}
                        {a.rules?.trackTabSwitches && (
                          <span className="px-1.5 py-0.5 rounded bg-surface-800 text-surface-300">Tab Audited</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedAssessment(a);
                            setIsAssessmentModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                          title="Edit Assessment"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete assessment "${a.title}"?`)) {
                              deleteAssessmentMutation.mutate(a._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!assessments.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-surface-500">
                      No proctored exams created yet. Click Schedule New Exam to start.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 4: INTEGRITY QUEUE & MODERATION                     */}
        {/* ======================================================== */}
        <TabsContent value="integrity" className="space-y-4 pt-4">
          <Card className="border-surface-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Candidate</TableHead>
                  <TableHead>Exam Name</TableHead>
                  <TableHead>Current Score</TableHead>
                  <TableHead>Audit Signals</TableHead>
                  <TableHead>Submission Status</TableHead>
                  <TableHead className="text-right">Moderation Verdict</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integrityAttempts.map((att) => (
                  <TableRow key={att._id}>
                    <TableCell>
                      <div className="font-semibold text-white">{att.userId?.name}</div>
                      <div className="text-[11px] text-surface-400">{att.userId?.email}</div>
                    </TableCell>
                    <TableCell className="text-surface-300 text-xs">
                      {att.assessmentId?.title}
                    </TableCell>
                    <TableCell className="font-bold text-brand-400 text-xs">
                      {att.score} / {att.assessmentId?.totalMarks || 100}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-0.5 rounded-full font-mono text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold">
                        ⚠️ {att.reviewSignalsCount || 0} signals
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={att.status === 'submitted' ? 'success' : 'warning'} size="sm">
                        {att.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedAttempt(att);
                          setIsVerdictModalOpen(true);
                        }}
                        className="text-xs h-8"
                      >
                        Review Verdict
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!integrityAttempts.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-surface-500">
                      ✨ No pending proctoring flags! All student attempts cleared.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ======================================================== */}
        {/* TAB 5: USERS & ALUMNI GOVERNANCE                        */}
        {/* ======================================================== */}
        <TabsContent value="users" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-surface-500" />
                <input
                  type="text"
                  placeholder="Search students or faculty by name/email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-900 border border-surface-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="h-8 rounded-xl bg-surface-900 border border-surface-800 text-xs text-surface-300 px-2 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="senior">Senior</option>
                <option value="contentAdmin">Content Admin</option>
                <option value="platformAdmin">Platform Admin</option>
              </select>
            </div>
          </div>

          <Card className="border-surface-800 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>University / Branch</TableHead>
                  <TableHead>Alumni Status</TableHead>
                  <TableHead className="text-right">Faculty Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="font-semibold text-white">{u.name}</div>
                      <div className="text-[11px] font-mono text-surface-400">
                        {u.email} • @{u.username || 'user'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRoleMutation.mutate({ userId: u._id, role: e.target.value })}
                        className="h-7 text-xs rounded-lg bg-surface-900 border border-surface-800 text-surface-200 px-2 focus:outline-none focus:border-brand-500"
                      >
                        <option value="student">student</option>
                        <option value="senior">senior</option>
                        <option value="contentAdmin">contentAdmin</option>
                        <option value="platformAdmin">platformAdmin</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-surface-300 text-xs">
                      {u.university || 'MIT'} • {u.branch || 'CSE'}
                    </TableCell>
                    <TableCell>
                      {u.isAlumni ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full w-fit">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          Verified Alumni ({u.profile?.currentCompany || 'Alumni'})
                        </span>
                      ) : (
                        <span className="text-surface-500 text-xs">Undergraduate</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant={u.isAlumni ? 'outline' : 'primary'}
                        size="sm"
                        onClick={() => {
                          setSelectedUser(u);
                          setIsAlumniModalOpen(true);
                        }}
                        className="text-xs h-7 px-2.5 gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-300" />
                        <span>{u.isAlumni ? 'Edit Alumni' : 'Verify Alumni'}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!users.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-surface-500">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <ProblemModal
        isOpen={isProblemModalOpen}
        onClose={() => setIsProblemModalOpen(false)}
        problem={selectedProblem}
        onSave={(problemData, testCases) => saveProblemMutation.mutateAsync({ problemData, testCases })}
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
        onResolve={(attemptId, verdictData) => resolveVerdictMutation.mutateAsync({ attemptId, verdictData })}
      />

      <VerifyAlumniModal
        isOpen={isAlumniModalOpen}
        onClose={() => setIsAlumniModalOpen(false)}
        user={selectedUser}
        onVerify={(userId, alumniData) => verifyAlumniMutation.mutateAsync({ userId, alumniData })}
      />
    </div>
  );
};

export default AdminStudioPage;
