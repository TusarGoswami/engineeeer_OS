import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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
    default: 'border-surface-800 hover:border-surface-700',
    brand: 'border-brand-500/30 hover:border-brand-500/50',
    compiler: 'border-emerald-500/30 hover:border-emerald-500/50',
    signal: 'border-amber-500/30 hover:border-amber-500/50',
    fault: 'border-rose-500/30 hover:border-rose-500/50',
    violet: 'border-violet-500/30 hover:border-violet-500/50',
  };

  const iconVariants = {
    default: 'text-surface-400 bg-surface-800/80',
    brand: 'text-brand-400 bg-brand-500/10',
    compiler: 'text-emerald-400 bg-emerald-500/10',
    signal: 'text-amber-400 bg-amber-500/10',
    fault: 'text-rose-400 bg-rose-500/10',
    violet: 'text-violet-400 bg-violet-500/10',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border bg-surface-900/60 backdrop-blur-xl p-5 shadow-lg transition-all duration-200',
        borderVariants[variant] || borderVariants.default,
        onClick && 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-white">{value}</span>
            {trend && (
              <span
                className={cn(
                  'text-xs font-mono font-medium px-1.5 py-0.5 rounded',
                  typeof trend === 'object' && trend.isPositive === false
                    ? 'text-rose-400 bg-rose-500/10'
                    : 'text-emerald-400 bg-emerald-500/10'
                )}
              >
                {typeof trend === 'object' ? trend.value : trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-surface-400 pt-0.5">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={cn('p-2.5 rounded-xl border border-surface-700/40', iconVariants[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;

