import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  Calculator,
  Bookmark,
  BookmarkCheck,
  RotateCcw,
  Send,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Shield,
  ShieldAlert,
  AlertTriangle,
  LayoutGrid,
  Delete,
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import { Badge, Button, Modal, Drawer, useToast } from '../../components/index.js';

/**
 * Pure deterministic recursive-descent arithmetic evaluator for the Virtual Scientific Calculator.
 * Supports +, -, *, /, unary sign, and nested parentheses without dynamic eval.
 */
function evaluateArithmeticExpression(expr) {
  const cleaned = (expr || '').replace(/\s+/g, '');
  if (!cleaned || !/^[0-9+\-*/().]+$/.test(cleaned)) {
    throw new Error('Invalid characters');
  }

  let pos = 0;

  const parseExpression = () => {
    let left = parseTerm();
    while (pos < cleaned.length && (cleaned[pos] === '+' || cleaned[pos] === '-')) {
      const op = cleaned[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = () => {
    let left = parseFactor();
    while (pos < cleaned.length && (cleaned[pos] === '*' || cleaned[pos] === '/')) {
      const op = cleaned[pos++];
      const right = parseFactor();
      if (op === '/') {
        if (right === 0) throw new Error('Division by zero');
        left /= right;
      } else {
        left *= right;
      }
    }
    return left;
  };

  const parseFactor = () => {
    if (cleaned[pos] === '+') {
      pos++;
      return parseFactor();
    }
    if (cleaned[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    if (cleaned[pos] === '(') {
      pos++;
      const val = parseExpression();
      if (cleaned[pos] !== ')') throw new Error('Mismatched parenthesis');
      pos++;
      return val;
    }
    const start = pos;
    let dotCount = 0;
    while (pos < cleaned.length && ((cleaned[pos] >= '0' && cleaned[pos] <= '9') || cleaned[pos] === '.')) {
      if (cleaned[pos] === '.') dotCount++;
      pos++;
    }
    if (pos === start || dotCount > 1) {
      throw new Error('Invalid number');
    }
    return Number(cleaned.slice(start, pos));
  };

  const result = parseExpression();
  if (pos !== cleaned.length || !Number.isFinite(result)) {
    throw new Error('Invalid expression');
  }
  return Math.round(result * 1e9) / 1e9;
}

/**
 * Formats seconds cleanly into HH:MM:SS display.
 */
function formatTime(secs) {
  const safe = Math.max(0, secs);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Shared GATE CBT Question Matrix Legend & Palette grid (used in both desktop sidebar & mobile drawer).
 */
function QuestionPaletteContent({
  questions = [],
  reviewMarked,
  visitedQuestions,
  currentIdx,
  isQuestionAnswered,
  onNavigate,
  onOpenSubmit,
}) {
  const answeredCount = questions.filter((q) => isQuestionAnswered(q.questionId)).length;
  const markedCount = reviewMarked.size;
  const notVisitedCount = Math.max(0, questions.length - visitedQuestions.size);

  return (
    <div className="flex flex-col justify-between h-full gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-surface-300">
            Question Palette
          </h3>
          <span className="font-mono text-[11px] text-surface-400 tabular-nums">
            {answeredCount}/{questions.length} Solved
          </span>
        </div>

        {/* Status Legend with live counts */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-mono p-3 rounded-xl bg-elevated/70 border border-surface-700 text-surface-300">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-compiler-500 shrink-0" />
              <span>Answered</span>
            </span>
            <strong className="text-surface-100 tabular-nums">{answeredCount}</strong>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" />
              <span>Marked</span>
            </span>
            <strong className="text-surface-100 tabular-nums">{markedCount}</strong>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-surface-500 shrink-0" />
              <span>Visited</span>
            </span>
            <strong className="text-surface-100 tabular-nums">
              {Math.max(0, visitedQuestions.size - answeredCount)}
            </strong>
          </div>
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-card border border-surface-600 shrink-0" />
              <span>Unseen</span>
            </span>
            <strong className="text-surface-100 tabular-nums">{notVisitedCount}</strong>
          </div>
        </div>

        {/* Question Matrix */}
        <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
          {questions.map((q, idx) => {
            const answered = isQuestionAnswered(q.questionId);
            const marked = reviewMarked.has(q.questionId);
            const isCurrent = idx === currentIdx;
            const visited = visitedQuestions.has(idx);

            let btnClass =
              'bg-card text-surface-300 border border-surface-700 hover:border-surface-600';
            if (isCurrent) {
              btnClass =
                'ring-2 ring-brand-500 bg-brand-500/15 border-brand-500 text-brand-700 font-bold';
            } else if (marked) {
              btnClass =
                'bg-amber-500 text-white border-amber-500 font-semibold';
            } else if (answered) {
              btnClass =
                'bg-compiler-500 text-white border-compiler-500 font-semibold';
            } else if (visited) {
              btnClass =
                'bg-elevated text-surface-200 border-surface-600';
            }

            return (
              <button
                key={q.questionId}
                type="button"
                aria-label={`Question ${idx + 1}`}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onNavigate(idx)}
                className={`h-9 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${btnClass}`}
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
          variant="danger"
          size="sm"
          className="w-full justify-center"
          leftIcon={Send}
          onClick={onOpenSubmit}
        >
          Submit Full Exam
        </Button>
      </div>
    </div>
  );
}

/**
 * High-stakes distraction-free GATE CBT active examination workspace.
 * Preserves live countdown timer, fullscreen proctoring listeners, localStorage answer recovery,
 * Virtual Scientific Calculator, MCQ/MSQ/NAT controls, and score submission.
 */
export function GateTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState(false);

  // Fullscreen & Anti-Cheat Proctoring states
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [violations, setViolations] = useState(0);
  const [violationNotice, setViolationNotice] = useState(null);

  // Scientific Calculator input state
  const [calcInput, setCalcInput] = useState('');

  // Latest mutable refs so countdown auto-submit never closes over stale answers/time
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const timeRemainingRef = useRef(timeRemaining);
  timeRemainingRef.current = timeRemaining;
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        hasSubmittedRef.current = false;
        const data = await gateService.getTestForAttempt(id);
        setTest(data);

        const savedAnswers = localStorage.getItem(`gate_attempt_${id}`);
        if (savedAnswers) {
          try {
            const parsed = JSON.parse(savedAnswers);
            setAnswers(parsed);
            answersRef.current = parsed;
            showToast('Restored previous saved responses', 'info');
          } catch {
            // Ignore invalid stored draft
          }
        }

        const initialSeconds = (data.durationMinutes || 180) * 60;
        setTimeRemaining(initialSeconds);
        timeRemainingRef.current = initialSeconds;
      } catch {
        showToast('Failed to load GATE examination', 'error');
        navigate('/gate');
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [id, navigate, showToast]);

  const enterFullscreen = async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
      setIsFullscreen(true);
      setShowFullscreenPrompt(false);
      showToast('CBT Fullscreen Mode Activated', 'success');
    } catch {
      showToast('Please allow fullscreen mode for exam integrity', 'warning');
      setShowFullscreenPrompt(false);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    } catch {
      // Ignore fullscreen exit failure
    }
  };

  // Anti-cheat proctoring event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(active);
      if (!active && !isSubmitting && test) {
        setViolations((v) => v + 1);
        setViolationNotice({
          type: 'fullscreen_exit',
          message:
            'Fullscreen exit detected. Please return to fullscreen mode immediately to avoid integrity penalties.',
          time: new Date().toLocaleTimeString(),
        });
        showToast('Integrity Alert: Exited Fullscreen Mode', 'warning');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmitting && test) {
        setViolations((v) => v + 1);
        setViolationNotice({
          type: 'tab_switch',
          message:
            'Tab switch / backgrounding detected. Focus must remain strictly on the examination window.',
          time: new Date().toLocaleTimeString(),
        });
        showToast('Integrity Alert: Tab Switch Detected', 'warning');
      }
    };

    const handleWindowBlur = () => {
      if (!isSubmitting && test) {
        setViolations((v) => v + 1);
        setViolationNotice({
          type: 'window_blur',
          message: 'Window focus lost. Focus outside examination window detected.',
          time: new Date().toLocaleTimeString(),
        });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [test, isSubmitting, showToast]);

  const handleSubmitTest = useCallback(async () => {
    if (!test || hasSubmittedRef.current) return;
    try {
      hasSubmittedRef.current = true;
      setIsSubmitting(true);
      const formattedAnswers = Object.entries(answersRef.current).map(([qId, val]) => ({
        questionId: qId,
        selectedOptions: val.selectedOptions || [],
        natAnswer: val.natAnswer !== undefined ? val.natAnswer : null,
      }));

      const totalTimeSeconds = (test.durationMinutes || 180) * 60;
      const timeTaken = Math.max(1, totalTimeSeconds - timeRemainingRef.current);

      const attempt = await gateService.submitAttempt(test._id, formattedAnswers, timeTaken);
      localStorage.removeItem(`gate_attempt_${id}`);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      showToast('Examination submitted successfully!', 'success');
      navigate(`/gate/results/${attempt._id}`);
    } catch {
      hasSubmittedRef.current = false;
      setIsSubmitting(false);
      setShowConfirmModal(false);
      showToast('Failed to submit exam. Please try again.', 'error');
    }
  }, [test, id, navigate, showToast]);

  const handleSubmitRef = useRef(handleSubmitTest);
  handleSubmitRef.current = handleSubmitTest;

  // Single stable countdown interval anchored to active exam session
  const timerActive = !loading && Boolean(test) && !isSubmitting && timeRemaining > 0;
  useEffect(() => {
    if (!timerActive) return undefined;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          timeRemainingRef.current = 0;
          handleSubmitRef.current();
          return 0;
        }
        const next = prev - 1;
        timeRemainingRef.current = next;
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  const currentQ = test?.questions?.[currentIdx];
  const totalQuestions = test?.questions?.length || 0;

  const updateAnswers = (newAnswers) => {
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
    localStorage.setItem(`gate_attempt_${id}`, JSON.stringify(newAnswers));
  };

  const handleSelectOption = (optId) => {
    if (!currentQ || !optId) return;
    const qId = currentQ.questionId;
    const existing = answers[qId] || { selectedOptions: [], natAnswer: null };

    if (currentQ.type === 'mcq') {
      updateAnswers({
        ...answers,
        [qId]: { ...existing, selectedOptions: [optId] },
      });
    } else if (currentQ.type === 'msq') {
      const currentOpts = existing.selectedOptions || [];
      const updated = currentOpts.includes(optId)
        ? currentOpts.filter((o) => o !== optId)
        : [...currentOpts, optId];
      updateAnswers({
        ...answers,
        [qId]: { ...existing, selectedOptions: updated },
      });
    }
  };

  const handleNatChange = (val) => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const existing = answers[qId] || { selectedOptions: [], natAnswer: null };
    updateAnswers({
      ...answers,
      [qId]: { ...existing, natAnswer: val === '' ? null : Number(val) },
    });
  };

  const handleClearResponse = () => {
    if (!currentQ) return;
    const qId = currentQ.questionId;
    const copy = { ...answers };
    delete copy[qId];
    updateAnswers(copy);
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

  const handleQuestionNavigate = (index) => {
    if (index < 0 || index >= totalQuestions) return;
    setCurrentIdx(index);
    setVisitedQuestions((prev) => new Set(prev).add(index));
    setMobilePaletteOpen(false);
  };

  const handleMarkAndNext = () => {
    if (currentQ && !reviewMarked.has(currentQ.questionId)) {
      const copy = new Set(reviewMarked);
      copy.add(currentQ.questionId);
      setReviewMarked(copy);
    }
    if (currentIdx < totalQuestions - 1) {
      handleQuestionNavigate(currentIdx + 1);
    }
  };

  const isQuestionAnswered = (qId) => {
    const a = answers[qId];
    if (!a) return false;
    return (
      (a.selectedOptions && a.selectedOptions.length > 0) ||
      (a.natAnswer !== null && a.natAnswer !== undefined && !Number.isNaN(a.natAnswer))
    );
  };

  // Virtual Scientific Calculator keypress handler
  const handleCalcPress = (key) => {
    if (key === 'C') {
      setCalcInput('');
    } else if (key === 'DEL') {
      setCalcInput((prev) => (prev === 'Error' ? '' : prev.slice(0, -1)));
    } else if (key === '=') {
      try {
        const result = evaluateArithmeticExpression(calcInput);
        setCalcInput(String(result));
      } catch {
        setCalcInput('Error');
      }
    } else if (key === 'sqrt') {
      try {
        const base = evaluateArithmeticExpression(calcInput || '0');
        if (base < 0) throw new Error('Negative');
        setCalcInput(String(Math.round(Math.sqrt(base) * 1e9) / 1e9));
      } catch {
        setCalcInput('Error');
      }
    } else if (key === 'x²') {
      try {
        const base = evaluateArithmeticExpression(calcInput || '0');
        setCalcInput(String(Math.round(base * base * 1e9) / 1e9));
      } catch {
        setCalcInput('Error');
      }
    } else if (key === '1/x') {
      try {
        const base = evaluateArithmeticExpression(calcInput || '0');
        if (base === 0) throw new Error('Divide by zero');
        setCalcInput(String(Math.round((1 / base) * 1e9) / 1e9));
      } catch {
        setCalcInput('Error');
      }
    } else {
      setCalcInput((prev) => (prev === 'Error' ? key : prev + key));
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Initializing GATE CBT examination workspace...</span>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const answeredCount = test.questions.filter((q) => isQuestionAnswered(q.questionId)).length;
  const reviewCount = reviewMarked.size;

  const questionStatement = currentQ?.questionText || currentQ?.text || '';
  const questionTypeHint =
    currentQ?.type === 'mcq'
      ? 'Single correct option'
      : currentQ?.type === 'msq'
      ? 'Select all correct options'
      : 'Enter exact numeric value';

  return (
    <div className="flex flex-col min-h-[calc(100vh-7.5rem)] lg:h-[calc(100vh-6rem)] space-y-3 pb-2 max-w-7xl mx-auto w-full">
      {/* Top CBT Exam Control Bar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display text-sm sm:text-base font-bold text-surface-100 tracking-tight truncate">
              {test.title}
            </h1>
            {test.subject && (
              <Badge variant="cyan" size="sm">
                {test.subject}
              </Badge>
            )}
          </div>
          <p className="text-xs font-mono text-surface-400 mt-0.5 tabular-nums">
            {answeredCount}/{totalQuestions} Answered · {reviewCount} Marked for Review
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Proctoring Integrity Indicator */}
          <Badge
            variant={violations === 0 ? 'compiler' : 'fault'}
            size="sm"
            className="hidden md:inline-flex"
          >
            {violations === 0 ? (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>Proctored</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {violations} Violation{violations > 1 ? 's' : ''}
                </span>
              </>
            )}
          </Badge>

          {/* Fullscreen CBT Toggle */}
          <Button
            type="button"
            size="sm"
            variant={isFullscreen ? 'secondary' : 'outline'}
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            leftIcon={isFullscreen ? Minimize2 : Maximize2}
            title={
              isFullscreen
                ? 'Exit Fullscreen'
                : 'Enter Fullscreen (Simulate CBT & Prevent Tab Switch)'
            }
          >
            <span className="hidden sm:inline">
              {isFullscreen ? 'Fullscreen' : 'Go Fullscreen'}
            </span>
          </Button>

          {/* Virtual Scientific Calculator (accessible across all viewports) */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setShowCalcModal(true)}
            leftIcon={Calculator}
            aria-label="Open scientific calculator"
          >
            <span className="hidden sm:inline">Calculator</span>
          </Button>

          {/* Mobile Question Palette Toggle */}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setMobilePaletteOpen(true)}
            leftIcon={LayoutGrid}
            className="lg:hidden"
          >
            {currentIdx + 1}/{totalQuestions}
          </Button>

          {/* Monospace Countdown Timer */}
          <div
            aria-label="Time remaining"
            className={`font-mono text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 tabular-nums ${
              timeRemaining < 300
                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/35 animate-pulse'
                : 'bg-elevated text-surface-100 border-surface-700'
            }`}
          >
            <Clock
              className={`w-4 h-4 ${
                timeRemaining < 300
                  ? 'text-rose-700 dark:text-rose-400'
                  : 'text-brand-700'
              }`}
            />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            leftIcon={Send}
          >
            Submit
          </Button>
        </div>
      </header>

      {/* Anti-Cheat Integrity Notice */}
      {violationNotice && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl border border-rose-500/35 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-xs font-mono shrink-0"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <strong>
                Security Warning ({violations} incident{violations > 1 ? 's' : ''} logged):
              </strong>{' '}
              <span>{violationNotice.message}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isFullscreen && (
              <Button type="button" size="sm" variant="danger" onClick={enterFullscreen}>
                Return to Fullscreen
              </Button>
            )}
            <button
              type="button"
              onClick={() => setViolationNotice(null)}
              aria-label="Dismiss security warning"
              className="px-2 py-1 rounded hover:bg-rose-500/15 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Focused Examination Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Active Question Workspace */}
        <section className="lg:col-span-8 flex flex-col justify-between p-5 sm:p-6 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-y-auto gap-6">
          {currentQ && (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-700 pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base sm:text-lg font-bold text-surface-100">
                    Question {currentIdx + 1}
                  </span>
                  <Badge variant="brand" size="sm">
                    {(currentQ.type || 'mcq').toUpperCase()}
                  </Badge>
                  {currentQ.topic && (
                    <Badge variant="surface" size="sm">
                      {currentQ.topic}
                    </Badge>
                  )}
                  <span className="text-xs font-mono text-surface-400">
                    [+{currentQ.marks || 1} Mark{currentQ.marks > 1 ? 's' : ''}
                    {currentQ.type === 'mcq' && currentQ.negativeMarks > 0
                      ? `, -${currentQ.negativeMarks} Neg`
                      : ', No Negative'}
                    ]
                  </span>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant={reviewMarked.has(currentQ.questionId) ? 'primary' : 'secondary'}
                  onClick={toggleReviewMark}
                  leftIcon={reviewMarked.has(currentQ.questionId) ? BookmarkCheck : Bookmark}
                >
                  {reviewMarked.has(currentQ.questionId) ? 'Marked for Review' : 'Mark for Review'}
                </Button>
              </div>

              <div className="space-y-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-surface-400">
                  {questionTypeHint}
                </p>
                <div className="text-sm sm:text-base text-surface-100 leading-relaxed font-sans whitespace-pre-line">
                  {questionStatement}
                </div>
              </div>

              {/* MCQ / MSQ Option Buttons */}
              {(currentQ.type === 'mcq' || currentQ.type === 'msq') && (
                <div className="space-y-2.5 pt-1">
                  {currentQ.options?.map((opt) => {
                    const optKey = opt.optionId || opt.id || '';
                    const isSelected = (
                      answers[currentQ.questionId]?.selectedOptions || []
                    ).includes(optKey);

                    return (
                      <button
                        key={optKey}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => handleSelectOption(optKey)}
                        className={`w-full text-left flex items-start gap-3.5 p-3.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-surface-100 shadow-[var(--shadow-card)] font-medium'
                            : 'border-surface-700 bg-elevated/45 hover:bg-elevated hover:border-surface-600 text-surface-200'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 border flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                            currentQ.type === 'mcq' ? 'rounded-full' : 'rounded-md'
                          } ${
                            isSelected
                              ? 'border-brand-500 bg-brand-500 text-white'
                              : 'border-surface-600 bg-card text-surface-300'
                          }`}
                        >
                          {optKey.toUpperCase()}
                        </span>
                        <span className="text-sm leading-relaxed flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* NAT Numerical Input */}
              {currentQ.type === 'nat' && (
                <div className="p-5 rounded-xl border border-surface-700 bg-elevated/55 space-y-2.5 max-w-sm">
                  <label
                    htmlFor="nat-answer-input"
                    className="font-mono text-xs font-semibold uppercase tracking-wider text-surface-300 block"
                  >
                    Numerical Answer (NAT)
                  </label>
                  <input
                    id="nat-answer-input"
                    type="number"
                    step="any"
                    value={
                      answers[currentQ.questionId]?.natAnswer !== null &&
                      answers[currentQ.questionId]?.natAnswer !== undefined
                        ? answers[currentQ.questionId].natAnswer
                        : ''
                    }
                    onChange={(e) => handleNatChange(e.target.value)}
                    placeholder="Enter numerical value..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-auth-input border border-surface-600 text-surface-100 font-mono text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
                  />
                  <p className="text-[11px] text-surface-400">
                    No negative marking applies to NAT questions.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Question Footer Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-surface-700">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClearResponse}
                leftIcon={RotateCcw}
                disabled={!isQuestionAnswered(currentQ?.questionId)}
              >
                Clear Response
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={handleMarkAndNext}
                disabled={currentIdx >= totalQuestions - 1}
              >
                Mark &amp; Next
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleQuestionNavigate(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                leftIcon={ArrowLeft}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="primary"
                onClick={() =>
                  handleQuestionNavigate(Math.min(totalQuestions - 1, currentIdx + 1))
                }
                disabled={currentIdx >= totalQuestions - 1}
                rightIcon={ArrowRight}
              >
                Save &amp; Next
              </Button>
            </div>
          </div>
        </section>

        {/* Right Column: Official CBT Question Palette */}
        <aside className="hidden lg:flex lg:col-span-4 flex-col p-5 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-hidden">
          <QuestionPaletteContent
            questions={test.questions}
            reviewMarked={reviewMarked}
            visitedQuestions={visitedQuestions}
            currentIdx={currentIdx}
            isQuestionAnswered={isQuestionAnswered}
            onNavigate={handleQuestionNavigate}
            onOpenSubmit={() => setShowConfirmModal(true)}
          />
        </aside>
      </div>

      {/* Mobile / Tablet Question Palette Drawer */}
      <Drawer
        isOpen={mobilePaletteOpen}
        onClose={() => setMobilePaletteOpen(false)}
        title="Question Palette"
        side="right"
        maxWidth="max-w-sm"
      >
        <QuestionPaletteContent
          questions={test.questions}
          reviewMarked={reviewMarked}
          visitedQuestions={visitedQuestions}
          currentIdx={currentIdx}
          isQuestionAnswered={isQuestionAnswered}
          onNavigate={handleQuestionNavigate}
          onOpenSubmit={() => {
            setMobilePaletteOpen(false);
            setShowConfirmModal(true);
          }}
        />
      </Drawer>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !isSubmitting && setShowConfirmModal(false)}
        title="Submit GATE Examination?"
        description="Confirm your attempt details before finalizing official evaluation."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-elevated/65 border border-surface-700 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-surface-400">Total Questions:</span>
              <span className="text-surface-100 font-bold">{totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Answered:</span>
              <span className="badge-compiler font-bold">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Unattempted:</span>
              <span className="text-surface-200 font-semibold">
                {totalQuestions - answeredCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Marked for Review:</span>
              <span className="text-amber-700 dark:text-amber-400 font-bold">{reviewCount}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-surface-700">
              <span className="text-surface-400">Time Remaining:</span>
              <span className="text-brand-700 font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Resume Test
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleSubmitTest}
              isLoading={isSubmitting}
            >
              Confirm &amp; Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Virtual Scientific Calculator Modal */}
      <Modal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        title="GATE Virtual Scientific Calculator"
        description="Standard arithmetic evaluation keypad"
        maxWidth="max-w-sm"
      >
        <div className="space-y-3 font-mono">
          <div
            data-testid="gate-calc-display"
            className="p-3.5 rounded-xl bg-elevated border border-surface-700 text-right text-lg text-surface-100 font-bold overflow-x-auto min-h-[3.25rem] flex items-center justify-end tabular-nums"
          >
            {calcInput || '0'}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              'C', 'DEL', '(', ')',
              'sqrt', 'x²', '1/x', '/',
              '7', '8', '9', '*',
              '4', '5', '6', '-',
              '1', '2', '3', '+',
              '0', '.', '=',
            ].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCalcPress(key)}
                className={`h-10 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition-colors border ${
                  key === '='
                    ? 'col-span-2 bg-brand-500 hover:bg-brand-600 border-brand-500 text-white'
                    : key === 'C'
                    ? 'bg-rose-500/12 text-rose-700 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/20'
                    : key === 'DEL'
                    ? 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/20'
                    : 'bg-card hover:bg-elevated border-surface-700 text-surface-100'
                }`}
              >
                {key === 'DEL' ? <Delete className="w-4 h-4" /> : key}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* CBT Fullscreen & Integrity Prompt Modal */}
      <Modal
        isOpen={showFullscreenPrompt && !isFullscreen}
        onClose={() => setShowFullscreenPrompt(false)}
        title="GATE CBT Mode & Integrity Guidelines"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-brand-500/30 bg-brand-500/8 text-surface-200 text-xs leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-semibold text-brand-700">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Standard IIT GATE Examination Environment</span>
            </div>
            <p className="text-surface-300">
              To replicate authentic Computer-Based Test (CBT) conditions, this exam supports
              fullscreen mode with focus monitoring.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-surface-300">
              <li>Exiting fullscreen or switching browser tabs logs an integrity incident.</li>
              <li>Your responses auto-save locally after every selection.</li>
              <li>Use the Virtual Calculator in the top control bar at any time.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowFullscreenPrompt(false)}
            >
              Stay Windowed
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={Maximize2}
              onClick={enterFullscreen}
            >
              Enter Fullscreen CBT Mode
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default GateTestPage;
