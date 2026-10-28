import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Card = ({ children, className = '', hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'rounded-2xl border border-surface-800/80 bg-surface-900/60 backdrop-blur-xl p-6 shadow-xl transition-all duration-200',
        hover &&
          'hover:border-surface-700 hover:bg-surface-900/90 hover:shadow-2xl hover:-translate-y-0.5',
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
  <h3 className={cn('text-lg font-semibold tracking-tight text-white', className)}>{children}</h3>
);

export const CardDescription = ({ children, className = '' }) => (
  <p className={cn('text-sm text-surface-400', className)}>{children}</p>
);

export const CardContent = ({ children, className = '' }) => (
  <div className={cn('pt-0', className)}>{children}</div>
);

export const CardFooter = ({ children, className = '' }) => (
  <div className={cn('flex items-center pt-4 border-t border-surface-800/60 mt-4', className)}>
    {children}
  </div>
);

export default Card;
