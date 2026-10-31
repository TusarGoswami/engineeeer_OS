import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { aiService } from '../../services/ai.service.js';
import Card from '../../components/Card.jsx';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import Input from '../../components/Input.jsx';
import { useToast } from '../../components/Toast.jsx';

export function InterviewHubPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleStartInterview = async e => {
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

  const MODES = [
    {
      id: 'technical',
      title: 'Technical & System Architecture',
      desc: 'Distributed systems, concurrency, caching, and database design trade-offs.',
      icon: Layers,
    },
    {
      id: 'dsa',
      title: 'Algorithms & Data Structures',
      desc: 'Real-time algorithmic reasoning, complexity analysis, and edge case probing.',
      icon: Sparkles,
    },
    {
      id: 'project',
      title: 'Portfolio & Project Deep-Dive',
      desc: 'Technical interrogation of your flagship projects, architectural decisions, and failure modes.',
      icon: Award,
    },
    {
      id: 'hr',
      title: 'Behavioral & Leadership (STAR)',
      desc: 'Situational leadership, conflict resolution, project delivery, and culture fit.',
      icon: Video,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">
              Candidate Preparation Arena
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-0.5">
            AI Mock Interview Studio
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Multi-turn interactive technical and behavioral interviews with comprehensive rubric evaluations
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          leftIcon={Plus}
        >
          Start New Interview
        </Button>
      </div>

      {/* Modes Grid Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {MODES.map(m => {
          const Icon = m.icon;
          return (
            <Card
              key={m.id}
              hover
              onClick={() => {
                setMode(m.id);
                setIsModalOpen(true);
              }}
              className="p-5 border-surface-800 bg-surface-900/40 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-white">{m.title}</h3>
                <p className="text-xs text-surface-400 mt-1 leading-relaxed line-clamp-3">
                  {m.desc}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-800/60 flex items-center justify-between text-xs text-amber-400 font-medium">
                <span>Configure & Start</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Interview Sessions History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white tracking-tight">
            Interview Session History
          </h2>
          <span className="text-xs text-surface-400 font-mono">
            {sessions.length} Sessions Logged
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-xl bg-surface-900/40 border border-surface-800 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Card className="p-12 text-center text-surface-400 text-sm">
            No mock interview sessions recorded yet. Launch your first technical mock above!
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map(s => {
              const isCompleted = s.status === 'completed';
              const score = s.evaluation?.overallScore;

              return (
                <div
                  key={s._id}
                  onClick={() => navigate(`/interviews/${s._id}`)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-surface-800 bg-surface-900/50 hover:bg-surface-900/80 hover:border-surface-700 transition-all cursor-pointer shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-white">
                        {s.targetRole || 'Software Development Engineer'}
                      </h3>
                      <Badge
                        variant={s.mode === 'technical' ? 'brand' : s.mode === 'dsa' ? 'cyan' : 'purple'}
                        size="sm"
                        className="uppercase font-mono text-[10px]"
                      >
                        {s.mode}
                      </Badge>
                      <Badge
                        variant={isCompleted ? 'success' : 'warning'}
                        size="sm"
                        className="capitalize"
                      >
                        {isCompleted ? 'Completed' : 'In Progress'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-surface-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{s.messages?.length || 0} Exchanges</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {score !== undefined && score !== null && (
                      <div className="text-right">
                        <div className="text-lg font-bold font-mono text-emerald-400">
                          {score}/100
                        </div>
                        <div className="text-[10px] text-surface-500 uppercase font-mono">
                          Readiness Score
                        </div>
                      </div>
                    )}

                    <Button size="sm" variant={isCompleted ? 'secondary' : 'primary'} rightIcon={Play}>
                      {isCompleted ? 'View Rubric' : 'Resume'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Start Interview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Initialize AI Mock Interview"
        description="Select your target engineering role and evaluation track"
        size="md"
      >
        <form onSubmit={handleStartInterview} className="space-y-4">
          <Input
            label="Target Position / Level"
            value={targetRole}
            onChange={e => setTargetRole(e.target.value)}
            placeholder="e.g. SDE-1, Backend Engineer, Cloud Infrastructure Intern"
            required
          />

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-surface-400">
              Interview Track
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? 'border-brand-500 bg-brand-500/10 ring-1 ring-brand-500/50'
                      : 'border-surface-800 bg-surface-950/60 hover:border-surface-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{m.title}</div>
                  <div className="text-[10px] text-surface-400 mt-0.5 line-clamp-2">
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
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
