import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  GraduationCap,
  Layers,
  Loader2,
  User,
  Calendar,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '../../../components/index.js';

const RESOURCE_FILTERS = [
  { id: 'all', label: 'All Resources' },
  { id: 'notes', label: 'Notes' },
  { id: 'pyq', label: 'PYQs' },
  { id: 'lecture', label: 'Lectures' },
  { id: 'syllabus', label: 'Syllabus' },
  { id: 'quiz', label: 'Quizzes' },
];

const RESOURCE_BADGE_MAP = {
  notes: { label: 'NOTES', variant: 'brand' },
  pyq: { label: 'PYQ', variant: 'purple' },
  lecture: { label: 'LECTURE', variant: 'cyan' },
  syllabus: { label: 'SYLLABUS', variant: 'compiler' },
  quiz: { label: 'QUIZ', variant: 'warning' },
};

/**
 * Splits syllabusOutline strings ("Unit I: ... • Unit II: ...") into structured unit chips.
 */
function parseSyllabusUnits(outline = '') {
  if (!outline || typeof outline !== 'string') return [];
  return outline
    .split(/[•|\n]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

/**
 * Groups ordered syllabus topics into explicit units/chapters when metadata or title prefixes exist.
 */
function organizeTopicGroups(topics = []) {
  const sorted = [...topics].sort((a, b) => (a.order || 0) - (b.order || 0));
  const unitRegex = /^(Unit|Module|Chapter)\s+([IVX\d]+)\s*[:.\-\s]+(.+)$/i;

  const hasExplicitGrouping = sorted.some(
    (t) => t.unit || t.chapter || unitRegex.test(t.title || '')
  );

  if (!hasExplicitGrouping) {
    return [{ groupTitle: 'Core Syllabus Topics', items: sorted }];
  }

  const groupsMap = new Map();
  for (const topic of sorted) {
    let groupTitle = topic.unit || topic.chapter || 'Core Topics';
    if (!topic.unit && !topic.chapter && topic.title) {
      const match = topic.title.match(unitRegex);
      if (match) {
        groupTitle = `${match[1]} ${match[2]}`;
      }
    }
    if (!groupsMap.has(groupTitle)) {
      groupsMap.set(groupTitle, []);
    }
    groupsMap.get(groupTitle).push(topic);
  }

  return Array.from(groupsMap.entries()).map(([groupTitle, items]) => ({
    groupTitle,
    items,
  }));
}

/**
 * Dedicated Subject Detail, Syllabus Units, Interactive Topic Inspector, and Study Resources Workspace.
 */
export function SubjectDetailWorkspace({
  subject,
  subjectDetails,
  isDetailsLoading,
  subjectResources = [],
  isResourcesLoading,
  siblingSubjects = [],
  activeTab,
  onTabChange,
  selectedSemester,
  onSelectSubject,
  onBack,
  onToggleTopic,
  isToggling,
  togglingTopicId,
  onPreviewResource,
}) {
  const detail = subjectDetails || subject;
  const completedIds = useMemo(
    () => detail?.completedTopicIds || [],
    [detail?.completedTopicIds]
  );

  const orderedTopics = useMemo(
    () => [...(detail?.topics || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [detail?.topics]
  );

  const syllabusUnits = useMemo(
    () => parseSyllabusUnits(detail?.syllabusOutline),
    [detail?.syllabusOutline]
  );

  const topicGroups = useMemo(
    () => organizeTopicGroups(orderedTopics),
    [orderedTopics]
  );

  const [topicStatusFilter, setTopicStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [resourceFilter, setResourceFilter] = useState('all');
  const autoSelectedSubjectRef = useRef(null);

  // Reset filters and initial placeholder selection when switching subjects
  useEffect(() => {
    setTopicStatusFilter('all');
    setResourceFilter('all');
    autoSelectedSubjectRef.current = null;
    setSelectedTopicId(orderedTopics[0]?.topicId || null);
  }, [subject?._id]);

  // Once subject details (including completedTopicIds) finish loading, highlight the first pending topic
  useEffect(() => {
    if (isDetailsLoading || !subjectDetails?._id) return;
    if (autoSelectedSubjectRef.current === subjectDetails._id) return;
    autoSelectedSubjectRef.current = subjectDetails._id;
    const firstPending = orderedTopics.find((t) => !completedIds.includes(t.topicId));
    setSelectedTopicId((firstPending || orderedTopics[0])?.topicId || null);
  }, [isDetailsLoading, subjectDetails?._id, orderedTopics, completedIds]);

  const totalHours = useMemo(
    () => orderedTopics.reduce((sum, t) => sum + (t.estimatedHours || 2), 0),
    [orderedTopics]
  );

  const remainingHours = useMemo(
    () =>
      orderedTopics
        .filter((t) => !completedIds.includes(t.topicId))
        .reduce((sum, t) => sum + (t.estimatedHours || 2), 0),
    [orderedTopics, completedIds]
  );

  const completionPct =
    detail?.completionPercentage !== undefined
      ? detail.completionPercentage
      : orderedTopics.length > 0
      ? Math.round((completedIds.length / orderedTopics.length) * 100)
      : 0;

  const selectedTopic =
    orderedTopics.find((t) => t.topicId === selectedTopicId) || orderedTopics[0] || null;
  const selectedTopicIndex = selectedTopic
    ? orderedTopics.findIndex((t) => t.topicId === selectedTopic.topicId)
    : -1;
  const isSelectedTopicDone = selectedTopic ? completedIds.includes(selectedTopic.topicId) : false;

  const selectedTopicResources = useMemo(() => {
    if (!selectedTopic) return [];
    return subjectResources.filter((r) => r.topicId === selectedTopic.topicId);
  }, [subjectResources, selectedTopic]);

  const filteredResources = useMemo(() => {
    if (resourceFilter === 'all') return subjectResources;
    return subjectResources.filter((r) => r.type === resourceFilter);
  }, [subjectResources, resourceFilter]);

  const resourceCountsByType = useMemo(() => {
    const counts = { all: subjectResources.length };
    for (const r of subjectResources) {
      counts[r.type] = (counts[r.type] || 0) + 1;
    }
    return counts;
  }, [subjectResources]);

  const matchesTopicFilter = (topic) => {
    const isDone = completedIds.includes(topic.topicId);
    if (topicStatusFilter === 'pending') return !isDone;
    if (topicStatusFilter === 'completed') return isDone;
    return true;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Breadcrumb & Semester Subject Switcher */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-surface-400">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={onBack}
            >
              Back to Semester {selectedSemester}
            </Button>
            <span className="text-surface-500 hidden sm:inline">/</span>
            <nav aria-label="Academic breadcrumb" className="hidden sm:flex items-center gap-1.5 font-mono text-[11px]">
              <button
                type="button"
                onClick={onBack}
                className="hover:text-surface-100 transition-colors"
              >
                Academic Hub
              </button>
              <ChevronRight className="w-3 h-3 text-surface-500" />
              <span>Semester {detail?.semester || selectedSemester}</span>
              <ChevronRight className="w-3 h-3 text-surface-500" />
              <span className="text-surface-100 font-semibold">{detail?.code}</span>
            </nav>
          </div>

          {siblingSubjects.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full scrollbar-none">
              <span className="font-mono text-[10px] uppercase tracking-wider text-surface-400 shrink-0 mr-1">
                Sem Subjects:
              </span>
              {siblingSubjects.map((sib) => {
                const isActive = sib._id === subject._id;
                return (
                  <button
                    key={sib._id}
                    type="button"
                    onClick={() => !isActive && onSelectSubject(sib)}
                    className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-colors border shrink-0 ${
                      isActive
                        ? 'bg-brand-500 border-brand-500 text-white'
                        : 'bg-card border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                    }`}
                  >
                    {sib.code}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Subject Hero & Completion Telemetry */}
      <Card className="p-5 sm:p-6">
        {isDetailsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand">{detail?.code}</Badge>
                <Badge variant="surface">{detail?.credits || 4} Credits</Badge>
                <Badge variant="outline">Semester {detail?.semester || selectedSemester}</Badge>
                {detail?.university && (
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] text-surface-400">
                    <GraduationCap className="w-3.5 h-3.5 text-brand-700" />
                    {detail.university}
                    {detail.branch ? ` · ${detail.branch}` : ''}
                  </span>
                )}
              </div>

              <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-surface-100 leading-tight">
                {detail?.name}
              </h1>

              {detail?.description && (
                <p className="text-sm text-surface-400 max-w-3xl leading-relaxed">
                  {detail.description}
                </p>
              )}
            </div>

            {/* Real Progress Overview Panel */}
            <div className="lg:w-80 shrink-0 rounded-xl border border-surface-700 bg-elevated/60 p-4 space-y-3">
              <div className="flex items-center gap-4">
                <ProgressRing
                  progress={completionPct}
                  size={64}
                  strokeWidth={6}
                  variant={completionPct === 100 ? 'compiler' : 'brand'}
                  label={undefined}
                />
                <div className="min-w-0 space-y-0.5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-surface-400 font-semibold">
                    Syllabus Mastery
                  </div>
                  <div className="font-mono tabular-nums text-lg font-bold text-surface-100">
                    {completedIds.length} / {orderedTopics.length} Topics
                  </div>
                  <div className="text-xs text-surface-400 font-mono tabular-nums">
                    {remainingHours}h remaining · {totalHours}h est.
                  </div>
                </div>
              </div>
              <ProgressBar
                value={completionPct}
                variant={completionPct === 100 ? 'compiler' : 'brand'}
                size="sm"
                label="Topic Completion Progress"
                showValue
              />
            </div>
          </div>
        )}

        {/* Structured Course Syllabus Outline (from backend syllabusOutline field) */}
        {!isDetailsLoading && syllabusUnits.length > 0 && (
          <div className="mt-5 pt-5 border-t border-surface-700 space-y-2.5">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
              <Layers className="w-3.5 h-3.5 text-brand-700" />
              Course Syllabus Units
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {syllabusUnits.map((unitText, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2.5 rounded-lg bg-elevated/55 border border-surface-700 text-xs text-surface-200 leading-snug"
                >
                  {unitText}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Main Subject Tabs: Syllabus Topics Checklist vs Study Resources & PYQs */}
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="topics">
              Topics Checklist ({orderedTopics.length})
            </TabsTrigger>
            <TabsTrigger value="resources">
              Study Resources &amp; PYQs ({subjectResources.length})
            </TabsTrigger>
          </TabsList>

          {activeTab === 'topics' && orderedTopics.length > 0 && (
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `All (${orderedTopics.length})` },
                {
                  id: 'pending',
                  label: `Pending (${orderedTopics.length - completedIds.length})`,
                },
                { id: 'completed', label: `Completed (${completedIds.length})` },
              ].map((filterItem) => (
                <button
                  key={filterItem.id}
                  type="button"
                  onClick={() => setTopicStatusFilter(filterItem.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                    topicStatusFilter === filterItem.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-card border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* TAB 1: Syllabus & Topics Master-Detail */}
        <TabsContent value="topics" className="mt-4">
          {isDetailsLoading ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
              <div className="xl:col-span-7 space-y-2.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="xl:col-span-5 h-64 w-full rounded-xl" />
            </div>
          ) : orderedTopics.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No syllabus topics recorded"
              description="Topics and unit breakdowns have not been published for this course yet."
            />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
              {/* Topics Checklist Column */}
              <div className="xl:col-span-7 space-y-4">
                {topicGroups.map((group) => {
                  const visibleItems = group.items.filter(matchesTopicFilter);
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={group.groupTitle} className="space-y-2.5">
                      <div className="flex items-center justify-between px-1">
                        <h2 className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                          {group.groupTitle}
                        </h2>
                        <span className="font-mono text-[11px] text-surface-400 tabular-nums">
                          {group.items.filter((t) => completedIds.includes(t.topicId)).length}/
                          {group.items.length} done
                        </span>
                      </div>

                      <div className="space-y-2">
                        {visibleItems.map((topic) => {
                          const globalIdx = orderedTopics.findIndex(
                            (t) => t.topicId === topic.topicId
                          );
                          const isDone = completedIds.includes(topic.topicId);
                          const isInspected = selectedTopic?.topicId === topic.topicId;
                          const isBusy = isToggling && togglingTopicId === topic.topicId;
                          const linkedCount = subjectResources.filter(
                            (r) => r.topicId === topic.topicId
                          ).length;

                          return (
                            <div
                              key={topic.topicId}
                              className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                                isInspected
                                  ? 'border-brand-500/45 bg-elevated/75 shadow-[var(--shadow-card)]'
                                  : isDone
                                  ? 'border-compiler-500/30 bg-compiler-500/8'
                                  : 'border-surface-700 bg-card hover:border-surface-600'
                              }`}
                            >
                              <button
                                type="button"
                                disabled={isBusy}
                                aria-label={
                                  isDone
                                    ? `Mark ${topic.title} as incomplete`
                                    : `Mark ${topic.title} as complete`
                                }
                                onClick={() => onToggleTopic(topic.topicId)}
                                className="mt-0.5 p-0.5 rounded-full shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                              >
                                {isBusy ? (
                                  <Loader2 className="w-5 h-5 text-brand-700 animate-spin" />
                                ) : isDone ? (
                                  <CheckCircle2 className="w-5 h-5 badge-compiler" />
                                ) : (
                                  <Circle className="w-5 h-5 text-surface-400 hover:text-brand-700 transition-colors" />
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedTopicId(topic.topicId)}
                                className="flex-1 min-w-0 text-left focus:outline-none"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="font-mono text-[11px] text-surface-400 tabular-nums shrink-0">
                                      {String(globalIdx + 1).padStart(2, '0')}.
                                    </span>
                                    <span
                                      className={`text-sm font-semibold truncate ${
                                        isDone ? 'line-through text-surface-400' : 'text-surface-100'
                                      }`}
                                    >
                                      {topic.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {linkedCount > 0 && (
                                      <span className="px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-700 border border-brand-500/20 font-mono text-[10px] font-medium">
                                        {linkedCount} {linkedCount === 1 ? 'Doc' : 'Docs'}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-surface-400">
                                      <Clock className="w-3 h-3" />
                                      {topic.estimatedHours || 2}h
                                    </span>
                                    <ChevronRight
                                      className={`w-4 h-4 transition-colors ${
                                        isInspected ? 'text-brand-700' : 'text-surface-400'
                                      }`}
                                    />
                                  </div>
                                </div>

                                {topic.description && (
                                  <p className="text-xs text-surface-400 mt-1 line-clamp-1">
                                    {topic.description}
                                  </p>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {orderedTopics.filter(matchesTopicFilter).length === 0 && (
                  <EmptyState
                    icon={CheckCircle2}
                    title={`No ${topicStatusFilter} topics`}
                    description="Adjust the status filter above to view all topics in this subject."
                    actionLabel="Show All Topics"
                    onAction={() => setTopicStatusFilter('all')}
                  />
                )}
              </div>

              {/* Sticky Topic Detail & Linked Resources Inspector */}
              <div className="xl:col-span-5 xl:sticky xl:top-20">
                {selectedTopic && (
                  <Card className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                          Topic {String(selectedTopicIndex + 1).padStart(2, '0')} Details
                        </span>
                        <h3 className="font-display text-lg font-bold text-surface-100 leading-snug">
                          {selectedTopic.title}
                        </h3>
                      </div>
                      <Badge variant={isSelectedTopicDone ? 'compiler' : 'surface'}>
                        {isSelectedTopicDone ? 'Completed' : 'Pending'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-surface-400 py-2 border-y border-surface-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-700" />
                        Estimated Study: {selectedTopic.estimatedHours || 2} hours
                      </span>
                      <span>·</span>
                      <span>
                        Order #{selectedTopic.order || selectedTopicIndex + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                        Syllabus Scope
                      </div>
                      <p className="text-sm text-surface-200 leading-relaxed">
                        {selectedTopic.description ||
                          'Review foundational definitions, problem formulations, and past examination questions for this syllabus unit.'}
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant={isSelectedTopicDone ? 'secondary' : 'primary'}
                      size="md"
                      className="w-full"
                      leftIcon={isSelectedTopicDone ? CheckCircle2 : Circle}
                      isLoading={isToggling && togglingTopicId === selectedTopic.topicId}
                      onClick={() => onToggleTopic(selectedTopic.topicId)}
                    >
                      {isSelectedTopicDone ? 'Completed (Click to Undo)' : 'Mark Topic Complete'}
                    </Button>

                    {/* Resources directly linked to this Topic */}
                    <div className="pt-3 border-t border-surface-700 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                          Topic Study Materials ({selectedTopicResources.length})
                        </span>
                        {subjectResources.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onTabChange('resources')}
                            className="text-xs font-medium text-brand-700 hover:underline"
                          >
                            View all ({subjectResources.length})
                          </button>
                        )}
                      </div>

                      {selectedTopicResources.length === 0 ? (
                        <p className="text-xs text-surface-400 py-3 px-3 rounded-lg bg-elevated/55 border border-surface-700">
                          No resources linked directly to this topic yet. Check the Study Resources tab for course-wide materials.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedTopicResources.map((res) => {
                            const cfg = RESOURCE_BADGE_MAP[res.type] || {
                              label: (res.type || 'DOC').toUpperCase(),
                              variant: 'brand',
                            };
                            return (
                              <div
                                key={res._id}
                                className="p-3 rounded-xl border border-surface-700 bg-elevated/55 flex items-center justify-between gap-2.5"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                    {res.year && (
                                      <span className="font-mono text-[10px] text-surface-400">
                                        {res.year}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-semibold text-surface-100 truncate">
                                    {res.title}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => onPreviewResource(res)}
                                    title="Quick View Document"
                                    aria-label={`Preview ${res.title}`}
                                    className="p-1.5 rounded-lg text-surface-400 hover:text-brand-700 hover:bg-card transition-colors"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  {res.contentUrl && (
                                    <a
                                      href={res.contentUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      title="Open in new window"
                                      aria-label={`Open ${res.title} link`}
                                      className="p-1.5 rounded-lg text-surface-400 hover:text-brand-700 hover:bg-card transition-colors"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Study Resources, Lecture Notes & PYQs */}
        <TabsContent value="resources" className="mt-4 space-y-4">
          {/* Resource Type Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {RESOURCE_FILTERS.map((cat) => {
              const count = resourceCountsByType[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setResourceFilter(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border inline-flex items-center gap-1.5 ${
                    resourceFilter === cat.id
                      ? 'bg-brand-500 border-brand-500 text-white'
                      : 'bg-card border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full ${
                      resourceFilter === cat.id
                        ? 'bg-white/20 text-white'
                        : 'bg-elevated text-surface-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {isResourcesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredResources.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                resourceFilter === 'all'
                  ? 'No resources uploaded yet'
                  : `No ${resourceFilter.toUpperCase()} resources found`
              }
              description={
                resourceFilter === 'all'
                  ? 'No verified lecture notes, syllabi, or PYQs have been published for this subject yet.'
                  : 'Select All Resources above to browse other study material categories.'
              }
              actionLabel={resourceFilter !== 'all' ? 'Show All Resources' : undefined}
              onAction={resourceFilter !== 'all' ? () => setResourceFilter('all') : undefined}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => {
                const badgeConfig = RESOURCE_BADGE_MAP[res.type] || {
                  label: (res.type || 'DOC').toUpperCase(),
                  variant: 'brand',
                };
                const linkedTopic = res.topicId
                  ? orderedTopics.find((t) => t.topicId === res.topicId)
                  : null;

                return (
                  <Card key={res._id} className="p-4 sm:p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2.5 rounded-lg bg-brand-500/10 text-brand-700 border border-brand-500/20 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-display text-sm font-semibold text-surface-100 leading-snug">
                              {res.title}
                            </h3>
                            <p className="text-xs text-surface-400 mt-1 line-clamp-2 leading-relaxed">
                              {res.textContent || 'Verified university syllabus resource.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant={badgeConfig.variant}>{badgeConfig.label}</Badge>
                        {res.year && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-surface-400">
                            <Calendar className="w-3 h-3" />
                            Year {res.year}
                          </span>
                        )}
                        {res.author && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-surface-400">
                            <User className="w-3 h-3" />
                            {res.author}
                          </span>
                        )}
                        {linkedTopic && (
                          <span className="px-2 py-0.5 rounded-md bg-elevated border border-surface-700 text-[11px] text-surface-300 truncate max-w-[200px]">
                            {linkedTopic.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-surface-700 flex items-center justify-between gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={Eye}
                        onClick={() => onPreviewResource(res)}
                      >
                        Quick View
                      </Button>

                      {res.contentUrl && (
                        <a
                          href={res.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:underline px-2 py-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open Link
                        </a>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SubjectDetailWorkspace;

