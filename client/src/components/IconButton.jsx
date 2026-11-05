import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0D11] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95';

  const variants = {
    primary:
      'bg-[#FF6500] hover:bg-[#E65300] text-white shadow-sm focus:ring-[#FF6500]/50',
    secondary:
      'bg-[#1B202A] hover:bg-[#222733] text-zinc-200 hover:text-white border border-[#292E38] focus:ring-zinc-500',
    outline:
      'bg-transparent border border-[#292E38] hover:border-[#FF6500] hover:bg-[#FF6500]/10 text-zinc-300 hover:text-white focus:ring-[#FF6500]/50',
    ghost:
      'bg-transparent hover:bg-[#1B202A] text-zinc-400 hover:text-white focus:ring-zinc-600',
    danger:
      'bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 focus:ring-rose-500',
  };

  const sizes = {
    sm: 'w-7 h-7 p-1 text-xs rounded-lg',
    md: 'w-9 h-9 p-2 text-sm rounded-xl',
    lg: 'w-11 h-11 p-2.5 text-base rounded-xl',
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
