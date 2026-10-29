import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gateService } from '../../services/gate.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';

export function GateCataloguePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [testsData, attemptsData] = await Promise.all([
        gateService.getTests(),
        gateService.getMyAttempts(),
      ]);
      setTests(testsData || []);
      setAttempts(attemptsData || []);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section */}
      <div>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 0.5rem 0',
          }}
        >
          GATE Mock Examination Hub
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>
          High-yield mock exams matching standard IIT GATE patterns with precise MCQ, MSQ, and NAT
          negative scoring.
        </p>
      </div>

      {/* Available Tests */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          Available Mock Tests
        </h2>
        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading tests...</p>
        ) : tests.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
              No mock tests available at the moment.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {tests.map(test => (
              <Card
                key={test._id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        margin: 0,
                        color: 'var(--text-main)',
                      }}
                    >
                      {test.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.5,
                    }}
                  >
                    {test.description}
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <span>⏱ {test.durationMinutes} mins</span>
                    <span>📝 {test.totalQuestions} Questions</span>
                    <span>🎯 {test.totalMarks} Marks</span>
                  </div>
                </div>

                <Button variant="primary" onClick={() => navigate(`/gate/test/${test._id}`)}>
                  Start Exam
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent Attempts History */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
          My Test Attempts
        </h2>
        {attempts.length === 0 ? (
          <Card>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '1rem 0' }}>
              You haven&apos;t taken any GATE mock exams yet. Take your first test above to evaluate
              your readiness!
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
                      Test Title
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Score
                    </th>
                    <th
                      style={{
                        padding: '1rem 1.5rem',
                        color: 'var(--text-muted)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      Accuracy
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
                  {attempts.map(att => (
                    <tr
                      key={att._id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => navigate(`/gate/results/${att._id}`)}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                        {att.testId?.title || 'GATE CS Mock Exam'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--primary, #6366f1)' }}>
                          {att.score}
                        </span>{' '}
                        / {att.totalMarksAvailable}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <Badge variant={att.accuracyRate >= 70 ? 'success' : 'warning'}>
                          {att.accuracyRate}%
                        </Badge>
                      </td>
                      <td
                        style={{
                          padding: '1rem 1.5rem',
                          color: 'var(--text-muted)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {new Date(att.submittedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={e => {
                            e.stopPropagation();
                            navigate(`/gate/results/${att._id}`);
                          }}
                        >
                          Review Solutions
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
    </div>
  );
}

export default GateCataloguePage;
