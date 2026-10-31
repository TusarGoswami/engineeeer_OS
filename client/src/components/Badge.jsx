import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Badge = ({ children, variant = 'surface', size = 'sm', className = '' }) => {
  const variants = {
    brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    compiler: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    signal: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    fault: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    purple: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    alumni: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    logic: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    surface: 'bg-surface-800 text-surface-300 border-surface-700',
    outline: 'bg-transparent text-surface-300 border-surface-700',
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
