import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Linear accessible progress bar supporting semantic variants and optional label readout.
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'brand',
  size = 'md',
  label,
  showValue = false,
  className = '',
}) => {
  const pct = max > 0 ? Math.min(Math.max((value / max) * 100, 0), 100) : 0;

  const trackSizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  const fillVariants = {
    brand: 'bg-brand-500',
    compiler: 'bg-compiler-500',
    signal: 'bg-amber-500',
    fault: 'bg-rose-500',
    cyan: 'bg-sky-500',
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="text-surface-400 font-medium">{label}</span>}
          {showValue && (
            <span className="font-mono tabular-nums font-semibold text-surface-100">
              {Math.round(pct)}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `${Math.round(pct)}% progress`}
        className={cn(
          'w-full overflow-hidden rounded-full bg-elevated border border-surface-700/60',
          trackSizes[size] || trackSizes.md
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300 ease-out',
            fillVariants[variant] || fillVariants.brand
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;

