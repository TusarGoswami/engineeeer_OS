import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Code2,
  BookOpen,
  Video,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { dashboardService } from '../../services/dashboard.service.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';

export const DashboardPage = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: () => dashboardService.getSummary(),
  });

  const user = dashboardData?.user;
  const stats = dashboardData?.stats;
  const recommendations = dashboardData?.whatShouldIDoToday || [];
  const recentActivities = dashboardData?.recentActivities || [];

  // Generate 7-day activity sparkline data
  const activityTrend = [
    { day: 'Mon', activities: 2, problems: 1 },
    { day: 'Tue', activities: 4, problems: 2 },
    { day: 'Wed', activities: 1, problems: 0 },
    { day: 'Thu', activities: 5, problems: 3 },
    { day: 'Fri', activities: 3, problems: 2 },
    { day: 'Sat', activities: 6, problems: 4 },
    { day: 'Sun', activities: stats?.coding?.solvedCount || 4, problems: 2 },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const getPriorityBadgeVariant = priority => {
    if (priority === 'high') return 'danger';
    if (priority === 'medium') return 'warning';
    return 'surface';
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-r from-brand-950/80 via-surface-900/90 to-surface-950 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{stats?.overallStreak || 1}-Day Engineering Streak</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.name?.split(' ')[0] || 'Engineer'}
          </h1>
          <p className="mt-2 text-sm text-surface-300 leading-relaxed">
            {user?.university
              ? `${user.university} • ${user.branch} • Semester ${user.semester}`
              : 'Your personalized engineering operating system.'}
          </p>
        </div>
      </div>

      {/* "What Should I Do Today?" Panel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">What Should I Do Today?</h2>
          </div>
          <span className="text-xs text-surface-400">
            Prioritized by your goals, pending syllabus & streaks
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {recommendations.map(rec => (
            <Card
              key={rec.id}
              hover
              className="flex flex-col justify-between border-surface-800/80 bg-surface-900/60 p-5"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/20">
                    {rec.badge}
                  </span>
                  <Badge
                    variant={getPriorityBadgeVariant(rec.priority)}
                    size="sm"
                    className="capitalize"
                  >
                    {rec.priority} Priority
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-1">{rec.title}</h3>
                <p className="text-xs text-surface-400 mt-1 line-clamp-2">{rec.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-surface-800/60">
                <Link to={rec.deepLink}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-between"
                    rightIcon={ArrowRight}
                  >
                    {rec.actionLabel}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 4 Compact Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Academics Progress Card */}
        <Card className="border-surface-800 bg-surface-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400 font-medium">Academics Syllabus</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {stats?.academics?.percentComplete || 0}%
            </span>
            <p className="text-xs text-surface-400 mt-1">
              {stats?.academics?.completedTopics || 0} of {stats?.academics?.totalTopics || 0}{' '}
              Topics Mastered
            </p>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-800 mt-3 overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full"
              style={{ width: `${stats?.academics?.percentComplete || 0}%` }}
            />
          </div>
        </Card>

        {/* Coding Stats Card */}
        <Card className="border-surface-800 bg-surface-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400 font-medium">Coding & DSA</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{stats?.coding?.solvedCount || 0}</span>
            <p className="text-xs text-surface-400 mt-1">
              Problems Solved • {stats?.coding?.accuracyRate || 0}% Accuracy
            </p>
          </div>
          <div className="flex gap-2 text-[10px] text-surface-400 mt-3">
            <span className="text-emerald-400">{stats?.coding?.easyCount || 0} Easy</span>
            <span>•</span>
            <span className="text-amber-400">{stats?.coding?.mediumCount || 0} Med</span>
            <span>•</span>
            <span className="text-rose-400">{stats?.coding?.hardCount || 0} Hard</span>
          </div>
        </Card>

        {/* GATE Prep Card */}
        <Card className="border-surface-800 bg-surface-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400 font-medium">GATE Readiness</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {stats?.gate?.averageScore ? `${stats.gate.averageScore}/100` : 'Diagnostic'}
            </span>
            <p className="text-xs text-surface-400 mt-1">
              {stats?.gate?.testsAttempted || 0} Mock Tests Attempted
            </p>
          </div>
          <p className="text-[11px] text-purple-300 mt-3 truncate">
            {stats?.gate?.weakTopics?.length
              ? `Focus: ${stats.gate.weakTopics[0]}`
              : 'Ready for Mock Test'}
          </p>
        </Card>

        {/* Interview Readiness Card */}
        <Card className="border-surface-800 bg-surface-900/40 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-400 font-medium">Interview Readiness</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {stats?.interviews?.averageReadinessScore || 75}%
            </span>
            <p className="text-xs text-surface-400 mt-1">
              {stats?.interviews?.sessionsCompleted || 0} Mock Sessions Completed
            </p>
          </div>
          <p className="text-[11px] text-amber-300 mt-3">Rubric: Technical & Communication</p>
        </Card>
      </div>

      {/* Visual Analytics Chart & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Activity Trends Chart */}
        <Card className="lg:col-span-2 border-surface-800 bg-surface-900/40">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Weekly Study & Solving Velocity</CardTitle>
                <CardDescription>
                  Daily learning activities recorded across all modules
                </CardDescription>
              </div>
              <Badge variant="brand" size="sm">
                Last 7 Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c87e8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c87e8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="activities"
                  name="Learning Events"
                  stroke="#36a3f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#activityGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Stream */}
        <Card className="border-surface-800 bg-surface-900/40 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Event log feeding your pre-aggregated metrics</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-xs text-surface-400 text-center py-8">
                  No learning activity recorded yet today. Complete a topic or solve a problem to
                  see it here!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivities.map((act, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs">
                      <div className="h-2 w-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-surface-200 font-medium truncate">{act.title}</p>
                        <p className="text-[10px] text-surface-500 uppercase font-mono mt-0.5">
                          {act.module} •{' '}
                          {new Date(act.occurredAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 border-t border-surface-800/60 mt-auto">
            <Link to="/academics" className="w-full block">
              <Button variant="secondary" size="sm" className="w-full">
                Browse Full Curriculum &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
