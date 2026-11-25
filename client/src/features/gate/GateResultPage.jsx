import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Target,
  Award,
  BookOpen,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import {
  PageHeader,
  MetricStrip,
  MetricItem,
  Card,
  Badge,
  Button,
  ProgressBar,
  Skeleton,
  EmptyState,
} from '../../components/index.js';
import { GATE_NOTES } from './gateNotesData.js';
import { GateNotesReader } from './components/GateNotesReader.jsx';

/**
 * Matches a GATE syllabus topic string against curated GATE_NOTES for revision links.
 */
function findMatchingRevisionNote(topicName = '') {
  const q = topicName.toLowerCase();
  if (!q) return null;
  return (
    GATE_NOTES.find(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        q.includes(n.title.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()))
    ) || null
  );
}

/**
 * High-stakes GATE Examination Result & Analytics view displaying official marking breakdown,
 * real topic-wise accuracy metrics, weak-area revision links, and per-question solutions.
 */
export function GateResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 'correct' | 'incorrect' | 'unattempted'
  const [selectedRevisionNote, setSelectedRevisionNote] = useState(null);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        const data = await gateService.getAttemptById(id);
        setAttempt(data);
      } catch {
        setAttempt(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [id]);

  const filteredQuestions = useMemo(() => {
    const all = attempt?.reviewQuestions || [];
    if (reviewFilter === 'all') return all;
    return all.filter((q) => {
      const answered = (q.selectedOptions?.length || 0) > 0 || (q.natAnswer !== null && q.natAnswer !== undefined);
      if (reviewFilter === 'correct') return Boolean(q.isCorrect);
      if (reviewFilter === 'incorrect') return !q.isCorrect && answered;
      if (reviewFilter === 'unattempted') return !answered;
      return true;
    });
  }, [attempt?.reviewQuestions, reviewFilter]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-4">
        <Skeleton className="h-16 w-2/3 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto my-12">
        <EmptyState
          icon={Target}
          title="Result not found"
          description="The requested GATE examination attempt could not be retrieved."
          actionLabel="Back to GATE Hub"
          onAction={() => navigate('/gate')}
        />
      </div>
    );
  }

  const testIdValue = attempt.testId?._id || attempt.testId;
  const totalQ = attempt.totalQuestions || attempt.reviewQuestions?.length || 0;
  const timeMins = Math.floor((attempt.timeTakenSeconds || 0) / 60);
  const timeSecs = (attempt.timeTakenSeconds || 0) % 60;
  const avgSecPerQ = totalQ > 0 ? Math.round((attempt.timeTakenSeconds || 0) / totalQ) : 0;

  const correctPct = totalQ > 0 ? Math.round(((attempt.correctCount || 0) / totalQ) * 100) : 0;
  const incorrectPct = totalQ > 0 ? Math.round(((attempt.incorrectCount || 0) / totalQ) * 100) : 0;
  const unattemptedPct = Math.max(0, 100 - correctPct - incorrectPct);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header & Navigation */}
      <PageHeader
        eyebrow="~/gate · Diagnostic Score Report"
        title={`${attempt.testId?.title || 'GATE CS Mock Exam'} — Result Analysis`}
        description={`Submitted on ${new Date(attempt.submittedAt).toLocaleString()} · Official GATE CS marking scheme`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={ArrowLeft}
              onClick={() => navigate('/gate')}
            >
              Back to GATE Hub
            </Button>
            {testIdValue && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                leftIcon={RotateCcw}
                onClick={() => navigate(`/gate/test/${testIdValue}`)}
              >
                Retake Exam
              </Button>
            )}
          </div>
        }
      />

      {/* Official Result Telemetry Strip */}
      <MetricStrip>
        <MetricItem
          label="Total Score"
          value={`${attempt.score}/${attempt.totalMarksAvailable}`}
          subvalue="Net marks after negative marking"
          icon={Award}
          accent="brand"
        />
        <MetricItem
          label="Accuracy Rate"
          value={`${attempt.accuracyRate}%`}
          subvalue={`${attempt.correctCount} correct of ${(attempt.correctCount || 0) + (attempt.incorrectCount || 0)} attempted`}
          icon={Target}
          accent="compiler"
        />
        <MetricItem
          label="Question Outcomes"
          value={`${attempt.correctCount} / ${totalQ}`}
          subvalue={`${attempt.incorrectCount} incorrect · ${attempt.unattemptedCount} skipped`}
          icon={CheckCircle2}
        />
        <MetricItem
          label="Time & Pacing"
          value={`${timeMins}m ${timeSecs}s`}
          subvalue={`~${avgSecPerQ}s per question`}
          icon={Clock}
        />
      </MetricStrip>

      {/* Attempt Outcome Distribution & Topic Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Question Distribution & Weak Areas */}
        <Card className="lg:col-span-5 p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-display text-base font-bold text-surface-100">
              Attempt Distribution
            </h2>

            {/* Segmented Accuracy Bar */}
            <div className="space-y-2">
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-elevated border border-surface-700">
                {correctPct > 0 && (
                  <div
                    className="h-full bg-compiler-500 transition-all"
                    style={{ width: `${correctPct}%` }}
                    title={`Correct: ${attempt.correctCount}`}
                  />
                )}
                {incorrectPct > 0 && (
                  <div
                    className="h-full bg-rose-500 transition-all"
                    style={{ width: `${incorrectPct}%` }}
                    title={`Incorrect: ${attempt.incorrectCount}`}
                  />
                )}
                {unattemptedPct > 0 && (
                  <div
                    className="h-full bg-surface-500/40 transition-all"
                    style={{ width: `${unattemptedPct}%` }}
                    title={`Unattempted: ${attempt.unattemptedCount}`}
                  />
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-compiler-500/8 border border-compiler-500/25">
                  <div className="badge-compiler font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{attempt.correctCount}</span>
                  </div>
                  <div className="text-[11px] text-surface-400 mt-0.5">Correct</div>
                </div>
                <div className="p-2.5 rounded-lg bg-rose-500/8 border border-rose-500/25">
                  <div className="text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>{attempt.incorrectCount}</span>
                  </div>
                  <div className="text-[11px] text-surface-400 mt-0.5">Incorrect</div>
                </div>
                <div className="p-2.5 rounded-lg bg-elevated/70 border border-surface-700">
                  <div className="text-surface-200 font-bold">{attempt.unattemptedCount}</div>
                  <div className="text-[11px] text-surface-400 mt-0.5">Skipped</div>
                </div>
              </div>
            </div>
          </div>

          {/* Weak Topics Diagnostic */}
          {attempt.weakTopics && attempt.weakTopics.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                <h3 className="font-display text-sm font-bold text-surface-100">
                  Weak Topics (&lt; 50% Accuracy)
                </h3>
              </div>
              <p className="text-xs text-surface-300 leading-relaxed">
                Prioritize targeted revision on these syllabus units before your next full-length mock:
              </p>
              <div className="flex flex-wrap gap-2">
                {attempt.weakTopics.map((wt) => {
                  const matchNote = findMatchingRevisionNote(wt);
                  return (
                    <div
                      key={wt}
                      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card border border-surface-700 text-xs"
                    >
                      <Badge variant="signal" size="sm">
                        #{wt}
                      </Badge>
                      {matchNote && (
                        <button
                          type="button"
                          onClick={() => setSelectedRevisionNote(matchNote)}
                          className="font-mono text-[11px] font-semibold text-brand-700 hover:underline"
                        >
                          Open Notes &rarr;
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Subject & Topic Breakdown Bars */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-brand-700" />
              <h2 className="font-display text-base font-bold text-surface-100">
                Subject &amp; Topic Performance Breakdown
              </h2>
            </div>
            <span className="font-mono text-[11px] text-surface-400">
              {attempt.topicBreakdown?.length || 0} Syllabus Topics
            </span>
          </div>

          {!attempt.topicBreakdown || attempt.topicBreakdown.length === 0 ? (
            <p className="text-xs text-surface-400 py-8 text-center">
              No topic-level metrics recorded for this exam attempt.
            </p>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {attempt.topicBreakdown.map((tb) => {
                const variant =
                  tb.accuracy >= 70 ? 'compiler' : tb.accuracy >= 50 ? 'brand' : 'fault';
                return (
                  <div
                    key={tb.topic}
                    className="p-3 rounded-xl bg-elevated/55 border border-surface-700 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-surface-100 truncate">{tb.topic}</span>
                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="text-surface-400 tabular-nums">
                          {tb.correct}/{tb.total} correct
                        </span>
                        <Badge variant={variant} size="sm">
                          {tb.accuracy}%
                        </Badge>
                      </div>
                    </div>
                    <ProgressBar value={tb.accuracy} variant={variant} size="sm" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Detailed Question & Solution Review */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-700" />
            <h2 className="font-display text-lg font-bold text-surface-100 tracking-tight">
              Question &amp; Solution Review
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: `All (${totalQ})` },
              { id: 'correct', label: `Correct (${attempt.correctCount || 0})` },
              { id: 'incorrect', label: `Incorrect (${attempt.incorrectCount || 0})` },
              { id: 'unattempted', label: `Unattempted (${attempt.unattemptedCount || 0})` },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setReviewFilter(item.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors border ${
                  reviewFilter === item.id
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'bg-card border-surface-700 text-surface-300 hover:bg-elevated hover:text-surface-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q) => {
            const origIndex = (attempt.reviewQuestions || []).findIndex(
              (rq) => rq.questionId === q.questionId
            );
            const isAnswered =
              (q.selectedOptions?.length || 0) > 0 ||
              (q.natAnswer !== null && q.natAnswer !== undefined);

            const formattedCorrect =
              q.type === 'nat'
                ? q.natRange?.min !== null && q.natRange?.min !== undefined
                  ? q.natRange?.max !== null &&
                    q.natRange?.max !== undefined &&
                    q.natRange.max !== q.natRange.min
                    ? `${q.natRange.min} – ${q.natRange.max}`
                    : `${q.natRange.min}`
                  : q.correctOptions?.[0] ?? '—'
                : q.correctOptions?.join(', ') || '—';

            return (
              <Card
                key={q.questionId}
                className={`p-5 border-l-4 space-y-4 ${
                  q.isCorrect
                    ? 'border-l-compiler-500'
                    : isAnswered
                    ? 'border-l-rose-500'
                    : 'border-l-surface-500'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-surface-100 font-mono">
                      Q{origIndex + 1}.
                    </span>
                    <Badge variant="cyan" size="sm">
                      {(q.type || 'mcq').toUpperCase()}
                    </Badge>
                    {q.topic && (
                      <Badge variant="surface" size="sm">
                        {q.topic}
                      </Badge>
                    )}
                  </div>

                  <Badge
                    variant={
                      q.isCorrect ? 'compiler' : q.negativeDeducted > 0 ? 'fault' : 'surface'
                    }
                    size="sm"
                  >
                    {q.marksAwarded > 0
                      ? `+${q.marksAwarded}`
                      : q.negativeDeducted > 0
                      ? `-${q.negativeDeducted}`
                      : '0'}{' '}
                    Marks
                  </Badge>
                </div>

                {/* Question Text */}
                <p className="text-sm text-surface-100 leading-relaxed whitespace-pre-line font-sans">
                  {q.questionText}
                </p>

                {/* Options breakdown when options exist */}
                {q.options?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt) => {
                      const optKey = opt.optionId || opt.id;
                      const picked = (q.selectedOptions || []).includes(optKey);
                      const isCorrectOpt = (q.correctOptions || []).includes(optKey);

                      let optClass = 'bg-elevated/45 border-surface-700 text-surface-300';
                      if (isCorrectOpt) {
                        optClass =
                          'bg-compiler-500/10 border-compiler-500/35 text-surface-100 font-medium';
                      } else if (picked && !isCorrectOpt) {
                        optClass =
                          'bg-rose-500/10 border-rose-500/35 text-rose-700 dark:text-rose-300';
                      }

                      return (
                        <div
                          key={optKey}
                          className={`px-3 py-2 rounded-lg border text-xs flex items-start gap-2 ${optClass}`}
                        >
                          <span className="font-mono font-bold shrink-0">{optKey}.</span>
                          <span className="flex-1">{opt.text}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Answer Comparison Strip */}
                <div className="p-3.5 rounded-xl bg-elevated/65 border border-surface-700 space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-surface-400">Your Answer:</span>
                    <strong
                      className={
                        q.isCorrect
                          ? 'badge-compiler'
                          : isAnswered
                          ? 'text-rose-700 dark:text-rose-400'
                          : 'text-surface-400 font-normal'
                      }
                    >
                      {q.type === 'nat'
                        ? q.natAnswer !== null && q.natAnswer !== undefined
                          ? q.natAnswer
                          : 'Unattempted'
                        : q.selectedOptions?.length
                        ? q.selectedOptions.join(', ')
                        : 'Unattempted'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-700">
                    <span className="text-surface-400">Official Correct Answer:</span>
                    <strong className="badge-compiler">{formattedCorrect}</strong>
                  </div>
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="pt-3 border-t border-surface-700 text-xs sm:text-sm text-surface-200 leading-relaxed font-sans">
                    <strong className="text-brand-700 block mb-1 font-mono uppercase tracking-wider text-[11px]">
                      Step-by-Step Solution Breakdown
                    </strong>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}

          {filteredQuestions.length === 0 && (
            <EmptyState
              icon={CheckCircle2}
              title={`No ${reviewFilter} questions`}
              description="Adjust the filter tabs above to review all evaluated questions."
              actionLabel="Show All Questions"
              onAction={() => setReviewFilter('all')}
            />
          )}
        </div>
      </div>

      {/* Inline Revision Reader triggered from Weak Topics */}
      {selectedRevisionNote && (
        <GateNotesReader
          note={selectedRevisionNote}
          allNotes={GATE_NOTES}
          onClose={() => setSelectedRevisionNote(null)}
          onSelectNote={setSelectedRevisionNote}
        />
      )}
    </div>
  );
}

export default GateResultPage;
