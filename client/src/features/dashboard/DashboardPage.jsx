import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Code2,
  BookOpen,
  Sparkles,
  Flame,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  Moon,
  ExternalLink,
  SlidersHorizontal,
  Share2,
  Video,
  Users,
  AlertCircle,
  GraduationCap,
  Terminal,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { dashboardService } from '../../services/dashboard.service.js';
import profileService from '../../services/profile.service.js';
import {
  Button,
  Badge,
  Card,
  Heatmap,
  ProgressRing,
  ProgressBar,
  ChartContainer,
  ChartTooltip,
  CHART_PALETTE,
  CardSkeleton,
  StatSkeleton,
  Skeleton,
  useToast,
} from '../../components/index.js';
import ProfileCard from '../profile/components/ProfileCard.jsx';
import CardExportModal from '../profile/components/CardExportModal.jsx';

/**
 * Primary Engineering Command Center landing view aggregating progress telemetry,
 * daily execution queue, consistency heatmap, workspaces, and study recommendations.
 */
export const DashboardPage = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const cardRef = useRef(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // 1. Fetch Owner Profile for Hero Card
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['owner-profile'],
    queryFn: () => profileService.getOwnerProfile(),
  });

  // 2. Fetch Dashboard Summary (Stats & Aggregations)
  const { data: summaryData } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  // 3. Fetch "What Should I Do Today?" Tasks
  const { data: todayData, isLoading: isTodayLoading } = useQuery({
    queryKey: ['dashboard-today'],
    queryFn: () => dashboardService.getTodayTasks(),
  });

  // 4. Fetch 12-Month Heatmap Telemetry
  const { data: heatmapData, isLoading: isHeatmapLoading } = useQuery({
    queryKey: ['dashboard-heatmap'],
    queryFn: () => dashboardService.getHeatmap(12),
  });

  // Task Status Mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => dashboardService.updateTask(taskId, status),
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-heatmap'] });
      queryClient.invalidateQueries({ queryKey: ['owner-profile'] });

      if (updatedTask.status === 'completed') {
        showToast('Task marked complete! Activity recorded.', 'success');
      } else if (updatedTask.status === 'snoozed') {
        showToast('Task snoozed for 4 hours', 'info');
      }
    },
    onError: () => {
      showToast('Failed to update task status', 'error');
    },
  });

  const handleToggleComplete = (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    updateTaskMutation.mutate({ taskId: task._id || task.taskId, status: nextStatus });
  };

  const handleSnooze = (task) => {
    updateTaskMutation.mutate({ taskId: task._id || task.taskId, status: 'snoozed' });
  };

  const resolvedProfile = profile?.profile || profile;
  const user = summaryData?.user || resolvedProfile?.identity;
  const stats = summaryData?.stats || resolvedProfile?.stats;
  const tasks = todayData?.tasks || [];
  const completedCount = todayData?.completed || 0;
  const totalTasks = todayData?.total || tasks.length;
  const progressPercent = todayData?.percent || 0;

  const username = resolvedProfile?.identity?.username || user?.username || 'user';
  const university = resolvedProfile?.identity?.university || user?.university;
  const semester = resolvedProfile?.identity?.semester || user?.semester;
  const branch = resolvedProfile?.identity?.branch || user?.branch;

  const activeStreak = stats?.overallStreak || stats?.coding?.streak || resolvedProfile?.stats?.streaks?.currentStreak || 0;
  const longestStreak = resolvedProfile?.stats?.streaks?.longestStreak ?? resolvedProfile?.stats?.streaks?.longest ?? 0;

  // Merge live summaryData.stats into the profile passed to ProfileCard for real-time updates
  const liveCardProfile = useMemo(() => {
    if (!resolvedProfile) return null;
    if (!summaryData?.stats) return profile;
    const s = summaryData.stats;
    return {
      ...(resolvedProfile),
      profileSettings: resolvedProfile.profileSettings || profile?.settings,
      shareToken: profile?.shareToken || resolvedProfile.shareToken,
      stats: {
        ...resolvedProfile.stats,
        coding: {
          ...resolvedProfile.stats?.coding,
          solvedCount: s.coding?.solvedCount ?? resolvedProfile.stats?.coding?.solvedCount ?? 0,
          easyCount: s.coding?.easyCount ?? resolvedProfile.stats?.coding?.easyCount ?? 0,
          mediumCount: s.coding?.mediumCount ?? resolvedProfile.stats?.coding?.mediumCount ?? 0,
          hardCount: s.coding?.hardCount ?? resolvedProfile.stats?.coding?.hardCount ?? 0,
          accuracy: s.coding?.accuracyRate ?? resolvedProfile.stats?.coding?.accuracy ?? 0,
        },
        gate: {
          ...resolvedProfile.stats?.gate,
          testsTaken: s.gate?.testsAttempted ?? resolvedProfile.stats?.gate?.testsTaken ?? 0,
          averageScore: s.gate?.averageScore ?? resolvedProfile.stats?.gate?.averageScore ?? 0,
          accuracy: s.gate?.accuracyRate ?? resolvedProfile.stats?.gate?.accuracy ?? 0,
        },
        academics: {
          ...resolvedProfile.stats?.academics,
          completionPercentage:
            s.academics?.percentComplete ?? resolvedProfile.stats?.academics?.completionPercentage ?? 0,
          activeSubjectsCount:
            s.academics?.subjectsInProgress ?? resolvedProfile.stats?.academics?.activeSubjectsCount ?? 0,
        },
        interviews: {
          ...resolvedProfile.stats?.interviews,
          completedCount:
            s.interviews?.sessionsCompleted ?? resolvedProfile.stats?.interviews?.completedCount ?? 0,
          averageReadiness:
            s.interviews?.averageReadinessScore ?? resolvedProfile.stats?.interviews?.averageReadiness ?? 0,
        },
        streaks: {
          ...resolvedProfile.stats?.streaks,
          currentStreak:
            s.overallStreak ?? resolvedProfile.stats?.streaks?.currentStreak ?? resolvedProfile.stats?.streaks?.current ?? 0,
          longestStreak,
        },
      },
    };
  }, [profile, resolvedProfile, summaryData, longestStreak]);
  const codingSolved = stats?.coding?.solvedCount || 0;
  const codingEasy = stats?.coding?.easyCount || 0;
  const codingMedium = stats?.coding?.mediumCount || 0;
  const codingHard = stats?.coding?.hardCount || 0;
  const codingDenominator = Math.max(codingSolved, codingEasy + codingMedium + codingHard, 1);
  const weakTopics = stats?.gate?.weakTopics || [];

  const recentActivitySeries = useMemo(() => {
    const map = new Map();
    if (Array.isArray(heatmapData)) {
      heatmapData.forEach((item) => {
        if (item?.date) {
          map.set(item.date.slice(0, 10), item.count || item.total || 0);
        }
      });
    }
    const days = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      days.push({
        label: iso.slice(5),
        activities: map.get(iso) || 0,
      });
    }
    return days;
  }, [heatmapData]);

  const getModuleBadgeColor = (module) => {
    switch (module) {
      case 'coding':
        return 'compiler';
      case 'gate':
        return 'brand';
      case 'academics':
        return 'surface';
      case 'interviews':
        return 'outline';
      default:
        return 'surface';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* ═══════════════════════════════════════════════════════════════════════
          A. UNIFIED COMMAND CENTER HERO SECTION (Welcome + Focus | Authentic Card)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Engineering command center hero"
        className="rounded-2xl border border-surface-700 bg-card shadow-[var(--shadow-card)]"
      >
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)] gap-6 xl:gap-7 p-5 sm:p-6 xl:p-7 items-stretch">
          {/* LEFT COLUMN (~55% desktop): Welcome Header + Today's Focus */}
          <div className="flex flex-col space-y-5 min-w-0 pb-6 xl:pb-0 xl:pr-7 border-b xl:border-b-0 xl:border-r border-surface-700/75">
            {/* Welcome & Identity Header */}
            <header className="space-y-2.5">
              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-surface-400">
                <span className="w-2 h-2 rounded-full bg-compiler-500 animate-pulse" aria-hidden="true" />
                <span>~/command-center</span>
                <span className="text-surface-600">·</span>
                <span className="text-brand-700 font-semibold">{activeStreak}d active streak</span>
              </div>

              <div className="space-y-1.5">
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-surface-100 tracking-tight leading-tight">
                  Welcome back, {user?.name?.split(' ')[0] || 'Engineer'}
                </h1>
                <p className="text-sm text-surface-400 leading-relaxed">
                  Track coding telemetry, curriculum completion, GATE mocks &amp; interview readiness.
                </p>
              </div>

              {(university || semester || branch) && (
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-surface-400 pt-0.5">
                  {university && (
                    <span className="inline-flex items-center gap-1.5 text-surface-200 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                      <span>{university}</span>
                    </span>
                  )}
                  {semester && (
                    <span className="font-mono px-2 py-0.5 rounded-md bg-elevated border border-surface-700 text-surface-200">
                      Sem {semester}
                    </span>
                  )}
                  {branch && <span className="truncate max-w-xs sm:max-w-md">{branch}</span>}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={Share2}
                  onClick={() => setIsExportOpen(true)}
                >
                  Share Card
                </Button>
                <Link to="/profile">
                  <Button size="sm" variant="secondary" leftIcon={SlidersHorizontal}>
                    Customize Card
                  </Button>
                </Link>
                <Link to="/coding">
                  <Button size="sm" variant="ghost" leftIcon={Terminal}>
                    Solve DSA
                  </Button>
                </Link>
                {username && (
                  <a
                    href={`/u/${username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-medium bg-elevated/70 hover:bg-elevated text-surface-200 hover:text-surface-100 transition-colors border border-surface-700 hover:border-surface-600"
                  >
                    <span>/u/{username}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-surface-400" />
                  </a>
                )}
              </div>
            </header>

            {/* Today's Focus — Seamless Continuous Execution List */}
            <div className="border-t border-surface-700/75 pt-5 space-y-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand-500 shrink-0" aria-hidden="true" />
                    <h2 className="font-display text-base sm:text-lg font-semibold text-surface-100 tracking-tight">
                      Today&apos;s Focus
                    </h2>
                  </div>
                  <p className="text-xs text-surface-400 mt-0.5">
                    Prioritized tasks tailored to your curriculum, weak spots &amp; streak
                  </p>
                </div>

                <div className="flex items-center gap-1.5 font-mono tabular-nums text-xs text-surface-400 shrink-0 pt-0.5">
                  <strong className="text-surface-100 font-semibold">
                    {completedCount}/{totalTasks}
                  </strong>
                  <span>·</span>
                  <span>{progressPercent}%</span>
                </div>
              </div>

              <ProgressBar
                value={progressPercent}
                variant={progressPercent >= 100 ? 'compiler' : 'brand'}
                size="sm"
              />

              {isTodayLoading ? (
                <div className="space-y-2.5 pt-1">
                  {[1, 2, 3].map((i) => (
                    <StatSkeleton key={i} />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-xl border border-surface-700/70 bg-elevated/35 px-4 py-5 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 badge-compiler shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-surface-100">You&apos;re all caught up</p>
                    <p className="text-xs text-surface-400">
                      All tasks completed or none scheduled for today.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-surface-700/70 border-t border-b border-surface-700/70">
                  {tasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    const isSnoozed = task.status === 'snoozed';

                    return (
                      <li
                        key={task._id || task.taskId}
                        className={`group flex items-center justify-between gap-3 py-3 px-2 transition-colors duration-150 ${
                          isCompleted
                            ? 'opacity-70 hover:bg-elevated/30'
                            : isSnoozed
                            ? 'opacity-80 hover:bg-elevated/35'
                            : 'hover:bg-elevated/45'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => handleToggleComplete(task)}
                            aria-label={
                              isCompleted ? `Mark ${task.title} incomplete` : `Complete ${task.title}`
                            }
                            className="p-1 -m-1 mt-0 text-surface-400 hover:badge-compiler transition-colors shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-[18px] h-[18px] badge-compiler fill-compiler-500/15" />
                            ) : (
                              <Circle className="w-[18px] h-[18px]" />
                            )}
                          </button>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h3
                              className={`text-sm font-medium leading-snug ${
                                isCompleted ? 'line-through text-surface-400' : 'text-surface-100'
                              }`}
                            >
                              {task.title}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <Badge
                                variant={getModuleBadgeColor(task.module)}
                                size="sm"
                                className="capitalize"
                              >
                                {task.module}
                              </Badge>
                              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-surface-400 tabular-nums">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {task.estimatedMinutes}m
                              </span>
                              {isSnoozed && (
                                <span className="text-[11px] font-mono text-surface-400">
                                  · Snoozed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isCompleted && (
                            <button
                              type="button"
                              onClick={() => handleSnooze(task)}
                              title="Snooze for 4 hours"
                              aria-label={`Snooze ${task.title}`}
                              className="p-2 text-surface-400 hover:text-surface-100 rounded-lg hover:bg-elevated transition-colors"
                            >
                              <Moon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <Link to={task.actionUrl} className="shrink-0">
                            <Button
                              size="sm"
                              variant={isCompleted ? 'ghost' : 'secondary'}
                              rightIcon={ArrowRight}
                              className="min-w-[82px] justify-between"
                            >
                              {isCompleted ? 'Review' : 'Start'}
                            </Button>
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (~41–45% desktop): Portrait EngineerOS Authentic Card matching Left Column height */}
          <div className="hero-profile-card-slot w-full min-w-0 flex items-stretch justify-center xl:justify-end">
            {isProfileLoading ? (
              <CardSkeleton lines={5} className="w-full max-w-md xl:max-w-none h-full" />
            ) : (
              <ProfileCard
                ref={cardRef}
                profile={liveCardProfile}
                orientation="portrait"
                compact={false}
                className="w-full xl:max-w-none"
              />
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          D & F. CONSISTENCY STREAM, ACTIVITY HISTORY & RECOMMENDATIONS
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <h2 className="font-display text-xl font-semibold text-surface-100 tracking-tight">
                Annual Consistency Stream
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-surface-400">
              Active Streak:{' '}
              <strong className="text-brand-700 font-bold">{activeStreak}d</strong>
            </span>
            <span className="text-surface-600">·</span>
            <span className="text-surface-400">
              Best:{' '}
              <strong className="badge-compiler font-bold">{longestStreak}d</strong>
            </span>
          </div>
        </div>

        <Card className="hm-card p-4 sm:p-5">
          {isHeatmapLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <Heatmap
              data={heatmapData || []}
              weeks={52}
              currentStreak={activeStreak}
              longestStreak={longestStreak}
            />
          )}
        </Card>

        {/* Activity Pulse Chart + Personalized Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-7 min-w-0">
            <ChartContainer
              title="14-Day Activity History"
              description="Recent logged contributions feeding your engineering streak"
              height={176}
              actions={
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-700 border border-brand-500/20">
                  Last 14 Days
                </span>
              }
            >
              <BarChart data={recentActivitySeries} margin={{ top: 6, right: 6, left: -24, bottom: 0 }}>
                <CartesianGrid stroke={CHART_PALETTE.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: CHART_PALETTE.axis, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <RechartsTooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(239, 107, 34, 0.08)' }} />
                <Bar
                  dataKey="activities"
                  name="Contributions"
                  fill={CHART_PALETTE.brand}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="lg:col-span-5 rounded-xl border border-surface-700 bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4 min-w-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand-500 shrink-0" />
                  <h3 className="font-display text-base font-semibold text-surface-100">
                    Personalized Recommendations
                  </h3>
                </div>
                <Badge variant={weakTopics.length > 0 ? 'brand' : 'compiler'} size="sm">
                  {weakTopics.length > 0 ? 'Action Needed' : 'On Track'}
                </Badge>
              </div>

              {weakTopics.length > 0 ? (
                <div className="rounded-lg border border-brand-500/25 bg-brand-500/8 p-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-brand-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-surface-200 leading-relaxed min-w-0">
                      <strong className="text-surface-100">Targeted Diagnostic Notice:</strong> Your lowest accuracy topic is{' '}
                      <span className="font-semibold underline text-brand-700">{weakTopics[0]}</span>. Revising this topic today can boost your mock percentile by up to 12%.
                    </div>
                  </div>
                  {weakTopics.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 pl-6">
                      {weakTopics.slice(1, 3).map((topic) => (
                        <Badge key={topic} variant="outline" size="sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pl-6 pt-0.5">
                    <Link to={`/gate?topic=${encodeURIComponent(weakTopics[0])}`}>
                      <Button size="sm" variant="primary" rightIcon={ArrowRight}>
                        Review Topic
                      </Button>
                    </Link>
                    <Link to="/ai-assistant">
                      <Button size="sm" variant="secondary">
                        Ask AI Tutor
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-compiler-500/25 bg-compiler-500/8 p-3.5 text-xs text-surface-200 leading-relaxed">
                  No critical GATE weak spots flagged right now. Keep alternating timed DSA sets with syllabus revision to extend your{' '}
                  <strong className="font-mono badge-compiler">{activeStreak}d</strong> streak.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-surface-700 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-surface-400">
                Syllabus mastery:{' '}
                <strong className="font-mono text-surface-100">
                  {stats?.academics?.percentComplete || 0}%
                </strong>
              </span>
              <Link
                to="/academics"
                className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline"
              >
                <span>Open weak-area study plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════
          E. ACADEMIC & SKILL WORKSPACES (Differentiated Composition)
          ═══════════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1">
          <div>
            <h2 className="font-display text-xl font-semibold text-surface-100 tracking-tight">
              Academic & Skill Workspaces
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              Dedicated execution environments across algorithms, exams, curriculum & mentorship
            </p>
          </div>
        </div>

        {/* Tier 1: Primary Technical Pillars (Asymmetric 7 + 5 Bento) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Featured Pillar: Coding & DSA */}
          <div className="lg:col-span-7 rounded-xl border border-surface-700 bg-card p-6 shadow-[var(--shadow-card)] flex flex-col justify-between gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-compiler-500/10 badge-compiler border border-compiler-500/25">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider badge-compiler">
                    Coding & DSA
                  </span>
                  <h3 className="font-display text-lg font-semibold text-surface-100">
                    Algorithms & Problem Solving
                  </h3>
                </div>
              </div>
              <Badge variant="compiler" size="md">
                {stats?.coding?.accuracyRate || 0}% Accuracy
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5">
                <div className="font-mono tabular-nums text-4xl font-bold text-surface-100 tracking-tight">
                  {codingSolved}
                </div>
                <p className="text-xs text-surface-400 mt-1">
                  Problems verified in Judge0 sandbox
                </p>
              </div>
              <div className="sm:col-span-7 space-y-2.5">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="badge-compiler font-medium">Easy ({codingEasy}E)</span>
                    <span className="text-surface-400">{Math.round((codingEasy / codingDenominator) * 100)}%</span>
                  </div>
                  <ProgressBar value={(codingEasy / codingDenominator) * 100} variant="compiler" size="sm" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-brand-700 font-medium">Medium ({codingMedium}M)</span>
                    <span className="text-surface-400">{Math.round((codingMedium / codingDenominator) * 100)}%</span>
                  </div>
                  <ProgressBar value={(codingMedium / codingDenominator) * 100} variant="brand" size="sm" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-surface-200 font-medium">Hard ({codingHard}H)</span>
                    <span className="text-surface-400">{Math.round((codingHard / codingDenominator) * 100)}%</span>
                  </div>
                  <ProgressBar value={(codingHard / codingDenominator) * 100} variant="signal" size="sm" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-surface-700 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-xs text-surface-400">
                C++ · Python · Java · JavaScript
              </span>
              <Link to="/coding">
                <Button size="sm" variant="secondary" rightIcon={ArrowRight}>
                  Open Monaco Sandbox
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: GATE Preparation & Curriculum Hub */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* GATE Preparation */}
            <div className="flex-1 rounded-xl border border-surface-700 bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    GATE Preparation
                  </span>
                  <div className="font-mono tabular-nums text-2xl font-bold text-surface-100">
                    {stats?.gate?.averageScore ? `${stats.gate.averageScore}` : `${stats?.gate?.testsAttempted || 0}`}
                    <span className="text-sm font-normal text-surface-400 ml-1">
                      {stats?.gate?.averageScore ? '/100 Avg Score' : ' Mocks Attempted'}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 truncate">
                    {weakTopics.length > 0
                      ? `Weak Area: ${weakTopics[0]}`
                      : 'Diagnostic & Full-Length CBT Mocks'}
                  </p>
                </div>
                <ProgressRing
                  progress={Math.min(Math.round(stats?.gate?.averageScore || 0), 100)}
                  size={60}
                  strokeWidth={5}
                  variant="brand"
                />
              </div>

              <div className="pt-3 border-t border-surface-700 flex justify-end">
                <Link to="/gate" className="w-full">
                  <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                    Take GATE Mock
                  </Button>
                </Link>
              </div>
            </div>

            {/* Curriculum Hub */}
            <div className="flex-1 rounded-xl border border-surface-700 bg-card p-5 shadow-[var(--shadow-card)] flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider badge-compiler">
                    Curriculum Hub
                  </span>
                  <BookOpen className="w-4 h-4 badge-compiler shrink-0" />
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-mono tabular-nums text-2xl font-bold text-surface-100">
                    {stats?.academics?.percentComplete || 0}% Complete
                  </span>
                  <span className="text-xs font-mono text-surface-400">
                    {stats?.academics?.completedTopics || 0}/{stats?.academics?.totalTopics || 0} Topics
                  </span>
                </div>
                <ProgressBar
                  value={stats?.academics?.percentComplete || 0}
                  variant="compiler"
                  size="md"
                />
              </div>

              <div className="pt-3 border-t border-surface-700">
                <Link to="/academics" className="w-full">
                  <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                    Browse Curriculum
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tier 2: Interactive Studios & Community Rail */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mock Interviews */}
          <Card variant="default" className="p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                  Mock Interviews
                </span>
                <div className="font-mono tabular-nums text-2xl font-bold text-surface-100">
                  {stats?.interviews?.averageReadinessScore || 75}
                  <span className="text-sm font-normal text-surface-400">/100</span>
                </div>
                <p className="text-xs text-surface-400">
                  {stats?.interviews?.sessionsCompleted || 0} Sessions Evaluated
                </p>
              </div>
              <div className="p-2 rounded-lg bg-brand-500/10 text-brand-700 border border-brand-500/20 shrink-0">
                <Video className="w-4 h-4" />
              </div>
            </div>
            <Link to="/interviews">
              <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                Start Interview Session
              </Button>
            </Link>
          </Card>

          {/* AI Assistant */}
          <Card variant="default" className="p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                  AI Assistant
                </span>
                <h3 className="font-display text-lg font-semibold text-surface-100">
                  Contextual AI
                </h3>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Instant syllabus breakdown, citations & code debugging
                </p>
              </div>
              <div className="p-2 rounded-lg bg-elevated text-brand-500 border border-surface-700 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <Link to="/ai-assistant">
              <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                Open AI Chat
              </Button>
            </Link>
          </Card>

          {/* Senior Network */}
          <Card variant="default" className="p-4 sm:p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider badge-compiler">
                  Senior Network
                </span>
                <h3 className="font-display text-lg font-semibold text-surface-100">
                  Ask a Senior
                </h3>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Peer discussions, career guidance & alumni advice
                </p>
              </div>
              <div className="p-2 rounded-lg bg-compiler-500/10 badge-compiler border border-compiler-500/25 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <Link to="/community">
              <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                Enter Community
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Card Export Modal */}
      <CardExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        cardElementRef={cardRef}
        profile={profile}
      />
    </div>
  );
};

export default DashboardPage;
