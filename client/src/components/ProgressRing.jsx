import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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
    compiler: 'text-emerald-500',
    signal: 'text-amber-500',
    fault: 'text-rose-500',
    violet: 'text-violet-500',
    cyan: 'text-cyan-500',
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
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="text-surface-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
        />
        {/* Animated Progress Indicator */}
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
          className="absolute inset-0 flex items-center justify-center font-mono font-bold text-white tracking-tight"
          style={{ fontSize: Math.max(size * 0.22, 10) }}
        >
          {Math.round(normalizedProgress)}%
        </span>
      )}
      {label && <span className="text-xs text-surface-400 mt-1 font-medium">{label}</span>}
    </div>
  );
};

export default ProgressRing;

