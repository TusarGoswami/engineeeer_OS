import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Slide-over panel supporting right, left, and bottom orientations with scroll lock.
 */
export const Drawer = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  side = 'right',
  maxWidth = 'max-w-md',
  className = '',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sideAnimations = {
    right: 'inset-y-0 right-0 animate-in slide-in-from-right',
    left: 'inset-y-0 left-0 animate-in slide-in-from-left',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] animate-in slide-in-from-bottom rounded-t-xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 dark:bg-black/65 backdrop-blur-[2px] animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={cn(
          'fixed flex flex-col bg-card border-surface-700 shadow-[var(--shadow-elevated)] z-10 w-full overflow-hidden',
          side === 'right' && 'border-l',
          side === 'left' && 'border-r',
          side === 'bottom' && 'border-t',
          sideAnimations[side] || sideAnimations.right,
          maxWidth,
          className
        )}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-surface-700 shrink-0">
          <div className="min-w-0">
            {title && <h3 className="font-display text-base font-semibold text-surface-100">{title}</h3>}
            {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg p-1.5 text-surface-400 hover:text-surface-100 hover:bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 text-surface-100">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 border-t border-surface-700 bg-elevated/45 flex flex-wrap justify-end gap-2.5 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;
