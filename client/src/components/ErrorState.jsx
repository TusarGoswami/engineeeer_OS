import { AlertTriangle } from 'lucide-react';
import { Button } from './Button.jsx';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error loading this resource. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-rose-900/40 bg-rose-950/20 text-surface-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400 mb-4 border border-rose-500/30">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
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
