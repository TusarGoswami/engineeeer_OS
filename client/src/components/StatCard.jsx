import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Engineering KPI stat tile with tabular monospace numerals and accessible interaction support.
 */
export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const borderVariants = {
    default: 'border-surface-700 hover:border-surface-600',
    brand: 'border-brand-500/30 hover:border-brand-500/50',
    compiler: 'border-compiler-500/30 hover:border-compiler-500/50',
    signal: 'border-amber-500/30 hover:border-amber-500/50',
    fault: 'border-rose-500/30 hover:border-rose-500/50',
    cyan: 'border-sky-500/30 hover:border-sky-500/50',
    purple: 'border-violet-500/30 hover:border-violet-500/50',
  };

  const iconVariants = {
    default: 'text-surface-300 bg-elevated border-surface-700',
    brand: 'text-brand-700 bg-brand-500/10 border-brand-500/20',
    compiler: 'badge-compiler bg-compiler-500/10 border-compiler-500/25',
    signal: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/25',
    fault: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/25',
    cyan: 'text-sky-700 dark:text-sky-400 bg-sky-500/10 border-sky-500/25',
    purple: 'text-violet-700 dark:text-violet-400 bg-violet-500/10 border-violet-500/25',
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };

  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-150',
        borderVariants[variant] || borderVariants.default,
        onClick &&
          'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-semibold text-surface-400 uppercase tracking-wider truncate">
            {title}
          </p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono tabular-nums text-[26px] font-bold tracking-tight leading-tight text-surface-100">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  'text-xs font-mono font-medium px-1.5 py-0.5 rounded',
                  typeof trend === 'object' && trend.isPositive === false
                    ? 'text-rose-700 dark:text-rose-400 bg-rose-500/10'
                    : 'badge-compiler bg-compiler-500/10'
                )}
              >
                {typeof trend === 'object' ? trend.value : trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-surface-400 pt-0.5">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={cn('p-2.5 rounded-lg border shrink-0', iconVariants[variant] || iconVariants.default)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
