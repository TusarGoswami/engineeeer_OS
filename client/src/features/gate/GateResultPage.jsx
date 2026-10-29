import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gateService } from '../../services/gate.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export function GateResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempt();
  }, [id]);

  const fetchAttempt = async () => {
    try {
      setLoading(true);
      const data = await gateService.getAttemptById(id);
      setAttempt(data);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading examination results and solutions...
      </div>
    );
  }

  if (!attempt) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Result not found</h2>
        <Button onClick={() => navigate('/gate')}>Back to GATE Hub</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/gate')}
            style={{ marginBottom: '0.5rem' }}
          >
            ← Back to Mock Tests
          </Button>
          <h1
            style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}
          >
            {attempt.testId?.title || 'GATE CS Mock Exam'} — Result Analysis
          </h1>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Completed on {new Date(attempt.submittedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Score Hero Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Score
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--primary, #6366f1)',
              margin: '4px 0',
            }}
          >
            {attempt.score}{' '}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
              / {attempt.totalMarksAvailable}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            GATE Marking Applied
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Accuracy Rate
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: 'var(--emerald-400, #34d399)',
              margin: '4px 0',
            }}
          >
            {attempt.accuracyRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Of attempted questions
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Question Breakdown
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'baseline', margin: '8px 0' }}>
            <span style={{ color: 'var(--emerald-400, #34d399)', fontWeight: 700 }}>
              ✓ {attempt.correctCount} Correct
            </span>
            <span style={{ color: 'var(--rose-400, #f87171)', fontWeight: 700 }}>
              ✗ {attempt.incorrectCount} Incorrect
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {attempt.unattemptedCount} Unattempted
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Time Taken
          </div>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: '8px 0',
              color: 'var(--text-main)',
            }}
          >
            {Math.round(attempt.timeTakenSeconds / 60)} mins
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Pacing: ~{(attempt.timeTakenSeconds / (attempt.totalQuestions || 1)).toFixed(0)}s per
            question
          </div>
        </Card>
      </div>

      {/* Weak Topics Callout */}
      {attempt.weakTopics && attempt.weakTopics.length > 0 && (
        <Card
          style={{
            borderLeft: '4px solid var(--rose-400, #f87171)',
            background: 'rgba(248, 113, 113, 0.05)',
          }}
        >
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              margin: '0 0 0.5rem 0',
              color: 'var(--rose-400, #f87171)',
            }}
          >
            ⚠️ Targeted Study Recommended
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>
            You scored below 50% accuracy in the following syllabus topics. Focus revision on these
            core concepts:
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {attempt.weakTopics.map(wt => (
              <Badge key={wt} variant="danger">
                {wt}
              </Badge>
            ))}
          </div>
        </Card>
      )}

      {/* Detailed Question Review & Solutions */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          Question & Solution Review
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {(attempt.reviewQuestions || []).map((q, idx) => (
            <Card
              key={q.questionId}
              style={{
                borderLeft: `4px solid ${
                  q.isCorrect
                    ? 'var(--emerald-500, #10b981)'
                    : q.selectedOptions?.length || q.natAnswer !== null
                      ? 'var(--rose-500, #ef4444)'
                      : 'var(--border)'
                }`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Question {idx + 1}</span>
                  <Badge variant="primary">{q.type?.toUpperCase()}</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.topic}</span>
                </div>
                <div>
                  <Badge
                    variant={
                      q.isCorrect ? 'success' : q.negativeDeducted > 0 ? 'danger' : 'secondary'
                    }
                  >
                    {q.marksAwarded > 0
                      ? `+${q.marksAwarded}`
                      : q.negativeDeducted > 0
                        ? `-${q.negativeDeducted}`
                        : '0'}{' '}
                    Marks
                  </Badge>
                </div>
              </div>

              {/* Question Statement */}
              <p
                style={{
                  margin: '0 0 1rem 0',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-line',
                }}
              >
                {q.questionText}
              </p>

              {/* Answers Review */}
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Your Answer: </span>
                  <strong
                    style={{
                      color: q.isCorrect
                        ? 'var(--emerald-400, #34d399)'
                        : 'var(--rose-400, #f87171)',
                    }}
                  >
                    {q.type === 'nat'
                      ? q.natAnswer !== null
                        ? q.natAnswer
                        : 'Unattempted'
                      : q.selectedOptions?.length
                        ? q.selectedOptions.join(', ')
                        : 'Unattempted'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Official Answer: </span>
                  <strong style={{ color: 'var(--emerald-400, #34d399)' }}>
                    {q.type === 'nat'
                      ? `${q.natRange?.min ?? q.correctOptions?.[0]}`
                      : q.correctOptions?.join(', ')}
                  </strong>
                </div>
              </div>

              {/* Step-by-Step Explanation */}
              {q.explanation && (
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '0.75rem',
                  }}
                >
                  <strong style={{ color: 'var(--primary, #6366f1)' }}>
                    Step-by-Step Solution:{' '}
                  </strong>
                  {q.explanation}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GateResultPage;
