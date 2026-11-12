import { useState, useEffect } from 'react';
import { Modal } from '../../../components/Modal.jsx';
import { Button } from '../../../components/Button.jsx';
import { Input } from '../../../components/Input.jsx';
import { Award, Building2, Calendar } from 'lucide-react';

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
      setError(err.response?.data?.error?.message || 'Failed to update alumni status');
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {error}
          </div>
        )}

        {/* User Card */}
        <div className="p-3.5 rounded-xl bg-surface-950 border border-surface-800 space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white text-sm">{user.name}</span>
            <span className="text-[11px] font-mono text-brand-400">@{user.username || 'user'}</span>
          </div>
          <div className="text-[11px] text-surface-400">
            {user.university || 'Engineering College'} • {user.branch || 'Engineering'}
          </div>
        </div>

        {/* Verification Checkbox */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 cursor-pointer">
          <input
            type="checkbox"
            checked={isAlumni}
            onChange={(e) => setIsAlumni(e.target.checked)}
            className="mt-0.5 rounded border-amber-500/40 text-amber-500 focus:ring-0"
          />
          <div>
            <span className="font-semibold text-amber-300 block">Verified Alumni Mentor</span>
            <span className="text-[11px] text-amber-400/80 leading-relaxed block mt-0.5">
              Awards the gold 🎖️ <strong>Verified Alumni Mentor</strong> badge and enables student mentorship requests in the Community Network.
            </span>
          </div>
        </label>

        <Input
          label="Current Company / Organization"
          placeholder="e.g. Google (Software Engineer II)"
          leftIcon={Building2}
          value={currentCompany}
          onChange={(e) => setCurrentCompany(e.target.value)}
        />

        <Input
          label="Graduation Year"
          type="number"
          placeholder="e.g. 2024"
          leftIcon={Calendar}
          value={graduationYear}
          onChange={(e) => setGraduationYear(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-surface-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2">
            <Award className="w-4 h-4 text-amber-300" />
            <span>Save & Issue Badge</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default VerifyAlumniModal;
