import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { gateService } from '../../services/gate.service.js';
import { Card } from '../../components/Card.jsx';
import { Badge } from '../../components/Badge.jsx';
import { Button } from '../../components/Button.jsx';
import { StatCard } from '../../components/StatCard.jsx';

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
      <div className="h-[calc(100vh-12rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-surface-400">
          <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <span className="text-sm font-mono">Loading examination results and solutions...</span>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 text-center rounded-2xl border border-surface-700 bg-surface-850">
        <h2 className="text-lg font-bold text-surface-100 mb-2">Result not found</h2>
        <p className="text-xs text-surface-400 mb-6">
          The requested exam attempt could not be retrieved.
        </p>
        <Button variant="primary" onClick={() => navigate('/gate')}>
          Back to GATE Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-surface-700/80 pb-6">
        <div>
          <button
            type="button"
            onClick={() => navigate('/gate')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-surface-400 hover:text-surface-100 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to GATE Hub</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-surface-100 tracking-tight">
            {attempt.testId?.title || 'GATE CS Mock Exam'} — Result Analysis
          </h1>
          <span className="text-xs font-mono text-surface-400 mt-1 block">
            Completed on {new Date(attempt.submittedAt).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Score Hero Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Score"
          value={`${attempt.score} / ${attempt.totalMarksAvailable}`}
          subtitle="GATE Marking Algorithm Applied"
          icon={Award}
          variant="brand"
        />

        <StatCard
          title="Accuracy Rate"
          value={`${attempt.accuracyRate}%`}
          subtitle="Of attempted questions"
          icon={Target}
          variant="compiler"
        />

        <Card className="p-5 border-surface-700 bg-surface-850 flex flex-col justify-between">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">
            Question Breakdown
          </p>
          <div className="flex items-baseline gap-3 my-1">
            <span className="font-mono text-sm font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              {attempt.correctCount} Correct
            </span>
            <span className="font-mono text-sm font-bold text-rose-400 flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              {attempt.incorrectCount} Incorrect
            </span>
          </div>
          <p className="text-xs text-surface-400 font-mono">
            {attempt.unattemptedCount} Unattempted
          </p>
        </Card>

        <StatCard
          title="Time Taken"
          value={`${Math.round(attempt.timeTakenSeconds / 60)}m`}
          subtitle={`Pacing: ~${(attempt.timeTakenSeconds / (attempt.totalQuestions || 1)).toFixed(0)}s per question`}
          icon={Clock}
          variant="default"
        />
      </div>

      {/* Weak Topics Callout */}
      {attempt.weakTopics && attempt.weakTopics.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-amber-200">
              Targeted Diagnostic Recommendation
            </h3>
            <p className="text-xs text-amber-300/80 leading-relaxed">
              You scored below 50% accuracy in the following syllabus topics. Focus revision on these
              core concepts to maximize mock percentile:
            </p>
            <div className="flex gap-1.5 flex-wrap pt-1">
              {attempt.weakTopics.map((wt) => (
                <Badge key={wt} variant="signal" size="sm">
                  #{wt}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Question Review & Solutions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-100 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-500" />
            <span>Question & Solution Review</span>
          </h2>
          <span className="text-xs text-surface-400 font-mono">
            {attempt.reviewQuestions?.length || 0} Questions Evaluated
          </span>
        </div>

        <div className="space-y-4">
          {(attempt.reviewQuestions || []).map((q, idx) => {
            const isAnswered = q.selectedOptions?.length > 0 || q.natAnswer !== null;
            return (
              <Card
                key={q.questionId}
                className={`p-5 border-surface-700 bg-surface-850 border-l-4 transition-all ${
                  q.isCorrect
                    ? 'border-l-emerald-500'
                    : isAnswered
                    ? 'border-l-rose-500'
                    : 'border-l-surface-600'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-surface-100 font-mono">
                      Q{idx + 1}.
                    </span>
                    <Badge variant="cyan" size="sm" className="font-mono text-[10px]">
                      {q.type?.toUpperCase()}
                    </Badge>
                    <span className="text-xs font-mono text-surface-400">{q.topic}</span>
                  </div>
                  <div>
                    <Badge
                      variant={
                        q.isCorrect ? 'compiler' : q.negativeDeducted > 0 ? 'fault' : 'surface'
                      }
                      size="sm"
                      className="font-mono"
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
                <p className="text-sm text-surface-200 leading-relaxed whitespace-pre-line mb-4 font-sans">
                  {q.questionText}
                </p>

                {/* Answers Review Box */}
                <div className="p-3.5 rounded-xl bg-surface-950/80 border border-surface-700 space-y-2 font-mono text-xs mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-surface-400">Your Answer:</span>
                    <strong
                      className={
                        q.isCorrect
                          ? 'text-emerald-400 font-bold'
                          : isAnswered
                          ? 'text-rose-400 font-bold'
                          : 'text-surface-500 font-normal'
                      }
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
                  <div className="flex items-center justify-between pt-1 border-t border-surface-800">
                    <span className="text-surface-400">Official Correct Answer:</span>
                    <strong className="text-emerald-400 font-bold">
                      {q.type === 'nat'
                        ? `${q.natRange?.min ?? q.correctOptions?.[0]}`
                        : q.correctOptions?.join(', ')}
                    </strong>
                  </div>
                </div>

                {/* Step-by-Step Explanation */}
                {q.explanation && (
                  <div className="pt-3 border-t border-surface-700/60 text-xs text-surface-300 leading-relaxed font-sans">
                    <strong className="text-brand-400 block mb-1 font-mono uppercase tracking-wider text-[11px]">
                      Step-by-Step Solution Breakdown:
                    </strong>
                    <p className="text-surface-300">{q.explanation}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default GateResultPage;
