import { useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  status,
  className = '',
  fallbackClassName = '',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Generate initials (e.g. "Alex Chen" -> "AC", "Tusar" -> "TU")
  const getInitials = (str) => {
    if (!str || typeof str !== 'string') return '?';
    const parts = str.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Consistent background hue from name string
  const getHue = (str) => {
    let hash = 0;
    for (let i = 0; i < (str || '').length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      'bg-brand-600 text-white',
      'bg-emerald-600 text-white',
      'bg-violet-600 text-white',
      'bg-amber-600 text-white',
      'bg-cyan-600 text-white',
      'bg-rose-600 text-white',
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-24 h-24 text-2xl',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
    '2xl': 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-emerald-500 ring-surface-950',
    offline: 'bg-surface-500 ring-surface-950',
    busy: 'bg-rose-500 ring-surface-950',
  };

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none rounded-full', className)} {...props}>
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          onError={() => setHasError(true)}
          className={cn('rounded-full object-cover ring-1 ring-surface-700/50', sizes[size] || sizes.md)}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center font-mono font-semibold rounded-full ring-1 ring-surface-700/50',
            sizes[size] || sizes.md,
            getHue(name),
            fallbackClassName
          )}
        >
          {getInitials(name)}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2',
            statusSizes[size] || statusSizes.md,
            statusColors[status] || statusColors.online
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};

export default Avatar;

