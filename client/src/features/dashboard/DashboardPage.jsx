import { useState, useRef } from 'react';
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
  Compass,
  AlertCircle,
} from 'lucide-react';
import { dashboardService } from '../../services/dashboard.service.js';
import profileService from '../../services/profile.service.js';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Heatmap } from '../../components/Heatmap.jsx';
import { CardSkeleton, StatSkeleton } from '../../components/Skeleton.jsx';
import { useToast } from '../../components/Toast.jsx';
import ProfileCard from '../profile/components/ProfileCard.jsx';
import CardExportModal from '../profile/components/CardExportModal.jsx';

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

  const user = summaryData?.user || profile?.identity;
  const stats = summaryData?.stats || profile?.stats;
  const tasks = todayData?.tasks || [];
  const completedCount = todayData?.completed || 0;
  const totalTasks = todayData?.total || tasks.length;
  const progressPercent = todayData?.percent || 0;

  const username = profile?.identity?.username || user?.username || 'user';

  const getModuleBadgeColor = (module) => {
    switch (module) {
      case 'coding':
        return 'emerald';
      case 'gate':
        return 'cyan';
      case 'academics':
        return 'brand';
      case 'interviews':
        return 'purple';
      default:
        return 'surface';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* 1. Hero Section: EngineerOS Profile Card Showcase */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                Operating System Dashboard
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
              Welcome back, {user?.name?.split(' ')[0] || 'Engineer'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/profile">
              <Button size="sm" variant="secondary" leftIcon={SlidersHorizontal}>
                Customize Card
              </Button>
            </Link>
            <Button
              size="sm"
              variant="primary"
              leftIcon={Share2}
              onClick={() => setIsExportOpen(true)}
            >
              Share Card
            </Button>
            {username && (
              <a
                href={`/u/${username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-surface-800 hover:bg-surface-700 text-surface-200 transition-colors border border-surface-700/80"
              >
                <span>/u/{username}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Hero Card Container */}
        <div className="w-full flex justify-center pt-1">
          {isProfileLoading ? (
            <CardSkeleton />
          ) : (
            <ProfileCard
              ref={cardRef}
              profile={profile}
              compact={false}
              className="max-w-3xl shadow-xl"
            />
          )}
        </div>
      </section>

      {/* 2. "What Should I Do Today?" Action Panel */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                What Should I Do Today?
              </h2>
              <p className="text-xs text-surface-400">
                Prioritized daily plan matching your curriculum, weak spots & active streak
              </p>
            </div>
          </div>

          {/* Daily Progress Tracker */}
          <div className="flex items-center gap-3 bg-surface-900/60 border border-surface-800 rounded-xl px-3.5 py-2">
            <div className="text-xs font-mono text-surface-300">
              <span className="text-emerald-400 font-bold">{completedCount}</span> / {totalTasks} Completed
            </div>
            <div className="w-24 h-2 rounded-full bg-surface-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-surface-400">{progressPercent}%</span>
          </div>
        </div>

        {/* Tasks List */}
        {isTodayLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <StatSkeleton key={i} />
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="p-6 text-center text-surface-400 text-sm">
            All tasks completed or none scheduled for today. Great job!
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isSnoozed = task.status === 'snoozed';

              return (
                <div
                  key={task._id || task.taskId}
                  className={`flex flex-col justify-between p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-surface-900/30 border-surface-800/50 opacity-60'
                      : isSnoozed
                      ? 'bg-surface-950/40 border-surface-800/50 opacity-70'
                      : 'bg-surface-900/70 border-surface-800 hover:border-surface-700 shadow-md'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={getModuleBadgeColor(task.module)}
                          size="sm"
                          className="capitalize font-mono text-[10px]"
                        >
                          {task.module}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-surface-400">
                          <Clock className="w-3 h-3" />
                          {task.estimatedMinutes}m
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleSnooze(task)}
                            title="Snooze for 4 hours"
                            className="p-1 text-surface-500 hover:text-surface-300 rounded-lg hover:bg-surface-800 transition-colors"
                          >
                            <Moon className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(task)}
                          className="p-1 text-surface-400 hover:text-emerald-400 transition-colors"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <h3
                      className={`text-sm font-semibold text-white leading-snug ${
                        isCompleted ? 'line-through text-surface-400' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between gap-2">
                    <Link to={task.actionUrl} className="flex-1">
                      <Button
                        size="sm"
                        variant={isCompleted ? 'ghost' : 'secondary'}
                        className="w-full justify-between text-xs"
                        rightIcon={ArrowRight}
                      >
                        {isCompleted ? 'Review' : 'Start Task'}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Consistency Stream (12-Month Heatmap) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Annual Consistency Stream
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-surface-400">
              Active Streak:{' '}
              <strong className="text-amber-400">{stats?.overallStreak || stats?.coding?.streak || 0}d</strong>
            </span>
          </div>
        </div>

        <Card className="border-surface-800 bg-surface-900/40 p-4 sm:p-5">
          {isHeatmapLoading ? (
            <div className="h-32 w-full animate-pulse bg-surface-800/40 rounded-xl" />
          ) : (
            <Heatmap
              data={heatmapData || []}
              weeks={52}
              currentStreak={stats?.overallStreak || stats?.coding?.streak || 0}
              longestStreak={profile?.stats?.streaks?.longest || 0}
            />
          )}
        </Card>
      </section>

      {/* 4. Module Telemetry Strip: 6 Focused Workspaces */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Academic & Skill Workspaces
          </h2>
          <span className="text-xs text-surface-400">
            Dedicated execution environments for each engineering pillar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tile 1: Coding & DSA */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 font-mono">
                  Coding & DSA
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">
                  {stats?.coding?.solvedCount || 0} Solved
                </div>
                <div className="text-xs text-surface-400 mt-1 flex items-center gap-1.5">
                  <span className="text-emerald-400">{stats?.coding?.easyCount || 0}E</span>
                  <span>/</span>
                  <span className="text-amber-400">{stats?.coding?.mediumCount || 0}M</span>
                  <span>/</span>
                  <span className="text-rose-400">{stats?.coding?.hardCount || 0}H</span>
                  <span>•</span>
                  <span>{stats?.coding?.accuracyRate || 0}% Accuracy</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/coding">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Open Monaco Sandbox
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tile 2: GATE Examination */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                  GATE Preparation
                </span>
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">
                  {stats?.gate?.averageScore ? `${stats.gate.averageScore}/100` : `${stats?.gate?.testsAttempted || 0} Mocks`}
                </div>
                <div className="text-xs text-surface-400 mt-1 truncate">
                  {stats?.gate?.weakTopics?.length > 0 ? (
                    <span className="text-amber-400">Weak Area: {stats.gate.weakTopics[0]}</span>
                  ) : (
                    'Diagnostic & Full Mock Tests'
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/gate">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Take GATE Mock
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tile 3: Academics & Syllabus */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-400 font-mono">
                  Curriculum Hub
                </span>
                <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <BookOpen className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">
                  {stats?.academics?.percentComplete || 0}% Complete
                </div>
                <div className="text-xs text-surface-400 mt-1">
                  {stats?.academics?.completedTopics || 0} of {stats?.academics?.totalTopics || 0} Topics Mastered
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/academics">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Browse Curriculum
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tile 4: AI Learning Copilot */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-mono">
                  AI Assistant
                </span>
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-white">
                  Contextual AI Copilot
                </div>
                <div className="text-xs text-surface-400 mt-1">
                  Instant step-by-step breakdown & code debugging
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/ai-assistant">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Open AI Chat
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tile 5: AI Mock Interviews */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono">
                  Mock Interviews
                </span>
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-white">
                  {stats?.interviews?.averageReadinessScore || 75}/100
                </div>
                <div className="text-xs text-surface-400 mt-1">
                  {stats?.interviews?.sessionsCompleted || 0} Sessions Evaluated
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/interviews">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Start Interview Session
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tile 6: Senior Mentorship & Community */}
          <Card hover className="p-5 flex flex-col justify-between border-surface-800 bg-surface-900/40">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 font-mono">
                  Senior Network
                </span>
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-xl font-bold text-white">
                  Ask a Senior
                </div>
                <div className="text-xs text-surface-400 mt-1">
                  Peer discussions, career guidance & alumni advice
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-800">
              <Link to="/community">
                <Button size="sm" variant="secondary" className="w-full justify-between" rightIcon={ArrowRight}>
                  Enter Community
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* 5. Diagnostic Callout / Focus Recommendation */}
      {stats?.gate?.weakTopics?.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1 text-xs">
            <strong>Targeted Diagnostic Notice:</strong> Your lowest accuracy topic is{' '}
            <span className="underline font-semibold">{stats.gate.weakTopics[0]}</span>. Revising this topic today can boost your mock percentile by up to 12%.
          </div>
          <Link to={`/gate?topic=${encodeURIComponent(stats.gate.weakTopics[0])}`}>
            <Button size="sm" variant="secondary">
              Review Topic
            </Button>
          </Link>
        </div>
      )}

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
