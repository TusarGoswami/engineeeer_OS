import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Clean empty-state panel with icon badge, heading, supporting message, and optional action.
 */
export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-surface-600 bg-card/60 transition-colors duration-150">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-elevated text-surface-400 mb-3.5 border border-surface-700">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-display text-base font-semibold text-surface-100 mb-1">{title}</h3>
      <p className="text-sm text-surface-400 max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
