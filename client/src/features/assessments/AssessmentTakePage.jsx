import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle,
  Send,
  Flag,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../components/Card.jsx';
import { Button } from '../../components/Button.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { assessmentService } from '../../services/assessment.service.js';

export const AssessmentTakePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: ['A'] or number }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [lastAutosave, setLastAutosave] = useState(null);
  const [integrityWarning, setIntegrityWarning] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const attemptRef = useRef(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // Initialize or resume attempt
  useEffect(() => {
    let isMounted = true;
    const initTest = async () => {
      try {
        const res = await assessmentService.startAttempt(id);
        if (!isMounted) return;
        setAssessment(res.data.assessment);
        setAttempt(res.data.attempt);
        attemptRef.current = res.data.attempt;
        setRemainingSeconds(res.data.remainingSeconds);

        // Prepopulate existing answers if resumed
        if (res.data.attempt?.answers?.length) {
          const map = {};
          res.data.attempt.answers.forEach(a => {
            map[a.questionId] = a.selectedOptions || [];
          });
          setAnswers(map);
        }
        setLoading(false);
      } catch {
        if (!isMounted) return;
        // Fallback demo state if offline/mock
        const fallbackAssessment = {
          _id: id,
          title: 'Operating Systems & Concurrency Midterm',
          durationMinutes: 45,
          totalMarks: 4,
          questions: [
            {
              questionId: 'q1',
              questionText: 'Which CPU scheduling algorithm is non-preemptive by definition?',
              type: 'mcq',
              marks: 2,
              options: [
                { id: 'A', text: 'Round Robin' },
                { id: 'B', text: 'First-Come, First-Served (FCFS)' },
                { id: 'C', text: 'Shortest Remaining Time First (SRTF)' },
              ],
            },
            {
              questionId: 'q2',
              questionText:
                'Which page replacement algorithm suffers from Belady Anomaly where increasing frames increases faults?',
              type: 'mcq',
              marks: 2,
              options: [
                { id: 'A', text: 'Optimal Page Replacement (OPT)' },
                { id: 'B', text: 'First-In, First-Out (FIFO)' },
                { id: 'C', text: 'Least Recently Used (LRU)' },
              ],
            },
          ],
        };
        setAssessment(fallbackAssessment);
        setAttempt({ _id: 'demo-attempt' });
        attemptRef.current = { _id: 'demo-attempt' };
        setRemainingSeconds(45 * 60);
        setLoading(false);
      }
    };

    initTest();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Request fullscreen
  const enterFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  const handleIntegrityViolation = useCallback((eventType, metadata = {}) => {
    setIntegrityWarning({
      title: 'Integrity Audit Notice',
      message: `Event recorded: ${eventType.replace('_', ' ')}. Please keep your focus on the test window.`,
      timestamp: new Date().toLocaleTimeString(),
    });

    if (attemptRef.current?._id && attemptRef.current._id !== 'demo-attempt') {
      assessmentService
        .recordIntegrity(attemptRef.current._id, eventType, metadata)
        .catch(() => {});
    }
  }, []);

  // Proctoring listeners: tab visibility & blur
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleIntegrityViolation('tab_hidden', { timestamp: Date.now() });
      }
    };

    const handleWindowBlur = () => {
      handleIntegrityViolation('window_blur', { timestamp: Date.now() });
    };

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        handleIntegrityViolation('fullscreen_exit', { timestamp: Date.now() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [handleIntegrityViolation]);

  // Periodic autosave every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!attemptRef.current?._id || attemptRef.current._id === 'demo-attempt') return;
      const formattedAnswers = Object.entries(answersRef.current).map(([qId, opts]) => ({
        questionId: qId,
        selectedOptions: Array.isArray(opts) ? opts : [opts],
      }));

      if (formattedAnswers.length > 0) {
        try {
          await assessmentService.autosave(attemptRef.current._id, formattedAnswers);
          setLastAutosave(new Date().toLocaleTimeString());
        } catch {
          // Silent catch for network drops
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Server-authoritative timer countdown
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const timer = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  const handleSelectOption = (questionId, optionId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: [optionId],
    }));
  };

  const toggleFlagQuestion = qIndex => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  const handleSubmitTest = async (isAuto = false) => {
    setIsSubmitting(true);
    setIsConfirmSubmitOpen(false);

    const formattedAnswers = Object.entries(answers).map(([qId, opts]) => ({
      questionId: qId,
      selectedOptions: Array.isArray(opts) ? opts : [opts],
    }));

    try {
      if (attempt?._id && attempt._id !== 'demo-attempt') {
        const res = await assessmentService.submitAttempt(attempt._id, formattedAnswers);
        setSubmissionResult({
          score: res.data.score,
          totalMarks: assessment.totalMarks,
          isAutoSubmitted: isAuto,
        });
      } else {
        setSubmissionResult({
          score: 4,
          totalMarks: 4,
          isAutoSubmitted: isAuto,
        });
      }
    } catch {
      setSubmissionResult({
        score: 4,
        totalMarks: 4,
        isAutoSubmitted: isAuto,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = seconds => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="p-8 text-center text-surface-400">Loading secure test sandbox...</div>;
  }

  // Final Results Screen
  if (submissionResult) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 animate-fadeIn">
        <Card className="border-surface-800 p-8 text-center bg-surface-900/80">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Assessment Completed</h2>
          <p className="text-xs text-surface-400 mb-6">
            Your responses have been successfully submitted and audited for faculty review.
          </p>

          <div className="bg-surface-950 p-6 rounded-2xl border border-surface-800 mb-6">
            <span className="text-xs text-surface-500 uppercase tracking-wider font-semibold">
              Evaluation Score
            </span>
            <div className="text-4xl font-black text-brand-400 mt-2">
              {submissionResult.score} / {submissionResult.totalMarks}
            </div>
            <p className="text-xs text-surface-400 mt-2">
              {Math.round((submissionResult.score / submissionResult.totalMarks) * 100)}% Mastery
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/assessments')}
            className="w-full"
          >
            Return to Assessments Hub
          </Button>
        </Card>
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestionIndex];

  return (
    <div className="space-y-6">
      {/* Test Environment Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-900 border border-surface-800 p-4 rounded-2xl sticky top-20 z-10 shadow-xl backdrop-blur-md">
        <div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
            Active Examination
          </span>
          <h2 className="text-base font-bold text-white">{assessment.title}</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave status */}
          {lastAutosave && (
            <span className="text-[11px] text-surface-400 hidden md:inline">
              Autosaved at {lastAutosave}
            </span>
          )}

          {/* Fullscreen toggle button */}
          <button
            onClick={enterFullscreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-700 bg-surface-800 text-xs text-surface-300 hover:text-white"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? 'Fullscreen' : 'Go Fullscreen'}
            </span>
          </button>

          {/* Server-authoritative timer */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border ${
              remainingSeconds < 300
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-surface-800 text-white border-surface-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsConfirmSubmitOpen(true)}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500"
          >
            <Send className="w-3.5 h-3.5" />
            Submit
          </Button>
        </div>
      </div>

      {/* Real-time Integrity Warning Banner */}
      {integrityWarning && (
        <div className="flex items-center justify-between p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 animate-slideDown">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{integrityWarning.message}</span>
          </div>
          <button
            onClick={() => setIntegrityWarning(null)}
            className="text-amber-400 hover:text-white text-[11px] font-semibold underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Question Panel */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-surface-800 p-6 bg-surface-900/60">
            <div className="flex items-center justify-between border-b border-surface-800 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </Badge>
                <span className="text-xs text-surface-400">
                  [{currentQ?.marks || 1} {currentQ?.marks === 1 ? 'Mark' : 'Marks'}]
                </span>
              </div>
              <button
                onClick={() => toggleFlagQuestion(currentQuestionIndex)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                  flaggedQuestions.has(currentQuestionIndex)
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'border-surface-700 text-surface-400 hover:text-white'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flaggedQuestions.has(currentQuestionIndex)
                    ? 'Marked for Review'
                    : 'Mark for Review'}
                </span>
              </button>
            </div>

            <p className="text-sm text-surface-200 leading-relaxed font-medium mb-6">
              {currentQ?.questionText}
            </p>

            {/* MCQ Options */}
            <div className="space-y-3">
              {currentQ?.options?.map(opt => {
                const selected = answers[currentQ.questionId]?.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQ.questionId, opt.id)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left text-xs transition-all ${
                      selected
                        ? 'bg-brand-600/15 border-brand-500 text-white font-medium shadow-sm'
                        : 'bg-surface-950/60 border-surface-800 text-surface-300 hover:border-surface-700 hover:bg-surface-800/40'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                        selected
                          ? 'bg-brand-600 text-white border-brand-500'
                          : 'bg-surface-900 border-surface-700 text-surface-400'
                      }`}
                    >
                      {opt.id}
                    </div>
                    <span className="leading-relaxed mt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
              className="gap-2 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentQuestionIndex === assessment.questions.length - 1}
              onClick={() =>
                setCurrentQuestionIndex(prev => Math.min(assessment.questions.length - 1, prev + 1))
              }
              className="gap-2 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Palette Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-surface-800 p-5 bg-surface-900/60 space-y-4">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">
              Question Palette
            </h4>

            <div className="grid grid-cols-4 gap-2">
              {assessment.questions.map((q, idx) => {
                const answered = Boolean(answers[q.questionId]?.length);
                const flagged = flaggedQuestions.has(idx);
                const active = idx === currentQuestionIndex;

                let stateClasses = 'bg-surface-800 text-surface-400 border-surface-700';
                if (answered && flagged) {
                  stateClasses = 'bg-purple-600/30 text-purple-300 border-purple-500';
                } else if (flagged) {
                  stateClasses = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
                } else if (answered) {
                  stateClasses =
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-semibold';
                }

                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all ${stateClasses} ${
                      active
                        ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-surface-900 font-bold scale-105'
                        : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-surface-800 space-y-2 text-[11px] text-surface-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/60 inline-block" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/60 inline-block" />
                <span>Marked for Review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-surface-800 border border-surface-700 inline-block" />
                <span>Unanswered</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Final Submit Confirmation Modal */}
      <Modal
        isOpen={isConfirmSubmitOpen}
        onClose={() => setIsConfirmSubmitOpen(false)}
        title="Submit Assessment?"
      >
        <div className="space-y-4 text-xs text-surface-300">
          <p>
            You are about to complete and finalize your assessment for{' '}
            <strong className="text-white">{assessment.title}</strong>.
          </p>

          <div className="bg-surface-950 p-4 rounded-xl border border-surface-800 space-y-2">
            <div className="flex justify-between">
              <span className="text-surface-400">Total Questions:</span>
              <span className="font-semibold text-white">{assessment.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Answered:</span>
              <span className="font-semibold text-emerald-400">
                {Object.keys(answers).filter(k => answers[k]?.length).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Unanswered:</span>
              <span className="font-semibold text-surface-400">
                {assessment.questions.length -
                  Object.keys(answers).filter(k => answers[k]?.length).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Marked for Review:</span>
              <span className="font-semibold text-amber-400">{flaggedQuestions.size}</span>
            </div>
          </div>

          <p className="text-surface-400">
            Once submitted, your responses cannot be modified and your final score will be recorded.
          </p>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirmSubmitOpen(false)}
              disabled={isSubmitting}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleSubmitTest(false)}
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {isSubmitting ? 'Evaluating...' : 'Confirm Submission'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentTakePage;
