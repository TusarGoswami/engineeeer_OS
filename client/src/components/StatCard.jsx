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
    default: 'border-[#292E38] hover:border-zinc-700',
    brand: 'border-[#FF6500]/30 hover:border-[#FF6500]/50',
    compiler: 'border-emerald-500/30 hover:border-emerald-500/50',
    signal: 'border-amber-500/30 hover:border-amber-500/50',
    fault: 'border-rose-500/30 hover:border-rose-500/50',
    cyan: 'border-[#38BDF8]/30 hover:border-[#38BDF8]/50',
  };

  const iconVariants = {
    default: 'text-[#A1A1AA] bg-[#1B202A]',
    brand: 'text-[#FF6500] bg-[#FF6500]/10 border border-[#FF6500]/20',
    compiler: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
    signal: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
    fault: 'text-rose-400 bg-rose-500/10 border border-rose-500/20',
    cyan: 'text-[#38BDF8] bg-[#38BDF8]/10 border border-[#38BDF8]/20',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border bg-[#151922] p-5 shadow-lg transition-all duration-200',
        borderVariants[variant] || borderVariants.default,
        onClick && 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.99]',
        className
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-[#F4F4F5]">{value}</span>
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
          {subtitle && <p className="text-xs text-[#A1A1AA] pt-0.5">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={cn('p-2.5 rounded-xl border border-[#292E38]', iconVariants[variant] || iconVariants.default)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
