import { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Accessible modal dialog with Escape dismissal, internal scrolling on short viewports, and footer slot.
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) => {
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        className={cn(
          'relative w-full max-h-[90vh] flex flex-col rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-elevated)] z-10 animate-in zoom-in-95 overflow-hidden',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 sm:px-6 border-b border-surface-700 shrink-0">
          <div className="min-w-0">
            {title && (
              <h3 id={titleId} className="font-display text-base sm:text-lg font-semibold text-surface-100">
                {title}
              </h3>
            )}
            {description && (
              <p id={descId} className="text-xs sm:text-sm text-surface-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1.5 text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6 text-surface-100">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 sm:px-6 flex flex-wrap justify-end gap-2.5 border-t border-surface-700 bg-elevated/45 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
