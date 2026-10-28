import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Skeleton = ({ className = '', ...props }) => {
  return <div className={cn('animate-pulse rounded-xl bg-surface-800/80', className)} {...props} />;
};

export default Skeleton;
