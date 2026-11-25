import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const DropdownContext = createContext(null);

/**
 * Accessible dropdown menu supporting click-outside and Escape key dismissal.
 */
export const DropdownMenu = ({ children, open: controlledOpen, onOpenChange, className = '' }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = useCallback(
    (next) => {
      const val = typeof next === 'function' ? next(isOpen) : next;
      if (controlledOpen === undefined) {
        setInternalOpen(val);
      }
      onOpenChange?.(val);
    },
    [controlledOpen, isOpen, onOpenChange]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setOpen]);

  return (
    <DropdownContext.Provider value={{ isOpen, setOpen }}>
      <div ref={containerRef} className={cn('relative inline-flex', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger = ({ children, className = '', asChild = false, ...props }) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuTrigger must be used within DropdownMenu');

  const { isOpen, setOpen } = context;

  if (asChild && children && typeof children === 'object') {
    return children;
  }

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-haspopup="menu"
      onClick={() => setOpen((prev) => !prev)}
      className={cn(
        'inline-flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const DropdownMenuContent = ({
  children,
  align = 'right',
  width = 'w-56',
  className = '',
}) => {
  const context = useContext(DropdownContext);
  if (!context) throw new Error('DropdownMenuContent must be used within DropdownMenu');

  if (!context.isOpen) return null;

  return (
    <div
      role="menu"
      className={cn(
        'absolute top-full mt-2 z-50 rounded-xl border border-surface-700 bg-card p-1.5 shadow-[var(--shadow-elevated)] animate-in zoom-in-95',
        align === 'right' ? 'right-0' : 'left-0',
        width,
        className
      )}
    >
      {children}
    </div>
  );
};

export const DropdownMenuLabel = ({ children, className = '' }) => (
  <div className={cn('px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-surface-400', className)}>
    {children}
  </div>
);

export const DropdownMenuSeparator = ({ className = '' }) => (
  <div role="separator" className={cn('my-1 h-px bg-surface-700', className)} />
);

export const DropdownMenuItem = ({
  children,
  icon: Icon,
  shortcut,
  destructive = false,
  disabled = false,
  onSelect,
  className = '',
}) => {
  const context = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    context?.setOpen(false);
  };

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-45 disabled:cursor-not-allowed',
        destructive
          ? 'text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
          : 'text-surface-200 hover:text-surface-100 hover:bg-elevated',
        className
      )}
    >
      <span className="flex items-center gap-2 min-w-0 truncate">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="truncate">{children}</span>
      </span>
      {shortcut && <kbd className="text-[10px] font-mono text-surface-400">{shortcut}</kbd>}
    </button>
  );
};

export default DropdownMenu;

