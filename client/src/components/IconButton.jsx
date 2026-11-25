import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Compact square icon button for toolbars, card actions, and compact triggers.
 */
export const IconButton = ({
  icon: Icon,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  ariaLabel,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variants = {
    primary:
      'bg-brand-500 hover:bg-brand-600 text-white shadow-xs focus-visible:ring-brand-500/50',
    secondary:
      'bg-card hover:bg-elevated text-surface-200 hover:text-surface-100 border border-surface-700 hover:border-surface-600 shadow-2xs focus-visible:ring-brand-500/35',
    outline:
      'bg-transparent border border-surface-600 hover:border-brand-500/70 hover:bg-brand-500/10 text-surface-300 hover:text-brand-700 focus-visible:ring-brand-500/45',
    ghost:
      'bg-transparent hover:bg-elevated text-surface-400 hover:text-surface-100 focus-visible:ring-surface-600',
    danger:
      'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 focus-visible:ring-rose-500',
  };

  const sizes = {
    sm: 'w-7 h-7 p-1 text-xs rounded-lg',
    md: 'w-9 h-9 p-2 text-sm rounded-lg',
    lg: 'w-10 h-10 p-2.5 text-base rounded-xl',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || props['aria-label']}
      className={cn(baseStyles, variants[variant] || variants.secondary, sizes[size] || sizes.md, className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        Icon && <Icon className="w-4 h-4" />
      )}
    </button>
  );
};

export default IconButton;
