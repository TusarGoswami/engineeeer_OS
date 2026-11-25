import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Recoverable error display banner/panel with accessible contrast in both themes.
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this resource. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-500/30 bg-rose-500/5 text-surface-200">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-400 mb-3.5 border border-rose-500/30">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="font-display text-base font-semibold text-surface-100 mb-1">{title}</h3>
      <p className="text-sm text-surface-400 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
