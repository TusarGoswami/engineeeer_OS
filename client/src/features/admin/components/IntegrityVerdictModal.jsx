import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Monitor,
  ShieldAlert,
} from 'lucide-react';
import { Modal, Button, Input, Badge } from '../../../components/index.js';

const EVENT_LABELS = {
  tab_hidden: { label: 'Tab Switch / Hidden', icon: Eye },
  window_blur: { label: 'Window Blur (Lost Focus)', icon: AlertTriangle },
  fullscreen_exit: { label: 'Fullscreen Exit', icon: Monitor },
};

/**
 * Staff moderation dialog for reviewing examinee proctoring events and issuing approve/penalize/void verdicts.
 */
export const IntegrityVerdictModal = ({ isOpen, onClose, attempt, onResolve }) => {
  const [action, setAction] = useState('approve');
  const [penaltyMarks, setPenaltyMarks] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!attempt) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await onResolve(attempt._id, {
        action,
        penaltyMarks: action === 'penalize' ? Number(penaltyMarks) : 0,
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to submit verdict'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Faculty Review: Student Integrity Signals"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Student & Exam Metadata Card */}
        <div className="p-4 rounded-xl bg-elevated/60 border border-surface-700 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-display font-semibold text-surface-100 text-sm">
              {attempt.userId?.name || 'Student Candidate'}
            </span>
            <Badge variant="warning" size="sm">
              <AlertTriangle className="w-3 h-3" />
              {attempt.reviewSignalsCount || 0} Review Signals
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-surface-400 text-[11px]">
            <div>
              Email: <span className="text-surface-200">{attempt.userId?.email}</span>
            </div>
            <div>
              University:{' '}
              <span className="text-surface-200">
                {attempt.userId?.university || 'Engineering College'}
              </span>
            </div>
            <div>
              Exam: <span className="text-surface-200">{attempt.assessmentId?.title}</span>
            </div>
            <div>
              Current Score:{' '}
              <span className="font-mono text-brand-700 font-bold">
                {attempt.score} / {attempt.assessmentId?.totalMarks || 100}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Events Log */}
        <div className="space-y-1.5">
          <span className="block text-surface-200 font-medium">Audit Telemetry Signals</span>
          <div className="max-h-36 overflow-y-auto rounded-xl bg-elevated/45 border border-surface-700 p-2 space-y-1.5">
            {attempt.events?.length ? (
              attempt.events.map((ev, idx) => {
                const eventMeta = EVENT_LABELS[ev.eventType] || {
                  label: ev.eventType,
                  icon: ShieldAlert,
                };
                const EventIcon = eventMeta.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-surface-700 text-[11px]"
                  >
                    <span className="font-mono text-amber-800 dark:text-amber-300 inline-flex items-center gap-1.5">
                      <EventIcon className="w-3.5 h-3.5 shrink-0" />
                      {eventMeta.label}
                    </span>
                    <span className="text-surface-400 flex items-center gap-1 font-mono text-[10px]">
                      <Clock className="w-3 h-3" />
                      {new Date(ev.occurredAt).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-surface-400 p-3 text-center">
                No specific event timestamps attached.
              </div>
            )}
          </div>
        </div>

        {/* Faculty Moderation Decision */}
        <div className="space-y-2 pt-2 border-t border-surface-700">
          <span className="block text-surface-200 font-medium">Faculty Decision</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`p-3 rounded-xl border text-center transition-colors ${
                action === 'approve'
                  ? 'bg-compiler-500/10 border-compiler-500/45 badge-compiler font-semibold'
                  : 'bg-elevated/55 border-surface-700 text-surface-300 hover:text-surface-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 badge-compiler" />
              <span>Approve (Clear Flag)</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('penalize')}
              className={`p-3 rounded-xl border text-center transition-colors ${
                action === 'penalize'
                  ? 'bg-amber-500/10 border-amber-500/45 text-amber-800 dark:text-amber-300 font-semibold'
                  : 'bg-elevated/55 border-surface-700 text-surface-300 hover:text-surface-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-700 dark:text-amber-400" />
              <span>Deduct Penalty</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('void')}
              className={`p-3 rounded-xl border text-center transition-colors ${
                action === 'void'
                  ? 'bg-rose-500/10 border-rose-500/45 text-rose-700 dark:text-rose-400 font-semibold'
                  : 'bg-elevated/55 border-surface-700 text-surface-300 hover:text-surface-100'
              }`}
            >
              <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-700 dark:text-rose-400" />
              <span>Void Exam (0)</span>
            </button>
          </div>
        </div>

        {action === 'penalize' && (
          <Input
            id="verdict-penalty"
            label="Marks Deduction Penalty"
            type="number"
            value={penaltyMarks}
            onChange={(e) => setPenaltyMarks(e.target.value)}
            required
          />
        )}

        <div className="space-y-1.5">
          <label
            htmlFor="verdict-notes"
            className="block text-[13px] font-medium text-surface-100"
          >
            Faculty Remarks &amp; Reason
          </label>
          <textarea
            id="verdict-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared: verified genuine answer or penalty applied per exam guidelines..."
            className="w-full p-2.5 rounded-lg bg-auth-input border border-surface-600 text-surface-100 placeholder:text-surface-500 text-xs focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-700">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Confirm Verdict
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrityVerdictModal;
