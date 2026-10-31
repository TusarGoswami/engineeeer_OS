import { useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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
    right: 'inset-y-0 right-0 animate-in slide-in-from-right duration-250',
    left: 'inset-y-0 left-0 animate-in slide-in-from-left duration-250',
    bottom: 'inset-x-0 bottom-0 max-h-[85vh] animate-in slide-in-from-bottom duration-250 rounded-t-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-950/80 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        className={cn(
          'fixed flex flex-col bg-surface-900 border-surface-800 shadow-2xl z-10 w-full overflow-hidden',
          side === 'right' && 'border-l',
          side === 'left' && 'border-r',
          side === 'bottom' && 'border-t',
          sideAnimations[side] || sideAnimations.right,
          maxWidth,
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-800">
          <div>
            {title && <h3 className="text-base font-semibold text-white">{title}</h3>}
            {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="rounded-lg p-1 text-surface-400 hover:text-white hover:bg-surface-800 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-surface-200">{children}</div>

        {/* Optional Footer */}
        {footer && (
          <div className="p-4 border-t border-surface-800 bg-surface-950/40 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Drawer;

