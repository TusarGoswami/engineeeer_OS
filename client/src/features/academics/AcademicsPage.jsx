import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext.jsx';
import { academicsService } from '../../services/academics.service.js';
import { dashboardService } from '../../services/dashboard.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Input,
  Select,
  Skeleton,
  EmptyState,
  ProgressRing,
  useToast,
} from '../../components/index.js';
import { SubjectDetailWorkspace } from './components/SubjectDetailWorkspace.jsx';
import { ResourcePreviewModal } from './components/ResourcePreviewModal.jsx';
import {
  BookOpen,
  Search,
  Layers,
  Clock,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';

const DEFAULT_BRANCHES = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication',
  'Mechanical Engineering',
];

/**
 * Splits syllabusOutline into compact unit preview pills for subject overview cards.
 */
function extractPreviewUnits(outline = '') {
  if (!outline || typeof outline !== 'string') return [];
  return outline
    .split(/[•|\n]+/)
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 2);
}

/**
 * Main Academic Curriculum Hub with Semester & Branch discovery, structured overview cards,
 * and integrated Subject/Syllabus/Topic Detail Workspace.
 */
export const AcademicsPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [selectedSemester, setSelectedSemester] = useState(user?.semester || 1);
  const [selectedBranch, setSelectedBranch] = useState(
    user?.branch || 'Computer Science and Engineering'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeTab, setActiveTab] = useState('topics'); // 'topics' | 'resources'
  const [previewResource, setPreviewResource] = useState(null);
  const [togglingTopicId, setTogglingTopicId] = useState(null);

  const branchOptions = useMemo(() => {
    const base = [...DEFAULT_BRANCHES];
    if (user?.branch && !base.includes(user.branch)) {
      base.unshift(user.branch);
    }
    return base.map((b) => ({ value: b, label: b }));
  }, [user?.branch]);

  // Query: Fetch subjects for semester, branch & search
  const { data: subjectsData, isLoading } = useQuery({
    queryKey: ['academics-subjects', selectedSemester, selectedBranch, searchQuery],
    queryFn: () =>
      academicsService.getSubjects({
        semester: selectedSemester,
        branch: selectedBranch,
        search: searchQuery || undefined,
      }),
  });

  // Query: Non-blocking curriculum summary telemetry for real overall topic completion
  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      try {
        return await dashboardService.getSummary();
      } catch {
        return null;
      }
    },
    staleTime: 60 * 1000,
  });

  // Query: Fetch active subject details & completed topic IDs
  const { data: subjectDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: ['academics-subject-details', activeSubject?._id],
    queryFn: () => academicsService.getSubjectById(activeSubject._id),
    enabled: !!activeSubject?._id,
  });

  // Query: Fetch subject resources (enabled whenever a subject is active so topic inspector & resources tab stay in sync)
  const { data: subjectResources, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['academics-subject-resources', activeSubject?._id],
    queryFn: () => academicsService.getResources(activeSubject._id),
    enabled: !!activeSubject?._id,
  });

  // Mutation: Toggle topic completion and sync progress caches immediately
  const toggleMutation = useMutation({
    mutationFn: ({ subjectId, topicId }) => {
      setTogglingTopicId(topicId);
      return academicsService.toggleTopic(subjectId, topicId);
    },
    onSuccess: (updatedProgress, variables) => {
      queryClient.setQueryData(
        ['academics-subject-details', variables.subjectId],
        (prev) =>
          prev
            ? {
                ...prev,
                completedTopicIds: updatedProgress?.completedTopicIds ?? prev.completedTopicIds,
                completionPercentage:
                  updatedProgress?.completionPercentage ?? prev.completionPercentage,
              }
            : prev
      );
      queryClient.invalidateQueries({
        queryKey: ['academics-subject-details', activeSubject?._id],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (err) => {
      showToast(err?.response?.data?.message || 'Failed to update topic progress', 'error');
    },
    onSettled: () => {
      setTogglingTopicId(null);
    },
  });

  const subjects = useMemo(() => subjectsData?.data || [], [subjectsData?.data]);

  const semesterMetrics = useMemo(() => {
    const totalCredits = subjects.reduce((sum, s) => sum + (s.credits || 4), 0);
    const totalTopics = subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0);
    const totalHours = subjects.reduce(
      (sum, s) =>
        sum + (s.topics || []).reduce((tSum, t) => tSum + (t.estimatedHours || 2), 0),
      0
    );
    return { totalCredits, totalTopics, totalHours };
  }, [subjects]);

  const openSubjectWorkspace = (subject) => {
    setActiveSubject(subject);
    setActiveTab('topics');
  };

  const overallAcademics = dashboardSummary?.stats?.academics || dashboardSummary?.academics;

  return (
    <>
      {activeSubject ? (
        <SubjectDetailWorkspace
          subject={activeSubject}
          subjectDetails={subjectDetails}
          isDetailsLoading={isDetailsLoading}
          subjectResources={subjectResources || []}
          isResourcesLoading={isResourcesLoading}
          siblingSubjects={subjects}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          selectedSemester={selectedSemester}
          onSelectSubject={openSubjectWorkspace}
          onBack={() => setActiveSubject(null)}
          onToggleTopic={(topicId) =>
            toggleMutation.mutate({
              subjectId: activeSubject._id,
              topicId,
            })
          }
          isToggling={toggleMutation.isPending}
          togglingTopicId={togglingTopicId}
          onPreviewResource={(res) => setPreviewResource(res)}
        />
      ) : (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Page Header & Branch Selector */}
          <PageHeader
            eyebrow={`~/academics · ${user?.university || 'Engineering University'} Curriculum`}
            title="Academic Curriculum Hub"
            description="Structured semester syllabi, verified lecture notes, PYQ archives, and topic completion tracking."
            actions={
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                {user?.semester && selectedSemester !== user.semester && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedSemester(user.semester)}
                  >
                    Jump to Sem {user.semester}
                  </Button>
                )}
                <div className="w-full sm:w-64">
                  <Select
                    aria-label="Engineering branch"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    leftIcon={Layers}
                    options={branchOptions}
                  />
                </div>
              </div>
            }
          />

          {/* Academic Telemetry Strip */}
          <MetricStrip>
            <MetricItem
              label="Semester Subjects"
              value={subjects.length}
              subvalue={`Semester ${selectedSemester} · ${semesterMetrics.totalCredits} Credits`}
              icon={BookOpen}
            />
            <MetricItem
              label="Syllabus Topics"
              value={semesterMetrics.totalTopics}
              subvalue={`${semesterMetrics.totalHours}h est. study time`}
              icon={GraduationCap}
              accent="brand"
            />
            <MetricItem
              label="Academic Branch"
              value={selectedBranch.split(' ')[0]}
              subvalue={selectedBranch}
              icon={Layers}
            />
            <MetricItem
              label="Overall Curriculum"
              value={
                overallAcademics
                  ? `${overallAcademics.percentComplete || 0}%`
                  : `${semesterMetrics.totalHours}h`
              }
              subvalue={
                overallAcademics
                  ? `${overallAcademics.completedTopics || 0}/${overallAcademics.totalTopics || 0} topics completed`
                  : 'Semester syllabus scope'
              }
              icon={CheckCircle2}
              accent="compiler"
            />
          </MetricStrip>

          {/* Semester Navigation & Subject Discovery Controls */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                Select Semester
              </span>
              {user?.semester && (
                <span className="font-mono text-[11px] text-surface-400">
                  Enrolled: <strong className="text-surface-100">Semester {user.semester}</strong>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => {
                const isSelected = selectedSemester === sem;
                const isCurrentUserSem = sem === user?.semester;

                return (
                  <button
                    key={sem}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedSemester(sem)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors select-none whitespace-nowrap inline-flex items-center gap-1.5 border shrink-0 ${
                      isSelected
                        ? 'bg-brand-500 border-brand-500 text-white font-semibold shadow-2xs'
                        : 'bg-elevated/60 border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                    }`}
                  >
                    <span>Semester {sem}</span>
                    {isCurrentUserSem && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-500/15 text-brand-700'
                        }`}
                      >
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-surface-700 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <Input
                  aria-label="Search subjects or syllabus topics"
                  type="text"
                  placeholder="Search subjects or syllabus topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={Search}
                />
              </div>
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={() => setSearchQuery('')}
                >
                  Clear Search
                </Button>
              )}
            </div>
          </Card>

          {/* Subjects Directory Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-52 w-full rounded-xl" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No subjects found"
              description={`No curriculum entries recorded for Semester ${selectedSemester} in ${selectedBranch}.`}
              actionLabel={searchQuery ? 'Reset Search' : undefined}
              onAction={searchQuery ? () => setSearchQuery('') : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjects.map((subject) => {
                const topicCount = subject.topics?.length || 0;
                const estHours = (subject.topics || []).reduce(
                  (sum, t) => sum + (t.estimatedHours || 2),
                  0
                );
                const cachedSubject = queryClient.getQueryData([
                  'academics-subject-details',
                  subject._id,
                ]);
                const completionPct =
                  cachedSubject?.completionPercentage ?? subject.completionPercentage;
                const hasCompletion =
                  completionPct !== undefined && completionPct !== null;
                const unitPreviews = extractPreviewUnits(subject.syllabusOutline);

                return (
                  <Card
                    key={subject._id}
                    hover
                    role="button"
                    tabIndex={0}
                    className="flex flex-col justify-between gap-4 cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                    onClick={() => openSubjectWorkspace(subject)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openSubjectWorkspace(subject);
                      }
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="brand">{subject.code}</Badge>
                          <span className="font-mono text-[11px] text-surface-400">
                            {subject.credits || 4} Credits
                          </span>
                        </div>

                        {hasCompletion ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-[11px] font-semibold text-surface-200 tabular-nums">
                              {completionPct}%
                            </span>
                            <ProgressRing
                              progress={completionPct}
                              size={30}
                              strokeWidth={3}
                              variant={completionPct === 100 ? 'compiler' : 'brand'}
                              showValue={false}
                            />
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-elevated border border-surface-700 font-mono text-[11px] text-surface-300 shrink-0">
                            <Clock className="w-3 h-3 text-brand-700" />
                            {estHours}h Est.
                          </span>
                        )}
                      </div>

                      <div>
                        <CardTitle className="text-base line-clamp-1 group-hover:text-brand-700 transition-colors">
                          {subject.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1 text-xs leading-relaxed">
                          {subject.description ||
                            'Comprehensive university curriculum covering theory modules, laboratory work, and PYQs.'}
                        </CardDescription>
                      </div>

                      {unitPreviews.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {unitPreviews.map((u, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-md bg-elevated/70 border border-surface-700 text-[10px] font-mono text-surface-300 truncate max-w-full"
                            >
                              {u}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3.5 border-t border-surface-700 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1.5 font-mono text-surface-400">
                        <BookmarkCheck className="w-3.5 h-3.5 text-brand-700" />
                        {topicCount} {topicCount === 1 ? 'Topic' : 'Topics'}
                      </span>

                      <span className="inline-flex items-center gap-1 font-medium text-brand-700 group-hover:translate-x-0.5 transition-transform">
                        Syllabus &amp; Notes
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* In-App Notes, PYQs & Syllabus Document Previewer */}
      <ResourcePreviewModal
        resource={previewResource}
        topics={subjectDetails?.topics || activeSubject?.topics || []}
        onClose={() => setPreviewResource(null)}
      />
    </>
  );
};

export default AcademicsPage;
