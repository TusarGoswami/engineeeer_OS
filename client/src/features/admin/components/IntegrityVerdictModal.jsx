import { useState } from 'react';
import { Modal } from '../../../components/Modal.jsx';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

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
      setError(err.response?.data?.error?.message || 'Failed to submit verdict');
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* Student & Exam Metadata Card */}
        <div className="p-4 rounded-xl bg-surface-950 border border-surface-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">
              {attempt.userId?.name || 'Student Candidate'}
            </span>
            <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-mono text-[11px]">
              ⚠️ {attempt.reviewSignalsCount || 0} Review Signals
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-surface-400 text-[11px]">
            <div>Email: <span className="text-surface-200">{attempt.userId?.email}</span></div>
            <div>University: <span className="text-surface-200">{attempt.userId?.university || 'Engineering College'}</span></div>
            <div>Exam: <span className="text-surface-200">{attempt.assessmentId?.title}</span></div>
            <div>Current Score: <span className="text-brand-400 font-bold">{attempt.score} / {attempt.assessmentId?.totalMarks || 100}</span></div>
          </div>
        </div>

        {/* Telemetry Events Log */}
        <div>
          <label className="block text-surface-300 font-medium mb-1">Audit Telemetry Signals</label>
          <div className="max-h-36 overflow-y-auto rounded-xl bg-surface-950 border border-surface-800 p-2 space-y-1.5 scrollbar-thin">
            {attempt.events?.length ? (
              attempt.events.map((ev, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-surface-900/60 text-[11px]">
                  <span className="font-mono text-amber-300">
                    {ev.eventType === 'tab_hidden' && '👁️ Tab Switch / Hidden'}
                    {ev.eventType === 'window_blur' && '🪟 Window Blur (Lost Focus)'}
                    {ev.eventType === 'fullscreen_exit' && '🖥️ Fullscreen Exit'}
                    {!['tab_hidden', 'window_blur', 'fullscreen_exit'].includes(ev.eventType) && ev.eventType}
                  </span>
                  <span className="text-surface-500 flex items-center gap-1 font-mono text-[10px]">
                    <Clock className="w-3 h-3" />
                    {new Date(ev.occurredAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-surface-500 p-2 text-center">No specific event logs attached</div>
            )}
          </div>
        </div>

        {/* Faculty Moderation Decision */}
        <div className="space-y-2 pt-2 border-t border-surface-800">
          <label className="block text-surface-300 font-medium">Faculty Decision</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAction('approve')}
              className={`p-3 rounded-xl border text-center transition-all ${
                action === 'approve'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold shadow-sm'
                  : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span>Approve (Clear Flag)</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('penalize')}
              className={`p-3 rounded-xl border text-center transition-all ${
                action === 'penalize'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold shadow-sm'
                  : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <span>Deduct Penalty</span>
            </button>

            <button
              type="button"
              onClick={() => setAction('void')}
              className={`p-3 rounded-xl border text-center transition-all ${
                action === 'void'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-300 font-semibold shadow-sm'
                  : 'bg-surface-950 border-surface-800 text-surface-400 hover:text-white'
              }`}
            >
              <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <span>Void Exam (0)</span>
            </button>
          </div>
        </div>

        {action === 'penalize' && (
          <Input
            label="Marks Deduction Penalty"
            type="number"
            value={penaltyMarks}
            onChange={(e) => setPenaltyMarks(e.target.value)}
            required
          />
        )}

        <div>
          <label className="block text-surface-300 font-medium mb-1">Faculty Remarks & Reason</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cleared: student reported accidental pop-up, verified genuine answer..."
            className="w-full p-2.5 rounded-xl bg-surface-950 border border-surface-800 text-surface-200 text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Confirm Verdict
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default IntegrityVerdictModal;
