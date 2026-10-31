import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import Badge from '../../components/Badge.jsx';
import Button from '../../components/Button.jsx';
import Modal from '../../components/Modal.jsx';
import { useToast } from '../../components/Toast.jsx';

export function GateTestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Student state:
  const [answers, setAnswers] = useState({});
  const [reviewMarked, setReviewMarked] = useState(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);

  // Simple Scientific Calculator state
  const [calcInput, setCalcInput] = useState('');

  const fetchTest = async () => {
    try {
      setLoading(true);
      const data = await gateService.getTestForAttempt(id);
      setTest(data);

      // Restore saved progress from localStorage if present
      const savedAnswers = localStorage.getItem(`gate_attempt_${id}`);
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
          showToast('Restored previous saved responses', 'info');
        } catch {
          // Ignore
        }
      }

      setTimeRemaining((data.durationMinutes || 180) * 60);
    } catch {
      showToast('Failed to load GATE examination', 'error');
      navigate('/gate');
    } finally {
      setLoading(false);
    }
  };

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

  const currentQ = test?.questions?.[currentIdx];

  const updateAnswers = newAnswers => {
    setAnswers(newAnswers);
    localStorage.setItem(`gate_attempt_${id}`, JSON.stringify(newAnswers));
  };

  const handleSelectOption = optId => {
    if (!currentQ) return;
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
        ? currentOpts.filter(o => o !== optId)
        : [...currentOpts, optId];
      updateAnswers({
        ...answers,
        [qId]: { ...existing, selectedOptions: updated },
      });
    }
  };

  const handleNatChange = val => {
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

  const handleQuestionNavigate = index => {
    setCurrentIdx(index);
    setVisitedQuestions(prev => new Set(prev).add(index));
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
      localStorage.removeItem(`gate_attempt_${id}`);
      showToast('Examination submitted successfully!', 'success');
      navigate(`/gate/results/${attempt._id}`);
    } catch {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      showToast('Failed to submit exam. Please try again.', 'error');
    }
  };

  const formatTime = secs => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isQuestionAnswered = qId => {
    const a = answers[qId];
    if (!a) return false;
    return (a.selectedOptions && a.selectedOptions.length > 0) || (a.natAnswer !== null && a.natAnswer !== undefined);
  };

  // Calculator button handler
  const handleCalcPress = key => {
    if (key === 'C') {
      setCalcInput('');
    } else if (key === '=') {
      try {
        // Safe math eval with standard operators
        const sanitized = calcInput.replace(/[^0-9+\-*/.()]/g, '');
        // eslint-disable-next-line no-eval
        const result = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(result));
      } catch {
        setCalcInput('Error');
      }
    } else if (key === 'sqrt') {
      try {
        const val = parseFloat(calcInput);
        setCalcInput(String(Math.sqrt(val)));
      } catch {
        setCalcInput('Error');
      }
    } else {
      setCalcInput(prev => (prev === 'Error' ? key : prev + key));
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm">Loading GATE examination environment...</span>
        </div>
      </div>
    );
  }

  if (!test) return null;

  const totalQuestions = test.questions.length;
  const answeredCount = Object.keys(answers).filter(qId => isQuestionAnswered(qId)).length;
  const reviewCount = reviewMarked.size;

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3 pb-2 max-w-7xl mx-auto w-full">
      {/* Top Test Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl border border-surface-800 bg-surface-900/60 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
              {test.title}
            </h2>
            <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
              {test.subject}
            </Badge>
          </div>
          <span className="text-xs text-surface-400">
            {answeredCount}/{totalQuestions} Answered • {reviewCount} Marked for Review
          </span>
        </div>

        {/* Timer, Calculator, Submit */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowCalcModal(true)}
            leftIcon={Calculator}
            className="text-xs"
          >
            Virtual Calculator
          </Button>

          <div
            className={`font-mono text-sm sm:text-base font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
              timeRemaining < 300
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                : 'bg-surface-950 text-cyan-300 border-surface-700'
            }`}
          >
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            leftIcon={Send}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Examination Split Screen */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        {/* Left Column: Active Question */}
        <div className="lg:col-span-8 flex flex-col justify-between p-6 rounded-2xl border border-surface-800 bg-surface-900/70 overflow-y-auto space-y-6 shadow-xl">
          {currentQ && (
            <div className="space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between border-b border-surface-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-white">
                    Question {currentIdx + 1}
                  </span>
                  <Badge variant="brand" size="sm" className="font-mono text-[10px]">
                    {currentQ.type.toUpperCase()}
                  </Badge>
                  <span className="text-xs text-surface-400 font-mono">
                    [{currentQ.marks || 1} Mark{currentQ.marks > 1 ? 's' : ''}
                    {currentQ.negativeMarks > 0 ? `, -${currentQ.negativeMarks} Neg` : ''}]
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={reviewMarked.has(currentQ.questionId) ? 'warning' : 'ghost'}
                  onClick={toggleReviewMark}
                  leftIcon={reviewMarked.has(currentQ.questionId) ? BookmarkCheck : Bookmark}
                  className="text-xs"
                >
                  {reviewMarked.has(currentQ.questionId) ? 'Marked' : 'Mark for Review'}
                </Button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base text-surface-100 leading-relaxed font-sans">
                {currentQ.text}
              </div>

              {/* MCQ / MSQ Options */}
              {(currentQ.type === 'mcq' || currentQ.type === 'msq') && (
                <div className="space-y-3 pt-2">
                  {currentQ.options?.map(opt => {
                    const isSelected = (
                      answers[currentQ.questionId]?.selectedOptions || []
                    ).includes(opt.optionId);

                    return (
                      <div
                        key={opt.optionId}
                        onClick={() => handleSelectOption(opt.optionId)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500/10 text-white shadow-md'
                            : 'border-surface-800 bg-surface-950/60 hover:bg-surface-800/60 text-surface-200'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-${
                            currentQ.type === 'mcq' ? 'full' : 'md'
                          } border flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                            isSelected
                              ? 'border-brand-500 bg-brand-600 text-white'
                              : 'border-surface-700 bg-surface-900 text-surface-400'
                          }`}
                        >
                          {opt.optionId.toUpperCase()}
                        </div>
                        <div className="text-sm leading-relaxed">{opt.text}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* NAT Numerical Input */}
              {currentQ.type === 'nat' && (
                <div className="p-5 rounded-xl border border-surface-800 bg-surface-950/70 space-y-3 max-w-sm">
                  <label className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                    Numerical Answer:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={
                      answers[currentQ.questionId]?.natAnswer !== null &&
                      answers[currentQ.questionId]?.natAnswer !== undefined
                        ? answers[currentQ.questionId].natAnswer
                        : ''
                    }
                    onChange={e => handleNatChange(e.target.value)}
                    placeholder="Enter numerical value..."
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700 text-white font-mono text-sm focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[11px] text-surface-500">
                    Calculated values should conform to standard rounding rules.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Question Footer Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-800/80">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleClearResponse}
              leftIcon={RotateCcw}
              disabled={!isQuestionAnswered(currentQ?.questionId)}
              className="text-xs text-surface-400 hover:text-surface-200"
            >
              Clear Response
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleQuestionNavigate(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                leftIcon={ArrowLeft}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  handleQuestionNavigate(Math.min(totalQuestions - 1, currentIdx + 1))
                }
                disabled={currentIdx === totalQuestions - 1}
                rightIcon={ArrowRight}
              >
                Save & Next
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: GATE Official Question Palette */}
        <div className="lg:col-span-4 flex flex-col justify-between p-5 rounded-2xl border border-surface-800 bg-surface-900/60 overflow-hidden shadow-xl space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-surface-300 mb-3">
              Question Palette
            </h3>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-surface-400 font-mono mb-4 p-2.5 rounded-xl bg-surface-950/70 border border-surface-800">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Marked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-700" />
                <span>Visited</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-900 border border-surface-800" />
                <span>Not Visited</span>
              </div>
            </div>

            {/* Question Matrix */}
            <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {test.questions.map((q, idx) => {
                const isAnswered = isQuestionAnswered(q.questionId);
                const isMarked = reviewMarked.has(q.questionId);
                const isCurrent = idx === currentIdx;
                const isVisited = visitedQuestions.has(idx);

                let btnClass = 'bg-surface-950 text-surface-400 border border-surface-800';
                if (isCurrent) {
                  btnClass = 'ring-2 ring-brand-400 text-white font-bold bg-brand-600/30';
                } else if (isMarked) {
                  btnClass = 'bg-amber-500 text-white font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-emerald-500 text-white font-bold';
                } else if (isVisited) {
                  btnClass = 'bg-surface-800 text-surface-200';
                }

                return (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => handleQuestionNavigate(idx)}
                    className={`h-9 rounded-lg font-mono text-xs flex items-center justify-center transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-surface-800">
            <Button
              variant="danger"
              size="sm"
              className="w-full justify-center"
              onClick={() => setShowConfirmModal(true)}
            >
              Submit Full Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit GATE Examination?"
        description="Are you sure you want to finish and submit your attempt for official evaluation?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-surface-400">Total Questions:</span>
              <span className="text-white font-bold">{totalQuestions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Answered:</span>
              <span className="text-emerald-400 font-bold">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Marked for Review:</span>
              <span className="text-amber-400 font-bold">{reviewCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-400">Time Remaining:</span>
              <span className="text-cyan-400 font-bold">{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Resume Test
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleSubmitTest}
              isLoading={isSubmitting}
            >
              Confirm & Submit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Virtual Scientific Calculator Modal */}
      <Modal
        isOpen={showCalcModal}
        onClose={() => setShowCalcModal(false)}
        title="GATE Virtual Scientific Calculator"
        description="Official-style numeric evaluation keypad"
        size="sm"
      >
        <div className="space-y-3 font-mono">
          <div className="p-3 rounded-xl bg-surface-950 border border-surface-800 text-right text-lg text-emerald-400 font-bold overflow-x-auto min-h-12 flex items-center justify-end px-4">
            {calcInput || '0'}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {['C', '(', ')', '/', '7', '8', '9', '*', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', 'sqrt', '='].map(
              key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCalcPress(key)}
                  className={`h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-colors ${
                    key === '='
                      ? 'bg-brand-600 hover:bg-brand-500 text-white'
                      : key === 'C'
                      ? 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                      : 'bg-surface-800 hover:bg-surface-700 text-surface-200'
                  }`}
                >
                  {key}
                </button>
              )
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default GateTestPage;
