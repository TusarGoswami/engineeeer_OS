import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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
    'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-[9px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0D11] disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[#FF6500] hover:bg-[#E65300] text-white shadow-sm focus:ring-[#FF6500]/50',
    secondary:
      'bg-[#1B202A] hover:bg-[#222733] text-[#F4F4F5] border border-[#292E38] focus:ring-zinc-500/40',
    outline:
      'bg-transparent border border-[#292E38] hover:border-[#FF6500] hover:bg-[#FF6500]/10 text-[#A1A1AA] hover:text-[#F4F4F5] focus:ring-[#FF6500]/50',
    ghost:
      'bg-transparent hover:bg-[#1B202A] text-[#A1A1AA] hover:text-[#F4F4F5] focus:ring-zinc-600',
    danger:
      'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500/50',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4" />
      )}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4" />}
    </button>
  );
};

export default Button;
