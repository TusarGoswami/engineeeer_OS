import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Animated loading skeleton primitives using theme elevated surface tokens.
 */
export const Skeleton = ({ className = '', ...props }) => {
  return <div className={cn('animate-pulse rounded-lg bg-elevated', className)} {...props} />;
};

export const CardSkeleton = ({ className = '', lines = 3 }) => (
  <div className={cn('rounded-xl border border-surface-700 bg-card p-6 space-y-4 animate-pulse shadow-[var(--shadow-card)]', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <div className="space-y-2.5">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  </div>
);

export const StatSkeleton = ({ className = '' }) => (
  <div className={cn('rounded-xl border border-surface-700 bg-card p-5 space-y-3 animate-pulse shadow-[var(--shadow-card)]', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-7 w-28" />
    <Skeleton className="h-3 w-16" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={cn('w-full border border-surface-700 rounded-xl overflow-hidden bg-card p-4 space-y-3 animate-pulse shadow-[var(--shadow-card)]', className)}>
    <div className="flex gap-4 border-b border-surface-700 pb-3">
      {Array.from({ length: cols }).map((_, c) => (
        <Skeleton key={c} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 py-2 border-b border-surface-700/50 last:border-b-0">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const AvatarSkeleton = ({ size = 'md', className = '' }) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-24 h-24',
  };
  return <Skeleton className={cn('rounded-full', sizes[size] || sizes.md, className)} />;
};

export default Skeleton;
