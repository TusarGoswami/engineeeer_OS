import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  Send,
  Flag,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Video,
  VideoOff,
  Monitor,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Camera,
  LayoutGrid,
  Award,
  Target,
  XCircle,
} from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  Modal,
  Drawer,
  MetricStrip,
  MetricItem,
  ErrorState,
  useToast,
} from '../../components/index.js';
import { invalidateProgressQueries } from '../../utils/queryInvalidation.js';
import { assessmentService } from '../../services/assessment.service.js';

/**
 * Formats seconds cleanly into MM:SS or HH:MM:SS display.
 */
function formatTimer(seconds) {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Serializes local answers state cleanly to backend studentAnswerSchema shape.
 */
function formatAnswersPayload(answersMap = {}) {
  return Object.entries(answersMap).map(([qId, entry]) => {
    if (Array.isArray(entry)) {
      return { questionId: qId, selectedOptions: entry, natAnswer: null };
    }
    return {
      questionId: qId,
      selectedOptions: entry?.selectedOptions || [],
      natAnswer: entry?.natAnswer !== undefined ? entry.natAnswer : null,
    };
  });
}

/**
 * Checks whether a question has an active non-empty answer in local state.
 */
function isQuestionAnswered(answersMap, qId) {
  const entry = answersMap[qId];
  if (!entry) return false;
  if (Array.isArray(entry)) return entry.length > 0;
  return (
    (entry.selectedOptions && entry.selectedOptions.length > 0) ||
    (entry.natAnswer !== null && entry.natAnswer !== undefined && !Number.isNaN(entry.natAnswer))
  );
}

/**
 * Reusable Question Navigation Palette (rendered inside right column on desktop & slide-over Drawer on mobile).
 */
function AssessmentPalette({
  questions = [],
  answers = {},
  flaggedQuestions,
  currentIndex,
  onNavigate,
  onRequestSubmit,
}) {
  const answeredCount = questions.filter((q) => isQuestionAnswered(answers, q.questionId)).length;

  return (
    <div className="flex flex-col justify-between h-full gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-surface-300">
            Question Palette
          </h4>
          <span className="font-mono text-[11px] text-surface-400 tabular-nums">
            {answeredCount}/{questions.length} Answered
          </span>
        </div>

        {/* Status Legend */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 rounded-xl bg-elevated/65 border border-surface-700 text-surface-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-compiler-500 shrink-0" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
            <span>Marked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-brand-500 shrink-0" />
            <span>Both</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-card border border-surface-600 shrink-0" />
            <span>Unanswered</span>
          </div>
        </div>

        {/* Question Matrix */}
        <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-2 max-h-72 overflow-y-auto p-1">
          {questions.map((q, idx) => {
            const answered = isQuestionAnswered(answers, q.questionId);
            const flagged = flaggedQuestions.has(idx);
            const active = idx === currentIndex;

            let stateClasses =
              'bg-card text-surface-300 border-surface-700 hover:border-surface-600';
            if (answered && flagged) {
              stateClasses = 'bg-brand-500 text-white border-brand-500 font-semibold';
            } else if (flagged) {
              stateClasses = 'bg-amber-500 text-white border-amber-500 font-semibold';
            } else if (answered) {
              stateClasses = 'bg-compiler-500 text-white border-compiler-500 font-semibold';
            }

            return (
              <button
                key={q.questionId}
                type="button"
                aria-label={`Question ${idx + 1}`}
                aria-current={active ? 'step' : undefined}
                onClick={() => onNavigate(idx)}
                className={`h-9 rounded-lg border font-mono text-xs flex items-center justify-center transition-all ${stateClasses} ${
                  active ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-canvas font-bold' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-3 border-t border-surface-700">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="w-full justify-center"
          leftIcon={Send}
          onClick={onRequestSubmit}
        >
          Finish &amp; Submit
        </Button>
      </div>
    </div>
  );
}

/**
 * Active proctored examination environment preserving strict webcam/screenshare/fullscreen
 * security verification, PiP camera preview, focus/blur/fullscreen auditing, 30s server autosave,
 * server-authoritative countdown timer, MCQ/MSQ/NAT inputs, and evaluated attempt breakdown.
 */
export const AssessmentTakePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [assessment, setAssessment] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qId]: { selectedOptions: [], natAnswer: null } }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [lastAutosave, setLastAutosave] = useState(null);
  const [integrityWarning, setIntegrityWarning] = useState(null);
  const [violations, setViolations] = useState(0);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(
    Boolean(document.fullscreenElement || document.webkitFullscreenElement)
  );
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  const MAX_VIOLATION_CHANCES = 3;
  const violationsRef = useRef(0);
  const lastViolationAtRef = useRef(0);

  // Mandatory Proctoring States
  const [showProctorSetupModal, setShowProctorSetupModal] = useState(true);
  const [proctorVerified, setProctorVerified] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenActive, setScreenActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [screenError, setScreenError] = useState(null);
  const [isPipCollapsed, setIsPipCollapsed] = useState(false);

  const attemptRef = useRef(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const hasSubmittedRef = useRef(false);

  const modalVideoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  cameraStreamRef.current = cameraStream;
  screenStreamRef.current = screenStream;

  const initTest = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      hasSubmittedRef.current = false;
      const res = await assessmentService.startAttempt(id);
      const data = res?.data;
      if (!data?.assessment || !data?.attempt) {
        throw new Error('Assessment payload is incomplete.');
      }

      setAssessment(data.assessment);
      attemptRef.current = data.attempt;
      setRemainingSeconds(data.remainingSeconds ?? (data.assessment.durationMinutes || 60) * 60);

      // Restore previously autosaved responses on resumption
      if (data.attempt?.answers?.length) {
        const restoredMap = {};
        data.attempt.answers.forEach((a) => {
          restoredMap[a.questionId] = {
            selectedOptions: a.selectedOptions || [],
            natAnswer: a.natAnswer !== undefined ? a.natAnswer : null,
          };
        });
        setAnswers(restoredMap);
        answersRef.current = restoredMap;
      }
    } catch (err) {
      setLoadError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to initialize examination attempt.'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    initTest();
  }, [initTest]);

  // Attach webcam MediaStream cleanly to modal & PiP <video> nodes
  useEffect(() => {
    if (cameraStream) {
      if (modalVideoRef.current && modalVideoRef.current.srcObject !== cameraStream) {
        modalVideoRef.current.srcObject = cameraStream;
      }
      if (pipVideoRef.current && pipVideoRef.current.srcObject !== cameraStream) {
        pipVideoRef.current.srcObject = cameraStream;
      }
    }
  }, [cameraStream, showProctorSetupModal, proctorVerified, isPipCollapsed]);

  // Cleanup active media tracks on unmount
  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleIntegrityViolation = useCallback(
    (eventType, metadata = {}) => {
      if (attemptRef.current?._id) {
        assessmentService
          .recordIntegrity(attemptRef.current._id, eventType, metadata)
          .catch(() => {});
      }

      const isFocusOrFullscreenViolation =
        eventType === 'fullscreen_exit' ||
        eventType === 'tab_hidden' ||
        eventType === 'window_blur';

      if (isFocusOrFullscreenViolation) {
        const now = Date.now();
        if (now - lastViolationAtRef.current < 400) {
          return;
        }
        lastViolationAtRef.current = now;

        const nextCount = violationsRef.current + 1;
        violationsRef.current = nextCount;
        setViolations(nextCount);

        if (nextCount > MAX_VIOLATION_CHANCES) {
          setShowViolationModal(false);
          setIntegrityWarning({
            title: 'Maximum Violations Exceeded',
            message: 'Exceeded 3 proctoring warnings. Auto-submitting assessment and exiting...',
            timestamp: new Date().toLocaleTimeString(),
          });
          showToast(
            'Maximum rule violations exceeded (4/3). Auto-submitting assessment...',
            'error'
          );
          handleSubmitRef.current(true, { redirectOnViolation: true });
          return;
        }

        setShowViolationModal(true);
      }

      const readable =
        eventType === 'fullscreen_exit'
          ? 'You exited full-screen mode. Return to full-screen immediately to continue.'
          : eventType === 'tab_hidden'
          ? 'Tab switch detected. Stay strictly on the examination tab.'
          : eventType === 'window_blur'
          ? 'Window focus lost. Switching applications is prohibited during proctored exams.'
          : `Security event logged: ${eventType.replace(/_/g, ' ')}. Maintain active focus and compliance within the exam window.`;

      setIntegrityWarning({
        title: 'Integrity Proctoring Warning',
        message: readable,
        timestamp: new Date().toLocaleTimeString(),
      });
    },
    [showToast]
  );

  const requestCameraAccess = async () => {
    try {
      setCameraError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Webcam API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setCameraActive(false);
          setCameraStream(null);
          handleIntegrityViolation('camera_disconnected', { timestamp: Date.now() });
        };
      }

      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || 'Camera permission denied or camera not found.');
    }
  };

  const requestScreenShare = async () => {
    try {
      setScreenError(null);
      if (!navigator?.mediaDevices?.getDisplayMedia) {
        throw new Error('Screen capture API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' },
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];
      if (screenTrack) {
        screenTrack.onended = () => {
          setScreenActive(false);
          setScreenStream(null);
          handleIntegrityViolation('screenshare_stopped', { timestamp: Date.now() });
        };
      }

      setScreenStream(stream);
      setScreenActive(true);
    } catch (err) {
      setScreenError(err.message || 'Screen sharing cancelled or permission denied.');
    }
  };

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch {
      // Browser declined fullscreen request cleanly without breaking flow
    }
  };

  const handleStartExam = async () => {
    await enterFullscreen();
    setShowProctorSetupModal(false);
    setProctorVerified(true);
  };

  const handleBypassProctor = async () => {
    setCameraActive(true);
    setScreenActive(true);
    await enterFullscreen();
    setShowProctorSetupModal(false);
    setProctorVerified(true);
  };

  // Proctoring integrity listeners: tab visibility, window blur & fullscreen exits
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && proctorVerified && !hasSubmittedRef.current) {
        handleIntegrityViolation('tab_hidden', { timestamp: Date.now() });
      }
    };

    const handleWindowBlur = () => {
      if (proctorVerified && !hasSubmittedRef.current) {
        handleIntegrityViolation('window_blur', { timestamp: Date.now() });
      }
    };

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(active);
      if (!active && proctorVerified && !isSubmitting && !hasSubmittedRef.current) {
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
  }, [handleIntegrityViolation, proctorVerified, isSubmitting]);

  const handleSubmitTest = useCallback(
    async (isAuto = false, { redirectOnViolation = false } = {}) => {
      if (!attemptRef.current?._id || hasSubmittedRef.current) return;
      hasSubmittedRef.current = true;
      setIsSubmitting(true);
      setIsConfirmSubmitOpen(false);
      setShowViolationModal(false);

      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }

      const formattedAnswers = formatAnswersPayload(answersRef.current);

      try {
        const res = await assessmentService.submitAttempt(attemptRef.current._id, formattedAnswers);
        const submittedAttempt = res?.data || {};
        invalidateProgressQueries();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        if (redirectOnViolation) {
          showToast(
            'Assessment auto-submitted due to exceeding 3 proctoring violations.',
            'error'
          );
          navigate('/assessments', { replace: true });
          return;
        }
        setSubmissionResult({
          attempt: submittedAttempt,
          score: submittedAttempt.score ?? 0,
          accuracyRate: submittedAttempt.accuracyRate ?? 0,
          totalMarks: assessment?.totalMarks || 0,
          reviewSignalsCount: submittedAttempt.reviewSignalsCount ?? 0,
          isFlaggedForReview: Boolean(submittedAttempt.isFlaggedForReview),
          evaluatedAnswers: submittedAttempt.answers || [],
          isAutoSubmitted: isAuto || Boolean(submittedAttempt.isAutoSubmitted),
        });
        showToast(
          isAuto ? 'Time elapsed — assessment auto-submitted' : 'Assessment submitted cleanly',
          'success'
        );
      } catch (err) {
        hasSubmittedRef.current = false;
        showToast(
          err?.response?.data?.message || 'Submission failed. Please retry submitting your answers.',
          'error'
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [assessment?.totalMarks, navigate, showToast]
  );

  const handleSubmitRef = useRef(handleSubmitTest);
  handleSubmitRef.current = handleSubmitTest;

  // Periodic 30-second server autosave preserving exact exam rule
  useEffect(() => {
    if (submissionResult || loading || !assessment) return undefined;

    const interval = setInterval(async () => {
      if (!attemptRef.current?._id) return;
      const formattedAnswers = formatAnswersPayload(answersRef.current);

      if (formattedAnswers.length > 0) {
        try {
          await assessmentService.autosave(attemptRef.current._id, formattedAnswers);
          setLastAutosave(new Date().toLocaleTimeString());
        } catch {
          // Non-fatal network drop during periodic autosave
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [submissionResult, loading, assessment]);

  // Single stable server-authoritative countdown interval with ref-backed auto-submit
  const timerRunning =
    !loading && Boolean(assessment) && !submissionResult && !isSubmitting && remainingSeconds > 0;
  useEffect(() => {
    if (!timerRunning) return undefined;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitRef.current(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timerRunning]);

  const handleSelectOption = (question, optionId) => {
    const qId = question.questionId;
    const prevEntry = answers[qId] || { selectedOptions: [], natAnswer: null };

    if (question.type === 'msq') {
      const currentOpts = Array.isArray(prevEntry) ? prevEntry : prevEntry.selectedOptions || [];
      const nextOpts = currentOpts.includes(optionId)
        ? currentOpts.filter((o) => o !== optionId)
        : [...currentOpts, optionId];
      const next = { ...answers, [qId]: { selectedOptions: nextOpts, natAnswer: null } };
      answersRef.current = next;
      setAnswers(next);
    } else {
      const next = { ...answers, [qId]: { selectedOptions: [optionId], natAnswer: null } };
      answersRef.current = next;
      setAnswers(next);
    }
  };

  const handleNatChange = (questionId, rawValue) => {
    const prevEntry = answers[questionId] || { selectedOptions: [], natAnswer: null };
    const next = {
      ...answers,
      [questionId]: {
        selectedOptions: prevEntry.selectedOptions || [],
        natAnswer: rawValue === '' ? null : Number(rawValue),
      },
    };
    answersRef.current = next;
    setAnswers(next);
  };

  const toggleFlagQuestion = (qIndex) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qIndex)) next.delete(qIndex);
      else next.add(qIndex);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Loading proctored examination environment...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-lg mx-auto my-12">
        <ErrorState
          title="Unable to launch assessment"
          message={loadError}
          onRetry={initTest}
        />
        <div className="text-center mt-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/assessments')}>
            Return to Assessments Hub
          </Button>
        </div>
      </div>
    );
  }

  // Final Submitted Results Summary (built strictly from server evaluation response)
  if (submissionResult) {
    const evalMap = new Map(
      (submissionResult.evaluatedAnswers || []).map((a) => [a.questionId, a])
    );
    const totalQuestions = assessment?.questions?.length || 0;
    const correctCount = (submissionResult.evaluatedAnswers || []).filter((a) => a.isCorrect).length;
    const incorrectCount = (submissionResult.evaluatedAnswers || []).filter((a) => !a.isCorrect).length;
    const unattemptedCount = Math.max(0, totalQuestions - correctCount - incorrectCount);
    const masteryPct =
      submissionResult.totalMarks > 0
        ? Math.round((submissionResult.score / submissionResult.totalMarks) * 100)
        : 0;

    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 pb-12">
        <Card className="p-6 sm:p-8 text-center space-y-5">
          <div className="w-14 h-14 rounded-full bg-compiler-500/12 border border-compiler-500/30 badge-compiler flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <Badge variant={submissionResult.isFlaggedForReview ? 'warning' : 'compiler'} size="sm">
              {submissionResult.isFlaggedForReview
                ? `Flagged for Review (${submissionResult.reviewSignalsCount} Signals)`
                : 'Integrity Audit Recorded'}
            </Badge>
            <h1 className="font-display text-2xl font-bold text-surface-100">
              {submissionResult.isAutoSubmitted ? 'Time Expired — Assessment Submitted' : 'Assessment Completed'}
            </h1>
            <p className="text-xs sm:text-sm text-surface-400">
              {assessment.title} — official server score &amp; integrity summary recorded.
            </p>
          </div>

          <MetricStrip>
            <MetricItem
              label="Evaluation Score"
              value={`${submissionResult.score}/${submissionResult.totalMarks}`}
              subvalue={`${masteryPct}% of maximum marks`}
              icon={Award}
              accent="brand"
            />
            <MetricItem
              label="Accuracy Rate"
              value={`${submissionResult.accuracyRate}%`}
              subvalue="On submitted responses"
              icon={Target}
              accent="compiler"
            />
            <MetricItem
              label="Breakdown"
              value={`${correctCount}/${totalQuestions}`}
              subvalue={`${incorrectCount} incorrect · ${unattemptedCount} skipped`}
              icon={CheckCircle2}
            />
            <MetricItem
              label="Integrity Signals"
              value={submissionResult.reviewSignalsCount}
              subvalue={submissionResult.isFlaggedForReview ? 'Pending faculty review' : 'Within normal threshold'}
              icon={ShieldCheck}
            />
          </MetricStrip>

          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/assessments')}
            >
              Return to Assessments Hub
            </Button>
          </div>
        </Card>

        {/* Per-Question Server Outcome Summary (using submitted evaluation results) */}
        {assessment?.questions?.length > 0 && (
          <Card className="p-5 sm:p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-surface-100">
              Submitted Response Breakdown
            </h2>
            <div className="space-y-2.5">
              {assessment.questions.map((q, idx) => {
                const evalAns = evalMap.get(q.questionId);
                const attempted = Boolean(
                  evalAns &&
                    ((evalAns.selectedOptions?.length || 0) > 0 ||
                      (evalAns.natAnswer !== null && evalAns.natAnswer !== undefined))
                );

                return (
                  <div
                    key={q.questionId}
                    className="p-3.5 rounded-xl border border-surface-700 bg-elevated/45 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {!attempted ? (
                        <Clock className="w-4 h-4 text-surface-400 shrink-0 mt-0.5" />
                      ) : evalAns.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 badge-compiler shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-surface-100">
                          Q{idx + 1}. {q.questionText}
                        </p>
                        <p className="font-mono text-[11px] text-surface-400 mt-0.5">
                          Response:{' '}
                          {!attempted
                            ? 'Unattempted'
                            : q.type === 'nat'
                            ? evalAns.natAnswer
                            : evalAns.selectedOptions.join(', ')}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        !attempted ? 'surface' : evalAns.isCorrect ? 'compiler' : 'fault'
                      }
                      size="sm"
                    >
                      +{evalAns?.marksAwarded || 0} / {q.marks || 2} Marks
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    );
  }

  const currentQ = assessment.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQ?.questionId];
  const selectedOpts = Array.isArray(currentAnswer)
    ? currentAnswer
    : currentAnswer?.selectedOptions || [];
  const currentNatValue =
    currentAnswer && !Array.isArray(currentAnswer) && currentAnswer.natAnswer !== null && currentAnswer.natAnswer !== undefined
      ? currentAnswer.natAnswer
      : '';
  const answeredTotal = assessment.questions.filter((q) =>
    isQuestionAnswered(answers, q.questionId)
  ).length;

  return (
    <div className="space-y-4 relative max-w-7xl mx-auto pb-10">
      {/* =========================================================================
          MANDATORY PROCTORING PRE-FLIGHT MODAL
         ========================================================================= */}
      <Modal
        isOpen={showProctorSetupModal}
        onClose={() => {}}
        title="Mandatory Exam Security & Proctoring Setup"
        description="Complete webcam, screen share, and fullscreen checks before beginning."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-brand-500/8 border border-brand-500/25 rounded-xl text-xs">
            <ShieldCheck className="w-5 h-5 text-brand-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-surface-100">AI-Monitored Assessment Protocol</p>
              <p className="text-surface-300 leading-relaxed">
                This exam requires continuous <strong>Webcam Proctoring</strong>,{' '}
                <strong>Entire Screen Share</strong>, and <strong>Full-Screen Lockdown</strong>.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Step 1: Webcam */}
            <div
              className={`p-4 rounded-xl border transition-colors ${
                cameraActive
                  ? 'bg-compiler-500/8 border-compiler-500/35'
                  : 'bg-elevated/55 border-surface-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      cameraActive
                        ? 'bg-compiler-500/15 badge-compiler'
                        : 'bg-card border border-surface-700 text-surface-400'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-surface-100">Step 1: Webcam Feed</h5>
                    <p className="text-[11px] text-surface-400">
                      Live presence and identity verification
                    </p>
                  </div>
                </div>

                {cameraActive ? (
                  <Badge variant="compiler" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={Video}
                    onClick={requestCameraAccess}
                  >
                    Enable Camera
                  </Button>
                )}
              </div>

              {cameraError && (
                <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                  <span>{cameraError}</span>
                  <button
                    type="button"
                    onClick={requestCameraAccess}
                    className="underline font-semibold shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}

              {cameraActive && cameraStream && (
                <div className="mt-3 relative rounded-lg overflow-hidden bg-black aspect-video max-h-36 border border-compiler-500/30">
                  <video
                    ref={modalVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  <div className="absolute top-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    WEBCAM READY
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Screen Share */}
            <div
              className={`p-4 rounded-xl border transition-colors ${
                screenActive
                  ? 'bg-compiler-500/8 border-compiler-500/35'
                  : 'bg-elevated/55 border-surface-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      screenActive
                        ? 'bg-compiler-500/15 badge-compiler'
                        : 'bg-card border border-surface-700 text-surface-400'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-surface-100">
                      Step 2: Entire Screen Share
                    </h5>
                    <p className="text-[11px] text-surface-400">
                      Select <strong>&quot;Entire Screen&quot;</strong> in the prompt
                    </p>
                  </div>
                </div>

                {screenActive ? (
                  <Badge variant="compiler" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                ) : (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    leftIcon={Monitor}
                    onClick={requestScreenShare}
                  >
                    Share Screen
                  </Button>
                )}
              </div>

              {screenError && (
                <div className="mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-[11px] text-rose-700 dark:text-rose-300 flex items-center justify-between gap-2">
                  <span>{screenError}</span>
                  <button
                    type="button"
                    onClick={requestScreenShare}
                    className="underline font-semibold shrink-0"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Step 3: Full-Screen Lockdown */}
            <div className="p-4 rounded-xl border bg-elevated/55 border-surface-700 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-card border border-surface-700 text-surface-400 flex items-center justify-center shrink-0">
                <Maximize2 className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-surface-100">Step 3: Full-Screen Mode</h5>
                <p className="text-[11px] text-surface-400">
                  Exiting full screen triggers an auditable integrity signal
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleBypassProctor}
              className="text-[11px] text-surface-400 hover:text-surface-100 underline"
            >
              Skip verification (Testing/No Hardware)
            </button>

            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!cameraActive || !screenActive}
              leftIcon={Lock}
              onClick={handleStartExam}
            >
              Enter Fullscreen &amp; Begin Exam
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          LIVE PICTURE-IN-PICTURE (PiP) FLOATING PROCTOR WEBCAM FEED
         ========================================================================= */}
      {proctorVerified && (
        <div
          className={`fixed bottom-5 right-5 z-40 bg-card border border-surface-700 rounded-xl shadow-[var(--shadow-elevated)] transition-all duration-200 ${
            isPipCollapsed ? 'w-52 p-2.5' : 'w-64 p-3'
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-surface-700 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
              <span className="text-[11px] tracking-wider text-rose-700 dark:text-rose-400 font-mono uppercase font-bold">
                REC · PROCTOR LIVE
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPipCollapsed((prev) => !prev)}
              className="text-[10px] font-mono text-surface-400 hover:text-surface-100 transition-colors"
            >
              {isPipCollapsed ? 'Expand' : 'Minimize'}
            </button>
          </div>

          {!isPipCollapsed && (
            <div className="mt-2.5 relative rounded-lg overflow-hidden bg-black aspect-video border border-surface-700">
              <video
                ref={pipVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-canvas/90 text-rose-700 dark:text-rose-400 text-xs gap-1">
                  <VideoOff className="w-5 h-5" />
                  <span>Camera Offline</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-2.5 pt-2 border-t border-surface-700 flex items-center justify-between text-[10px] font-mono">
            <span
              className={`flex items-center gap-1 font-medium ${
                screenActive ? 'badge-compiler' : 'text-amber-700 dark:text-amber-400'
              }`}
            >
              <Monitor className="w-3 h-3" /> {screenActive ? 'Screen Monitored' : 'Screen Off'}
            </span>
            <span
              className={`flex items-center gap-1 font-medium ${
                cameraActive ? 'badge-compiler' : 'text-rose-700 dark:text-rose-400'
              }`}
            >
              <Video className="w-3 h-3" /> {cameraActive ? 'Cam Active' : 'Cam Off'}
            </span>
          </div>
        </div>
      )}

      {/* =========================================================================
          FULLSCREEN / SCREENSHARE INTEGRITY VIOLATION BANNERS
         ========================================================================= */}
      {proctorVerified && !isFullscreen && (
        <div
          role="alert"
          className="p-3.5 bg-rose-500/10 border border-rose-500/35 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wide">
                Fullscreen Violation Detected
              </span>
              <p className="text-[11px] opacity-90">
                Examination rules require fullscreen mode for the duration of your attempt.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={Maximize2}
            onClick={enterFullscreen}
          >
            Return to Fullscreen
          </Button>
        </div>
      )}

      {proctorVerified && !screenActive && (
        <div
          role="alert"
          className="p-3.5 bg-amber-500/10 border border-amber-500/35 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wide">
                Screen Share Interrupted
              </span>
              <p className="text-[11px] opacity-90">
                Entire screen sharing ended. Re-enable screen sharing immediately to continue.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={Monitor}
            onClick={requestScreenShare}
          >
            Re-enable Screen Share
          </Button>
        </div>
      )}

      {/* =========================================================================
          TOP DISTRACTION-FREE EXAM HEADER BAR
         ========================================================================= */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] sticky top-2 z-20">
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-brand-700 uppercase tracking-wider">
              Active Examination
            </span>
            {cameraActive && (
              <Badge variant="compiler" size="sm">
                Cam Live
              </Badge>
            )}
            {screenActive && (
              <Badge variant="compiler" size="sm">
                Screen Shared
              </Badge>
            )}
          </div>
          <h1 className="font-display text-sm sm:text-base font-bold text-surface-100 truncate">
            {assessment.title}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {lastAutosave && (
            <span className="font-mono text-[11px] text-surface-400 hidden md:inline">
              Autosaved at {lastAutosave}
            </span>
          )}

          <Button
            type="button"
            variant={isFullscreen ? 'secondary' : 'outline'}
            size="sm"
            leftIcon={isFullscreen ? Minimize2 : Maximize2}
            onClick={enterFullscreen}
          >
            <span className="hidden sm:inline">
              {isFullscreen ? 'Fullscreen Locked' : 'Go Fullscreen'}
            </span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={LayoutGrid}
            onClick={() => setMobilePaletteOpen(true)}
            className="lg:hidden"
          >
            {currentQuestionIndex + 1}/{assessment.questions.length}
          </Button>

          {/* Countdown Timer */}
          <div
            aria-label="Time remaining"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs sm:text-sm font-bold border tabular-nums ${
              remainingSeconds < 300
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/35 animate-pulse'
                : 'bg-elevated text-surface-100 border-surface-700'
            }`}
          >
            <Clock className="w-4 h-4 text-brand-700" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={Send}
            onClick={() => setIsConfirmSubmitOpen(true)}
          >
            Submit
          </Button>
        </div>
      </header>

      {/* Integrity Telemetry Notice Banner */}
      {integrityWarning && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-800 dark:text-amber-300"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{integrityWarning.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setIntegrityWarning(null)}
            className="text-[11px] font-semibold underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Split Examination Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Question Canvas */}
        <section className="lg:col-span-8 space-y-4">
          <Card className="p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-surface-700 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="brand" size="sm">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </Badge>
                <Badge variant="outline" size="sm">
                  {(currentQ?.type || 'mcq').toUpperCase()}
                </Badge>
                {currentQ?.topic && (
                  <Badge variant="surface" size="sm">
                    {currentQ.topic}
                  </Badge>
                )}
                <span className="font-mono text-xs text-surface-400">
                  [{currentQ?.marks || 2} {currentQ?.marks === 1 ? 'Mark' : 'Marks'}]
                </span>
              </div>

              <Button
                type="button"
                variant={flaggedQuestions.has(currentQuestionIndex) ? 'primary' : 'secondary'}
                size="sm"
                leftIcon={Flag}
                onClick={() => toggleFlagQuestion(currentQuestionIndex)}
              >
                {flaggedQuestions.has(currentQuestionIndex)
                  ? 'Marked for Review'
                  : 'Mark for Review'}
              </Button>
            </div>

            <div className="space-y-1.5">
              <p className="font-mono text-[11px] uppercase tracking-wider text-surface-400">
                {currentQ?.type === 'msq'
                  ? 'Multiple correct options allowed'
                  : currentQ?.type === 'nat'
                  ? 'Enter numerical value'
                  : 'Single correct choice'}
              </p>
              <p className="text-sm sm:text-base text-surface-100 leading-relaxed font-medium whitespace-pre-line">
                {currentQ?.questionText}
              </p>
            </div>

            {/* MCQ / MSQ Option Buttons vs NAT Numeric Input */}
            {currentQ?.type === 'nat' ? (
              <div className="p-5 rounded-xl border border-surface-700 bg-elevated/55 space-y-2.5 max-w-sm">
                <label
                  htmlFor="assessment-nat-input"
                  className="font-mono text-xs font-semibold uppercase tracking-wider text-surface-300 block"
                >
                  Numerical Answer (NAT)
                </label>
                <input
                  id="assessment-nat-input"
                  type="number"
                  step="any"
                  value={currentNatValue}
                  onChange={(e) => handleNatChange(currentQ.questionId, e.target.value)}
                  placeholder="Enter numerical value..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-auth-input border border-surface-600 text-surface-100 font-mono text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentQ?.options?.map((opt) => {
                  const optKey = opt.id || opt.optionId || '';
                  const selected = selectedOpts.includes(optKey);

                  return (
                    <button
                      key={optKey}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => handleSelectOption(currentQ, optKey)}
                      className={`w-full flex items-start gap-3.5 p-3.5 rounded-xl border text-left text-xs sm:text-sm transition-all ${
                        selected
                          ? 'bg-brand-500/10 border-brand-500 text-surface-100 font-medium shadow-[var(--shadow-card)]'
                          : 'bg-elevated/45 border-surface-700 text-surface-200 hover:border-surface-600 hover:bg-elevated'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 border flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                          currentQ?.type === 'msq' ? 'rounded-md' : 'rounded-full'
                        } ${
                          selected
                            ? 'bg-brand-500 text-white border-brand-500'
                            : 'bg-card border-surface-600 text-surface-300'
                        }`}
                      >
                        {optKey}
                      </span>
                      <span className="leading-relaxed mt-0.5 flex-1">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={currentQuestionIndex === 0}
              leftIcon={ChevronLeft}
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={currentQuestionIndex === assessment.questions.length - 1}
              rightIcon={ChevronRight}
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(assessment.questions.length - 1, prev + 1)
                )
              }
            >
              Next
            </Button>
          </div>
        </section>

        {/* Desktop Question Navigation Palette Sidebar */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-24">
          <Card className="p-5">
            <AssessmentPalette
              questions={assessment.questions}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              currentIndex={currentQuestionIndex}
              onNavigate={(idx) => setCurrentQuestionIndex(idx)}
              onRequestSubmit={() => setIsConfirmSubmitOpen(true)}
            />
          </Card>
        </aside>
      </div>

      {/* Mobile Palette Drawer */}
      <Drawer
        isOpen={mobilePaletteOpen}
        onClose={() => setMobilePaletteOpen(false)}
        title="Question Palette"
        side="right"
        maxWidth="max-w-sm"
      >
        <AssessmentPalette
          questions={assessment.questions}
          answers={answers}
          flaggedQuestions={flaggedQuestions}
          currentIndex={currentQuestionIndex}
          onNavigate={(idx) => {
            setCurrentQuestionIndex(idx);
            setMobilePaletteOpen(false);
          }}
          onRequestSubmit={() => {
            setMobilePaletteOpen(false);
            setIsConfirmSubmitOpen(true);
          }}
        />
      </Drawer>

      {/* Final Submit Confirmation Modal */}
      <Modal
        isOpen={isConfirmSubmitOpen}
        onClose={() => !isSubmitting && setIsConfirmSubmitOpen(false)}
        title="Submit Assessment?"
        description="Once finalized, your answers cannot be modified."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs sm:text-sm">
          <p className="text-surface-300">
            Confirm final submission for{' '}
            <strong className="text-surface-100">{assessment.title}</strong>:
          </p>

          <div className="bg-elevated/65 p-4 rounded-xl border border-surface-700 space-y-2.5 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-surface-400">Total Questions:</span>
              <span className="font-bold text-surface-100">{assessment.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Answered:</span>
              <span className="font-bold badge-compiler">{answeredTotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Unanswered:</span>
              <span className="font-semibold text-surface-200">
                {assessment.questions.length - answeredTotal}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Marked for Review:</span>
              <span className="font-bold text-amber-700 dark:text-amber-400">
                {flaggedQuestions.size}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmSubmitOpen(false)}
              disabled={isSubmitting}
            >
              Continue Test
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleSubmitTest(false)}
              isLoading={isSubmitting}
            >
              Confirm Submission
            </Button>
          </div>
        </div>
      </Modal>

      {/* Centered Proctoring Violation Warning Modal (3-Strike Policy) */}
      <Modal
        isOpen={showViolationModal && !isSubmitting && !submissionResult}
        onClose={() => setShowViolationModal(false)}
        title="Proctoring Rule Violation Warning"
        description="Full-screen lock and focus monitoring are strictly enforced."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-rose-500/35 bg-rose-500/10 text-xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  Warning {Math.min(violations, MAX_VIOLATION_CHANCES)} of {MAX_VIOLATION_CHANCES}
                </span>
              </div>
              <Badge variant="fault" size="sm">
                {Math.max(0, MAX_VIOLATION_CHANCES - violations)} chance
                {MAX_VIOLATION_CHANCES - violations === 1 ? '' : 's'} remaining
              </Badge>
            </div>

            <p className="text-surface-200 leading-relaxed">
              {integrityWarning?.message ||
                'Exiting full-screen mode or switching tabs/windows is prohibited during the assessment.'}
            </p>

            <p className="text-[11px] font-mono text-rose-700 dark:text-rose-300 font-semibold">
              {MAX_VIOLATION_CHANCES - violations > 0
                ? `You have ${MAX_VIOLATION_CHANCES - violations} warning${
                    MAX_VIOLATION_CHANCES - violations === 1 ? '' : 's'
                  } left. On the 4th violation, your assessment will be automatically submitted.`
                : 'Final warning! Your next violation will automatically submit your assessment and exit.'}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Maximize2}
              onClick={async () => {
                setShowViolationModal(false);
                if (!isFullscreen) {
                  await enterFullscreen();
                }
              }}
            >
              {isFullscreen ? 'Acknowledge & Resume Exam' : 'Return to Fullscreen & Resume'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AssessmentTakePage;
