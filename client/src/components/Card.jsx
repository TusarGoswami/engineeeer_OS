import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-700 bg-surface-850 p-6 shadow-sm dark:shadow-xl transition-all duration-200',
        hover &&
          'hover:border-surface-600 hover:bg-surface-800 hover:shadow-md dark:hover:shadow-2xl hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={cn('flex flex-col space-y-1.5 mb-4', className)}>{children}</div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={cn('text-lg font-semibold tracking-tight text-surface-100', className)}>{children}</h3>
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
