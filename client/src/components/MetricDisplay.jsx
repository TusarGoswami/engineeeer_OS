import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Compact horizontal telemetry bar rendering dense engineering KPIs without heavy card repetition.
 */
export const MetricStrip = ({ children, className = '' }) => {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-surface-700 rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)] overflow-hidden',
        className
      )}
    >
      {children}
    </div>
  );
};

export const MetricItem = ({
  label,
  value,
  subvalue,
  delta,
  deltaPositive = true,
  icon: Icon,
  accent = 'default',
  className = '',
}) => {
  const accentClasses = {
    default: 'text-surface-100',
    brand: 'text-brand-700',
    compiler: 'badge-compiler',
  };

  return (
    <div className={cn('px-4 py-3.5 sm:px-5 flex flex-col justify-between gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-surface-400 truncate">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={cn(
            'font-mono tabular-nums text-xl sm:text-2xl font-bold tracking-tight',
            accentClasses[accent] || accentClasses.default
          )}
        >
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded',
              deltaPositive
                ? 'badge-compiler bg-compiler-500/10'
                : 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
            )}
          >
            {delta}
          </span>
        )}
      </div>
      {subvalue && <span className="text-xs text-surface-400 truncate">{subvalue}</span>}
    </div>
  );
};

export default MetricStrip;

