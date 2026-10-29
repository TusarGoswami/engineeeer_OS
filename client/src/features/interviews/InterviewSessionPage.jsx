import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiService } from '../../services/ai.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export function InterviewSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [candidateMessage, setCandidateMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const turnsEndRef = useRef(null);

  useEffect(() => {
    fetchSession();
  }, [id]);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.turns]);

  // Polling when interview is in 'completed' state waiting for evaluation worker
  useEffect(() => {
    if (session?.status !== 'completed') return;
    const interval = setInterval(async () => {
      try {
        const data = await aiService.getInterview(id);
        if (data.status === 'evaluated') {
          setSession(data);
          clearInterval(interval);
        }
      } catch {
        // Handled silently
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session?.status, id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const data = await aiService.getInterview(id);
      setSession(data);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSendTurn = async e => {
    e?.preventDefault();
    const msg = candidateMessage.trim();
    if (!msg || isSending) return;

    try {
      setIsSending(true);
      setCandidateMessage('');
      const updated = await aiService.submitTurn(id, msg);
      setSession(updated);
    } catch {
      // Error
    } finally {
      setIsSending(false);
    }
  };

  const handleFinishInterview = async () => {
    try {
      setIsFinishing(true);
      setShowFinishConfirm(false);
      const updated = await aiService.finishInterview(id);
      setSession(updated);
    } catch {
      // Error
    } finally {
      setIsFinishing(false);
    }
  };

  // Web Speech API Microphone Dictation
  const handleToggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your response.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = event => {
        const transcript = event.results[0][0].transcript;
        setCandidateMessage(prev => (prev ? prev + ' ' + transcript : transcript));
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading interview session...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Session not found</h2>
        <Button onClick={() => navigate('/interviews')}>Back to Studio</Button>
      </div>
    );
  }

  const isEvaluated = session.status === 'evaluated';
  const isCompleted = session.status === 'completed';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        gap: '1rem',
      }}
    >
      {/* Top Session Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-glass, rgba(0, 0, 0, 0.3))',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Button variant="ghost" size="sm" onClick={() => navigate('/interviews')}>
            ← Studio
          </Button>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {session.targetRole}
          </h2>
          <Badge variant="secondary" style={{ textTransform: 'capitalize' }}>
            {session.mode}
          </Badge>
          <Badge variant={isEvaluated ? 'success' : isCompleted ? 'primary' : 'warning'}>
            {session.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        {session.status === 'in_progress' && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowFinishConfirm(true)}
            disabled={isFinishing}
          >
            Finish & Evaluate
          </Button>
        )}
      </div>

      {/* Main Container: Chat turns or Evaluation Scorecard */}
      {isEvaluated ? (
        /* Rubric Evaluation Scorecard View */
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
          }}
        >
          {/* Hero Overall Score */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            <Card>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Overall Readiness Score
              </div>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: 'var(--primary, #6366f1)',
                  margin: '4px 0',
                }}
              >
                {session.evaluation?.overallScore}{' '}
                <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
              <Badge variant="success">{session.evaluation?.readinessLevel}</Badge>
            </Card>

            <Card style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Hiring Committee Summary
              </div>
              <p
                style={{
                  margin: '8px 0 0 0',
                  fontSize: '0.95rem',
                  lineHeight: 1.5,
                  color: 'var(--text-main)',
                }}
              >
                {session.evaluation?.feedbackSummary}
              </p>
            </Card>
          </div>

          {/* Rubric Breakdown Bars */}
          <Card>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>
              Rubric Performance
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.25rem',
              }}
            >
              {session.evaluation?.rubricScores && (
                <>
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Technical Correctness</span>
                      <strong>{session.evaluation.rubricScores.technicalCorrectness} / 10</strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${session.evaluation.rubricScores.technicalCorrectness * 10}%`,
                          height: '100%',
                          background: 'var(--emerald-500, #10b981)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Relevance & Depth</span>
                      <strong>{session.evaluation.rubricScores.relevanceAndDepth} / 10</strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${session.evaluation.rubricScores.relevanceAndDepth * 10}%`,
                          height: '100%',
                          background: 'var(--primary, #6366f1)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Clarity & Communication</span>
                      <strong>
                        {session.evaluation.rubricScores.clarityAndCommunication} / 10
                      </strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${session.evaluation.rubricScores.clarityAndCommunication * 10}%`,
                          height: '100%',
                          background: 'var(--amber-500, #f59e0b)',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Problem Solving</span>
                      <strong>{session.evaluation.rubricScores.problemSolving} / 10</strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '4px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${session.evaluation.rubricScores.problemSolving * 10}%`,
                          height: '100%',
                          background: 'var(--violet-500, #8b5cf6)',
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Strengths & Improvement Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Card style={{ borderLeft: '4px solid var(--emerald-500, #10b981)' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--emerald-400, #34d399)' }}>
                Key Strengths
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                }}
              >
                {(session.evaluation?.strengths || []).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </Card>

            <Card style={{ borderLeft: '4px solid var(--amber-500, #f59e0b)' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--amber-400, #fbbf24)' }}>
                Areas for Improvement
              </h4>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: '1.25rem',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  lineHeight: 1.6,
                }}
              >
                {(session.evaluation?.areasForImprovement || []).map((a, idx) => (
                  <li key={idx}>{a}</li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Suggested Revision Topics */}
          {session.evaluation?.recommendedTopics &&
            session.evaluation.recommendedTopics.length > 0 && (
              <Card>
                <h4 style={{ margin: '0 0 0.75rem 0' }}>Recommended Revision Topics</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {session.evaluation.recommendedTopics.map(top => (
                    <Badge key={top} variant="primary">
                      {top}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
        </div>
      ) : isCompleted ? (
        /* Evaluation Pending Animation */
        <Card
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
        >
          <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>⚙️</div>
          <h3 style={{ margin: 0 }}>Evaluating Your Interview</h3>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              maxWidth: '400px',
              textAlign: 'center',
              margin: 0,
            }}
          >
            The AI Hiring Committee is reviewing your complete transcript and compiling rubric
            scores for Technical Correctness, Clarity, and Problem Solving...
          </p>
        </Card>
      ) : (
        /* Live Multi-Turn Interview Chat */
        <Card
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {/* Turns message area */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {(session.turns || []).map((turn, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: turn.role === 'candidate' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  gap: '4px',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {turn.role === 'candidate' ? 'You' : 'Principal Interviewer'}
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background:
                      turn.role === 'candidate'
                        ? 'var(--primary, #6366f1)'
                        : 'rgba(255, 255, 255, 0.05)',
                    color: turn.role === 'candidate' ? '#fff' : 'var(--text-main)',
                    fontSize: '0.95rem',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-line',
                    border: turn.role === 'candidate' ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {turn.message}
                </div>
              </div>
            ))}
            {isSending && (
              <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                  }}
                >
                  Interviewer is considering your answer...
                </div>
              </div>
            )}
            <div ref={turnsEndRef} />
          </div>

          {/* Turn Input Form */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <form
              onSubmit={handleSendTurn}
              style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}
            >
              <textarea
                placeholder="Type your technical response... (Press Enter to submit)"
                value={candidateMessage}
                onChange={e => setCandidateMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendTurn();
                  }
                }}
                disabled={isSending}
                rows={2}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
              <Button
                type="button"
                variant={isListening ? 'danger' : 'secondary'}
                onClick={handleToggleSpeech}
                title="Dictate with Microphone"
              >
                {isListening ? '🎙 Listening...' : '🎤 Mic'}
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSending || !candidateMessage.trim()}
              >
                {isSending ? 'Sending...' : 'Reply'}
              </Button>
            </form>
          </div>
        </Card>
      )}

      {/* Confirmation Modal to finish interview */}
      {showFinishConfirm && (
        <Modal
          title="Finish Interview & Submit for Evaluation?"
          isOpen={showFinishConfirm}
          onClose={() => setShowFinishConfirm(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Are you ready to conclude this interview session? Your full dialogue will be reviewed
              by the AI Hiring Committee to generate your comprehensive technical rubric scorecard.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="ghost" onClick={() => setShowFinishConfirm(false)}>
                Continue Interview
              </Button>
              <Button variant="danger" onClick={handleFinishInterview}>
                Conclude & Evaluate
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default InterviewSessionPage;
