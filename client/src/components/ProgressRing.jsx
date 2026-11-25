import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Accessible circular SVG completion ring using design-system semantic strokes.
 */
export const ProgressRing = ({
  progress = 0,
  size = 64,
  strokeWidth = 6,
  variant = 'brand',
  showValue = true,
  label,
  className = '',
  ...props
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedProgress / 100) * circumference;

  const colorVariants = {
    brand: 'text-brand-500',
    compiler: 'badge-compiler',
    signal: 'text-amber-600 dark:text-amber-500',
    fault: 'text-rose-600 dark:text-rose-500',
    violet: 'text-violet-600 dark:text-violet-400',
    cyan: 'text-sky-600 dark:text-sky-400',
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={normalizedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${normalizedProgress}% progress`}
      className={cn('inline-flex flex-col items-center justify-center relative select-none', className)}
      {...props}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-surface-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* Active Indicator */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={cn('transition-all duration-500 ease-out', colorVariants[variant] || colorVariants.brand)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      {showValue && (
        <span
          className="absolute inset-0 flex items-center justify-center font-mono tabular-nums font-bold text-surface-100 tracking-tight"
          style={{ fontSize: Math.max(size * 0.22, 10) }}
        >
          {Math.round(normalizedProgress)}%
        </span>
      )}
      {label && <span className="text-xs text-surface-400 mt-1.5 font-medium">{label}</span>}
    </div>
  );
};

export default ProgressRing;
