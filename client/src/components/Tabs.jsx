import { createContext, useContext, useState } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const TabsContext = createContext(null);

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
        'inline-flex items-center gap-1 rounded-xl bg-surface-900/80 p-1 border border-surface-800 text-surface-400',
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
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-40 disabled:cursor-not-allowed',
        isSelected
          ? 'bg-surface-800 text-white font-semibold shadow-sm border border-surface-700/60'
          : 'hover:text-surface-200 hover:bg-surface-800/40 text-surface-400',
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

