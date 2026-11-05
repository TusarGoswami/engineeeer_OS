import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-[#292E38] bg-[#151922]/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1B202A] text-zinc-400 mb-4 border border-[#292E38]">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-[#F4F4F5] mb-1">{title}</h3>
      <p className="text-sm text-[#A1A1AA] max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
