import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Badge = ({ children, variant = 'surface', size = 'sm', className = '' }) => {
  const variants = {
    brand: 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400 border-brand-500/25 dark:border-brand-500/30',
    success: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/25 dark:border-emerald-500/30',
    compiler: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-600/25 dark:border-emerald-500/30',
    warning: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-600/25 dark:border-amber-500/30',
    signal: 'bg-amber-500/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-600/25 dark:border-amber-500/30',
    danger: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-600/25 dark:border-rose-500/30',
    fault: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-600/25 dark:border-rose-500/30',
    purple: 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/30',
    alumni: 'bg-violet-500/10 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-600/25 dark:border-violet-500/30',
    cyan: 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-600/25 dark:border-sky-500/30',
    logic: 'bg-sky-500/10 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-600/25 dark:border-sky-500/30',
    gold: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-600/30 dark:border-amber-500/30 shadow-2xs dark:shadow-sm dark:shadow-amber-500/10',
    surface: 'bg-surface-800 text-surface-200 border-surface-700',
    outline: 'bg-transparent text-surface-200 dark:text-surface-300 border-surface-600 dark:border-surface-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-md font-medium',
    md: 'text-xs px-2.5 py-1 rounded-md font-medium',
    lg: 'text-sm px-3 py-1.5 rounded-lg font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border select-none tracking-wide font-mono',
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
