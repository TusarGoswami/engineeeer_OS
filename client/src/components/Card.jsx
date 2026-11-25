import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Clean surface container with balanced 1px borders and restrained elevation.
 */
export const Card = ({
  children,
  className = '',
  hover = false,
  variant = 'default',
  ...props
}) => {
  const variantClasses = {
    default: 'bg-card border-surface-700 shadow-[var(--shadow-card)]',
    subtle: 'bg-elevated/60 border-surface-700',
    flat: 'bg-card border-surface-700',
  };

  return (
    <div
      className={cn(
        'rounded-xl border p-5 sm:p-6 transition-all duration-150',
        variantClasses[variant] || variantClasses.default,
        hover && 'hover:border-surface-600 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={cn('flex flex-col space-y-1 mb-4', className)}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={cn('font-display text-base sm:text-lg font-semibold tracking-tight text-surface-100', className)}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={cn('text-sm text-surface-400', className)}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={cn('pt-0', className)}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={cn('flex items-center pt-4 border-t border-surface-700 mt-4', className)}>
    {children}
  </div>
);

export default Card;
