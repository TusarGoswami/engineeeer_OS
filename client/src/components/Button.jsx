import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Primary interactive button supporting 6 semantic variants, 3 sizes, loading, and disabled states.
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-[-0.01em] transition-all duration-150 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.985]';

  const variants = {
    primary:
      'bg-brand-500 hover:bg-brand-600 text-white shadow-xs focus-visible:ring-brand-500/50',
    secondary:
      'bg-card hover:bg-elevated text-surface-100 border border-surface-700 hover:border-surface-600 shadow-[var(--shadow-card)] focus-visible:ring-brand-500/40',
    outline:
      'bg-transparent border border-surface-600 hover:border-brand-500/70 hover:bg-brand-500/10 text-surface-200 hover:text-brand-700 focus-visible:ring-brand-500/45',
    ghost:
      'bg-transparent hover:bg-elevated text-surface-400 hover:text-surface-100 focus-visible:ring-surface-600',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus-visible:ring-rose-500/50',
    success:
      'bg-compiler-500 hover:opacity-90 text-white shadow-xs focus-visible:ring-compiler-500/50',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-sm px-5 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant] || variants.primary, sizes[size] || sizes.md, className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;
