import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../../services/ai.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export function InterviewHubPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Interview Form
  const [mode, setMode] = useState('technical');
  const [targetRole, setTargetRole] = useState('Software Development Engineer (SDE-1)');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

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

  const handleStartInterview = async e => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const newSession = await aiService.createInterview({ mode, targetRole });
      setIsModalOpen(false);
      navigate(`/interviews/${newSession._id}`);
    } catch {
      setIsCreating(false);
    }
  };

  const MODES = [
    {
      id: 'technical',
      title: 'Technical & System Architecture',
      desc: 'Deep-dive into distributed systems, concurrency, caching, and database design trade-offs.',
    },
    {
      id: 'dsa',
      title: 'Algorithms & Data Structures',
      desc: 'Real-time algorithmic reasoning, complexity analysis, and edge case probing.',
    },
    {
      id: 'project',
      title: 'Portfolio & Project Deep-Dive',
      desc: 'Technical interrogation of your flagship projects, design decisions, and failure modes.',
    },
    {
      id: 'hr',
      title: 'Behavioral & Leadership (STAR)',
      desc: 'Situational leadership, conflict resolution, project delivery, and culture fit.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              margin: '0 0 0.5rem 0',
            }}
          >
            AI Mock Interview Studio
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
            Multi-turn interactive technical and behavioral interviews with comprehensive rubric
            evaluations.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          + Start New Interview
        </Button>
      </div>

      {/* Modes Grid Preview */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          Interview Formats
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1rem',
          }}
        >
          {MODES.map(m => (
            <Card
              key={m.id}
              style={{
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onClick={() => {
                setMode(m.id);
                setIsModalOpen(true);
              }}
            >
              <h3
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  margin: '0 0 0.5rem 0',
                  color: 'var(--text-main)',
                }}
              >
                {m.title}
              </h3>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {m.desc}
              </p>
            </Card>
          ))}
        </div>
      </div>

      {/* Interview History */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          My Interview Sessions
        </h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '1rem 0' }}>
              No interview sessions recorded yet. Start your first mock interview above to practice
              live questions!
            </p>
          </Card>
        ) : (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Target Role
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Mode
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Overall Score
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Date
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        textAlign: 'right',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr
                      key={s._id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => navigate(`/interviews/${s._id}`)}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{s.targetRole}</td>
                      <td style={{ padding: '1rem 1.5rem', textTransform: 'capitalize' }}>
                        <Badge variant="secondary">{s.mode}</Badge>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Badge
                          variant={
                            s.status === 'evaluated'
                              ? 'success'
                              : s.status === 'in_progress'
                                ? 'warning'
                                : 'primary'
                          }
                        >
                          {s.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {s.evaluation?.overallScore !== undefined ? (
                          <strong style={{ color: 'var(--primary, #6366f1)' }}>
                            {s.evaluation.overallScore} / 100
                          </strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: '1rem 1.5rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {new Date(s.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/interviews/${s._id}`);
                          }}
                        >
                          {s.status === 'in_progress' ? 'Continue' : 'View Scorecard'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Start Interview Modal */}
      {isModalOpen && (
        <Modal
          title="Configure AI Mock Interview"
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <form
            onSubmit={handleStartInterview}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                Target Engineering Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  marginBottom: '6px',
                }}
              >
                Interview Mode
              </label>
              <select
                value={mode}
                onChange={e => setMode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="technical">Technical & System Architecture</option>
                <option value="dsa">Algorithms & Data Structures</option>
                <option value="project">Portfolio & Project Deep-Dive</option>
                <option value="hr">Behavioral & Leadership (STAR)</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? 'Setting Up...' : 'Begin Interview'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default InterviewHubPage;
