import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gateService } from '../../services/gate.service.js';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';

export function GateTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Student state:
  // answers map: questionId -> { selectedOptions: string[], natAnswer: number | null }
  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [id]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const data = await gateService.getTestForAttempt(id);
      setTest(data);
      setTimeRemaining((data.durationMinutes || 180) * 60);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const currentQ = test?.questions?.[currentIdx];

  const handleSelectOption = optId => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const existing = answers[qId] || { selectedOptions: [], natAnswer: null };

    if (currentQ.type === 'mcq') {
      setAnswers({
        ...answers,
        [qId]: { ...existing, selectedOptions: [optId] },
      });
    } else if (currentQ.type === 'msq') {
      const currentOpts = existing.selectedOptions || [];
      const updated = currentOpts.includes(optId)
        ? currentOpts.filter(o => o !== optId)
        : [...currentOpts, optId];
      setAnswers({
        ...answers,
        [qId]: { ...existing, selectedOptions: updated },
      });
    }
  };

  const handleNatChange = val => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const existing = answers[qId] || { selectedOptions: [], natAnswer: null };
    setAnswers({
      ...answers,
      [qId]: { ...existing, natAnswer: val === '' ? null : Number(val) },
    });
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const copy = { ...answers };
    delete copy[qId];
    setAnswers(copy);
  };

  const toggleReviewMark = () => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const copy = new Set(reviewMarked);
    if (copy.has(qId)) {
      copy.delete(qId);
    } else {
      copy.add(qId);
    }
    setReviewMarked(copy);
  };

  const handleSubmitTest = async () => {
    if (!test) return;
    try {
      setIsSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        selectedOptions: val.selectedOptions || [],
        natAnswer: val.natAnswer !== undefined ? val.natAnswer : null,
      }));

      const totalTimeSeconds = (test.durationMinutes || 180) * 60;
      const timeTaken = Math.max(1, totalTimeSeconds - timeRemaining);

      const attempt = await gateService.submitAttempt(test._id, formattedAnswers, timeTaken);
      navigate(`/gate/results/${attempt._id}`);
    } catch {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Helper formatting seconds -> HH:MM:SS
  const formatTime = secs => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isQuestionAnswered = qId => {
    const a = answers[qId];
    if (!a) return false;
    return (a.selectedOptions && a.selectedOptions.length > 0) || a.natAnswer !== null;
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading examination interface...
      </div>
    );
  }

  if (!test) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center' }}>
        <h2>Test not found</h2>
        <Button onClick={() => navigate('/gate')}>Back to Tests</Button>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 120px)',
        gap: '1rem',
      }}
    >
      {/* Top Test Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--bg-glass, rgba(0, 0, 0, 0.3))',
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            {test.title}
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Subject: {test.subject}
          </span>
        </div>

        {/* Timer & Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '1.15rem',
              fontWeight: 700,
              color: timeRemaining < 300 ? 'var(--rose-400, #f87171)' : 'var(--primary, #6366f1)',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            ⏱ {formatTime(timeRemaining)}
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowConfirmModal(true)}>
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Examination Split Screen */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '1rem',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left Column: Active Question */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem',
            overflowY: 'auto',
          }}
        >
          {currentQ && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Question Metadata Header */}
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>
                    Q{currentIdx + 1} of {totalQuestions}
                  </span>
                  <Badge variant="primary">{currentQ.type.toUpperCase()}</Badge>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {currentQ.topic}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Marks:{' '}
                  <strong style={{ color: 'var(--emerald-400, #34d399)' }}>
                    +{currentQ.marks}
                  </strong>
                  {currentQ.negativeMarks > 0 && (
                    <span style={{ color: 'var(--rose-400, #f87171)', marginLeft: '6px' }}>
                      (-{currentQ.negativeMarks})
                    </span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  color: 'var(--text-main)',
                  whiteSpace: 'pre-line',
                }}
              >
                {currentQ.questionText}
              </div>

              {/* Options (MCQ / MSQ) or NAT Input */}
              {currentQ.type !== 'nat' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(currentQ.options || []).map(opt => {
                    const isSelected = (
                      answers[currentQ.questionId]?.selectedOptions || []
                    ).includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleSelectOption(opt.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          border: `1px solid ${isSelected ? 'var(--primary, #6366f1)' : 'var(--border)'}`,
                          background: isSelected
                            ? 'var(--primary-subtle, rgba(99, 102, 241, 0.15))'
                            : 'rgba(255, 255, 255, 0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: currentQ.type === 'mcq' ? '50%' : '6px',
                            border: `2px solid ${isSelected ? 'var(--primary, #6366f1)' : 'var(--text-muted)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: isSelected ? 'var(--primary, #6366f1)' : 'var(--text-muted)',
                            background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                          }}
                        >
                          {opt.id}
                        </div>
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {opt.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* NAT Input */
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: '300px',
                  }}
                >
                  <label
                    style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}
                  >
                    Enter Numerical Answer:
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10 or 3.14"
                    value={answers[currentQ.questionId]?.natAnswer ?? ''}
                    onChange={e => handleNatChange(e.target.value)}
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--text-main)',
                      fontSize: '1rem',
                      outline: 'none',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Question Action Bottom Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--border)',
              paddingTop: '1rem',
              marginTop: '1rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleReviewMark}
                style={{
                  color: reviewMarked.has(currentQ?.questionId)
                    ? 'var(--violet-400, #a78bfa)'
                    : 'var(--text-muted)',
                }}
              >
                {reviewMarked.has(currentQ?.questionId)
                  ? '★ Marked for Review'
                  : '☆ Mark for Review'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClearResponse}>
                Clear Response
              </Button>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCurrentIdx(prev => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIdx === totalQuestions - 1}
              >
                Save & Next
              </Button>
            </div>
          </div>
        </Card>

        {/* Right Column: Question Palette */}
        <Card
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            height: '100%',
            overflowY: 'auto',
          }}
        >
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Question Palette</h4>

          {/* Legend */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.4rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--emerald-500, #10b981)',
                }}
              />
              Answered ({answeredCount})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--violet-500, #8b5cf6)',
                }}
              />
              Review ({reviewMarked.size})
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                }}
              />
              Not Answered ({totalQuestions - answeredCount})
            </div>
          </div>

          {/* Palette Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            {test.questions.map((q, idx) => {
              const isAnswered = isQuestionAnswered(q.questionId);
              const isReview = reviewMarked.has(q.questionId);
              const isActive = idx === currentIdx;

              let bg = 'rgba(255, 255, 255, 0.05)';
              let color = 'var(--text-muted)';

              if (isReview) {
                bg = 'rgba(139, 92, 246, 0.3)';
                color = '#c4b5fd';
              } else if (isAnswered) {
                bg = 'rgba(16, 185, 129, 0.25)';
                color = '#6ee7b7';
              }

              return (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    height: '36px',
                    borderRadius: '6px',
                    border: isActive
                      ? '2px solid var(--primary, #6366f1)'
                      : '1px solid var(--border)',
                    background: bg,
                    color: isActive ? '#fff' : color,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <Modal
          title="Submit GATE Examination?"
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, color: 'var(--text-muted)' }}>
              Are you sure you want to finish and submit your exam? You will immediately receive
              your official score, accuracy metrics, and complete step-by-step solution
              explanations.
            </p>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <div>
                Total Questions: <strong>{totalQuestions}</strong>
              </div>
              <div>
                Answered:{' '}
                <strong style={{ color: 'var(--emerald-400, #34d399)' }}>{answeredCount}</strong>
              </div>
              <div>
                Unattempted: <strong>{totalQuestions - answeredCount}</strong>
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <Button variant="ghost" onClick={() => setShowConfirmModal(false)}>
                Return to Exam
              </Button>
              <Button variant="danger" onClick={handleSubmitTest} disabled={isSubmitting}>
                {isSubmitting ? 'Evaluating...' : 'Confirm & Submit'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default GateTestPage;
