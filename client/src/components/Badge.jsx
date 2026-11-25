import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Compact status pill using unified theme-aware semantic accents.
 */
export const Badge = ({ children, variant = 'surface', size = 'sm', className = '' }) => {
  const variants = {
    brand:
      'bg-brand-500/10 text-brand-700 border-brand-500/25',
    success:
      'bg-compiler-500/10 badge-compiler border-compiler-500/25',
    compiler:
      'bg-compiler-500/10 text-[#0B9C72] dark:text-emerald-400 badge-compiler border-compiler-500/25',
    warning:
      'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-600/25 dark:border-amber-500/30',
    signal:
      'bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-600/25 dark:border-amber-500/30',
    danger:
      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-600/25 dark:border-rose-500/30',
    fault:
      'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-600/25 dark:border-rose-500/30',
    purple:
      'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/30',
    alumni:
      'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/30',
    cyan:
      'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-600/25 dark:border-sky-500/30',
    logic:
      'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-600/25 dark:border-sky-500/30',
    gold:
      'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-600/30 dark:border-amber-500/30',
    surface:
      'bg-elevated text-surface-200 border-surface-700',
    outline:
      'bg-transparent text-surface-300 border-surface-600',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-0.5 rounded-md font-medium',
    lg: 'text-xs px-3 py-1 rounded-lg font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border select-none tracking-tight font-mono',
        variants[variant] || variants.surface,
        sizes[size] || sizes.sm,
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
