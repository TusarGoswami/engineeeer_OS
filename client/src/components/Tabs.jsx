import { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const TabsContext = createContext(null);

/**
 * Controlled or uncontrolled tabbed interface with horizontally scrollable trigger rail.
 */
export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className = '',
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const activeValue = value !== undefined ? value : internalValue;

  const handleValueChange = (val) => {
    if (value === undefined) {
      setInternalValue(val);
    }
    onValueChange?.(val);
  };

  return (
    <TabsContext.Provider value={{ activeValue, handleValueChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = '' }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex max-w-full overflow-x-auto scrollbar-none items-center gap-1 rounded-xl bg-elevated p-1 border border-surface-700 text-surface-400',
        className
      )}
    >
      {children}
    </div>
  );
};

export const TabsTrigger = ({ value, children, disabled = false, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { activeValue, handleValueChange } = context;
  const isSelected = activeValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => handleValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 disabled:opacity-40 disabled:cursor-not-allowed',
        isSelected
          ? 'bg-card text-surface-100 font-semibold shadow-2xs border border-surface-700'
          : 'hover:text-surface-100 hover:bg-card/60 text-surface-400 border border-transparent',
        className
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = '' }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  if (context.activeValue !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-4 focus:outline-none animate-fade-in', className)}
    >
      {children}
    </div>
  );
};

export default Tabs;
