import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Plus,
  Play,
  Award,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  TrendingUp,
  MessageSquare,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { aiService } from '../../services/ai.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Badge,
  Button,
  Modal,
  Input,
  EmptyState,
  Skeleton,
  ChartContainer,
  ChartTooltip,
  CHART_PALETTE,
  useToast,
} from '../../components/index.js';

const INTERVIEW_MODES = [
  {
    id: 'technical',
    code: 'SYS-ARCH',
    title: 'Technical & System Architecture',
    desc: 'Distributed systems, concurrency, caching, and database design trade-offs.',
    icon: Layers,
  },
  {
    id: 'dsa',
    code: 'DSA-LIVE',
    title: 'Algorithms & Data Structures',
    desc: 'Real-time algorithmic reasoning, complexity analysis, and edge case probing.',
    icon: Sparkles,
  },
  {
    id: 'project',
    code: 'PORTFOLIO',
    title: 'Portfolio & Project Deep-Dive',
    desc: 'Technical interrogation of your flagship projects, architectural decisions, and failure modes.',
    icon: Award,
  },
  {
    id: 'hr',
    code: 'STAR-LEAD',
    title: 'Behavioral & Leadership (STAR)',
    desc: 'Situational leadership, conflict resolution, project delivery, and culture fit.',
    icon: Video,
  },
];

const MODE_LABELS = {
  technical: 'Technical',
  dsa: 'DSA',
  project: 'Project',
  hr: 'Behavioral',
};

/**
 * AI Mock Interview Studio lobby: readiness analytics, track configurator, and session ledger.
 */
export function InterviewHubPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterMode, setFilterMode] = useState('all');

  // New Interview Form
  const [mode, setMode] = useState('technical');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE-1)');
  const [isCreating, setIsCreating] = useState(false);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await aiService.getMyInterviews();
      setSessions(data || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleStartInterview = async (e) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const newSession = await aiService.createInterview({ mode, targetRole });
      setIsModalOpen(false);
      showToast('Interview session initiated!', 'success');
      navigate(`/interviews/${newSession._id}`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start interview', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const telemetry = useMemo(() => {
    const scored = sessions.filter(
      (s) => s.evaluation?.overallScore !== undefined && s.evaluation?.overallScore !== null
    );
    const evaluatedCount = sessions.filter(
      (s) => s.status === 'evaluated' || s.status === 'completed'
    ).length;
    const avgScore =
      scored.length > 0
        ? Math.round(scored.reduce((acc, s) => acc + s.evaluation.overallScore, 0) / scored.length)
        : null;
    const bestScore =
      scored.length > 0 ? Math.max(...scored.map((s) => s.evaluation.overallScore)) : null;

    const trend = [...scored]
      .slice(0, 8)
      .reverse()
      .map((s, idx) => ({
        session: `#${idx + 1}`,
        score: s.evaluation.overallScore,
      }));

    return { evaluatedCount, avgScore, bestScore, trend };
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (filterMode === 'all') return sessions;
    return sessions.filter((s) => s.mode === filterMode);
  }, [sessions, filterMode]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <PageHeader
        eyebrow="~/interview-studio · Candidate Preparation Arena"
        title="AI Mock Interview Studio"
        description="Multi-turn interactive technical and behavioral interviews with Hiring Committee rubric evaluations"
        actions={
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={Plus}
          >
            Start New Interview
          </Button>
        }
      />

      {/* Readiness KPI Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Total Sessions"
          value={sessions.length}
          subvalue="Recorded mock interviews"
          icon={Video}
        />
        <MetricItem
          label="Evaluated"
          value={telemetry.evaluatedCount}
          subvalue="Rubric scorecards completed"
          icon={CheckCircle2}
          accent="compiler"
        />
        <MetricItem
          label="Average Readiness"
          value={telemetry.avgScore !== null ? `${telemetry.avgScore}/100` : '—'}
          subvalue={telemetry.avgScore !== null ? 'Across scored sessions' : 'Complete 1 evaluation'}
          icon={TrendingUp}
          accent="brand"
        />
        <MetricItem
          label="Best Score"
          value={telemetry.bestScore !== null ? `${telemetry.bestScore}/100` : '—'}
          subvalue="Peak rubric rating"
          icon={Award}
        />
      </MetricStrip>

      {/* Studio Track Selector + Evaluation Rubric / Score Trend */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 2x2 Track Grid */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-surface-100">
              Select Interview Track
            </h2>
            <span className="font-mono text-xs text-surface-400">
              4 AI Evaluation Tracks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {INTERVIEW_MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setIsModalOpen(true);
                  }}
                  className="group text-left rounded-xl border border-surface-700 bg-card hover:bg-elevated/45 hover:border-brand-500/50 p-5 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-150 flex flex-col justify-between gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-lg bg-brand-500/10 border border-brand-500/25 text-brand-500 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-surface-400 px-2 py-0.5 rounded bg-elevated border border-surface-700">
                        {m.code}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-sm font-semibold text-surface-100 group-hover:text-brand-700 transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs text-surface-400 mt-1 leading-relaxed line-clamp-2">
                        {m.desc}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-surface-700 flex items-center justify-between text-xs font-medium text-brand-700">
                    <span>Configure & Start</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Rail: Score Trajectory Chart OR Hiring Rubric Pillars */}
        <div className="lg:col-span-4 flex flex-col">
          {telemetry.trend.length >= 2 ? (
            <ChartContainer
              title="Readiness Score Trajectory"
              description="Progression across evaluated mock interviews"
              height={230}
              className="flex-1"
            >
              <AreaChart data={telemetry.trend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="interviewScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF6B22" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#EF6B22" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={CHART_PALETTE.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="session"
                  tick={{ fill: CHART_PALETTE.axis, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: CHART_PALETTE.axis, fontSize: 10, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="Readiness"
                  stroke={CHART_PALETTE.brand}
                  strokeWidth={2}
                  fill="url(#interviewScoreGrad)"
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <Card className="flex-1 flex flex-col justify-between gap-4 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-700">
                    Evaluation Standard
                  </span>
                  <Badge variant="surface" size="sm">
                    4 Pillars
                  </Badge>
                </div>
                <h3 className="font-display text-base font-semibold text-surface-100">
                  Hiring Committee Rubric
                </h3>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Every finished session is graded out of 100 across four engineering competencies with concrete revision recommendations:
                </p>

                <ul className="space-y-2 pt-1">
                  {[
                    ['Technical Correctness', 'Accuracy of systems, DSA & CS concepts'],
                    ['Relevance & Depth', 'Trade-offs, bottlenecks & scalability detail'],
                    ['Clarity & Communication', 'Structured, concise engineering articulation'],
                    ['Problem Solving', 'Iterative reasoning & edge-case rigor'],
                  ].map(([title, desc]) => (
                    <li
                      key={title}
                      className="p-2.5 rounded-lg bg-elevated/60 border border-surface-700"
                    >
                      <div className="text-xs font-semibold text-surface-100">{title}</div>
                      <div className="text-[11px] text-surface-400 mt-0.5">{desc}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
        </div>
      </section>

      {/* Interview Sessions History */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-semibold text-surface-100 tracking-tight">
              Interview Session History
            </h2>
            <span className="font-mono text-xs text-surface-400">
              {sessions.length} Sessions Logged
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter sessions by track">
            {['all', 'technical', 'dsa', 'project', 'hr'].map((track) => (
              <button
                key={track}
                type="button"
                onClick={() => setFilterMode(track)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs font-medium border transition-colors ${
                  filterMode === track
                    ? 'bg-brand-500/10 border-brand-500/30 text-brand-700'
                    : 'bg-card border-surface-700 text-surface-400 hover:text-surface-100 hover:bg-elevated/60'
                }`}
              >
                {track === 'all' ? 'All' : MODE_LABELS[track]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={Video}
            title={sessions.length === 0 ? 'No interview sessions yet' : 'No matching sessions'}
            description={
              sessions.length === 0
                ? 'Launch your first technical or behavioral mock interview to receive a rubric evaluation.'
                : 'No recorded sessions match the selected track filter.'
            }
            actionLabel={sessions.length === 0 ? 'Start New Interview' : 'Show All Sessions'}
            onAction={() => (sessions.length === 0 ? setIsModalOpen(true) : setFilterMode('all'))}
          />
        ) : (
          <div className="rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] divide-y divide-surface-700 overflow-hidden">
            {filteredSessions.map((s) => {
              const isEvaluated = s.status === 'evaluated';
              const isCompleted = s.status === 'completed' || isEvaluated;
              const score = s.evaluation?.overallScore;
              const exchangeCount = s.turns?.length ?? s.messages?.length ?? 0;

              return (
                <div
                  key={s._id}
                  onClick={() => navigate(`/interviews/${s._id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:px-5 hover:bg-elevated/45 transition-colors cursor-pointer"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold text-surface-100">
                        {s.targetRole || 'Software Development Engineer'}
                      </h3>
                      <Badge
                        variant={s.mode === 'technical' ? 'brand' : s.mode === 'dsa' ? 'cyan' : 'surface'}
                        size="sm"
                        className="uppercase"
                      >
                        {s.mode}
                      </Badge>
                      <Badge
                        variant={isEvaluated ? 'compiler' : isCompleted ? 'brand' : 'signal'}
                        size="sm"
                        className="capitalize"
                      >
                        {isEvaluated ? 'Evaluated' : isCompleted ? 'Evaluating' : 'In Progress'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-surface-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {exchangeCount} Exchanges
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    {score !== undefined && score !== null && (
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold font-mono tabular-nums badge-compiler">
                          {score}/100
                        </div>
                        <div className="text-[10px] text-surface-400 uppercase font-mono tracking-wider">
                          Readiness Score
                        </div>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant={isCompleted ? 'secondary' : 'primary'}
                      rightIcon={Play}
                    >
                      {isCompleted ? 'View Rubric' : 'Resume'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Start Interview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize AI Mock Interview"
        description="Select your target engineering role and evaluation track"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleStartInterview} className="space-y-4">
          <Input
            label="Target Position / Level"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="e.g. SDE-1, Backend Engineer, Systems Engineer, Cloud Infrastructure Intern"
            required
          />

          <div className="space-y-2">
            <span className="block text-[13px] font-medium text-surface-100">
              Interview Track
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTERVIEW_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    mode === m.id
                      ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/35'
                      : 'border-surface-700 bg-elevated/55 hover:border-surface-600'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-surface-100">{m.title}</span>
                    {mode === m.id && <Clock className="w-3 h-3 text-brand-500 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-surface-400 mt-1 line-clamp-2">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-surface-700">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isCreating}
            >
              Enter Session
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default InterviewHubPage;
