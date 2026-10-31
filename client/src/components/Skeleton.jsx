import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Skeleton = ({ className = '', ...props }) => {
  return <div className={cn('animate-pulse rounded-xl bg-surface-800/80', className)} {...props} />;
};

export const CardSkeleton = ({ className = '', lines = 3 }) => (
  <div className={cn('rounded-2xl border border-surface-800/80 bg-surface-900/60 p-6 space-y-4 animate-pulse', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-5 w-1/3 rounded-lg" />
      <Skeleton className="h-4 w-12 rounded-full" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3 rounded', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  </div>
);

export const StatSkeleton = ({ className = '' }) => (
  <div className={cn('rounded-2xl border border-surface-800 bg-surface-900/60 p-5 space-y-3 animate-pulse', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-8 w-8 rounded-xl" />
    </div>
    <Skeleton className="h-7 w-28 rounded-lg" />
    <Skeleton className="h-3 w-16 rounded" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 4, className = '' }) => (
  <div className={cn('w-full border border-surface-800 rounded-xl overflow-hidden bg-surface-900/40 p-4 space-y-3 animate-pulse', className)}>
    <div className="flex gap-4 border-b border-surface-800 pb-3">
      {Array.from({ length: cols }).map((_, c) => (
        <Skeleton key={c} className="h-4 flex-1 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 py-2 border-b border-surface-850/50">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className="h-3 flex-1 rounded" />
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
