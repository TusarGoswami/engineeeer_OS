import { useState, useEffect } from 'react';
import { Award, Building2, Calendar } from 'lucide-react';
import { Modal, Button, Input } from '../../../components/index.js';

/**
 * Governance dialog for verifying alumni mentor status, company affiliation, and graduation cohort.
 */
export const VerifyAlumniModal = ({ isOpen, onClose, user, onVerify }) => {
  const [isAlumni, setIsAlumni] = useState(true);
  const [currentCompany, setCurrentCompany] = useState('');
  const [graduationYear, setGraduationYear] = useState(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setIsAlumni(user.isAlumni ?? true);
      setCurrentCompany(user.profile?.currentCompany || '');
      setGraduationYear(user.profile?.graduationYear || new Date().getFullYear());
    }
    setError('');
  }, [user, isOpen]);

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setIsSubmitting(true);
      await onVerify(user._id, {
        isAlumni: Boolean(isAlumni),
        currentCompany: currentCompany.trim(),
        graduationYear: Number(graduationYear),
      });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          'Failed to update alumni status'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Alumni & Issue Mentorship Badge"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-elevated/60 border border-surface-700 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-display font-semibold text-surface-100 text-sm">
              {user.name}
            </span>
            <span className="text-[11px] font-mono text-brand-700">
              @{user.username || 'user'}
            </span>
          </div>
          <div className="text-[11px] text-surface-400">
            {user.university || 'Engineering College'} · {user.branch || 'Engineering'}
          </div>
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer">
          <input
            type="checkbox"
            checked={isAlumni}
            onChange={(e) => setIsAlumni(e.target.checked)}
            className="mt-0.5 rounded border-amber-600/40 text-amber-600 focus:ring-amber-500"
          />
          <div>
            <span className="font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 shrink-0" />
              Verified Alumni Mentor
            </span>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-300/85 leading-relaxed block mt-0.5">
              Awards the <strong>Verified Alumni Mentor</strong> badge and enables student mentorship visibility across the Community Network.
            </span>
          </div>
        </label>

        <Input
          id="alumni-company"
          label="Current Company / Organization"
          placeholder="e.g. Google (Software Engineer II)"
          leftIcon={Building2}
          value={currentCompany}
          onChange={(e) => setCurrentCompany(e.target.value)}
        />

        <Input
          id="alumni-graduation-year"
          label="Graduation Year"
          type="number"
          placeholder="e.g. 2024"
          leftIcon={Calendar}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
        />

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-surface-700">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            leftIcon={Award}
          >
            Save &amp; Issue Badge
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VerifyAlumniModal;
