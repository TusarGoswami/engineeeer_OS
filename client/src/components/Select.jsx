import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Accessible native Select control aligned with Input typography, borders, and focus/error states.
 */
export const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      options,
      children,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const fallbackId = useId();
    const selectId = id || props.name || fallbackId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] font-medium text-surface-100">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="pointer-events-none absolute left-3 text-surface-400">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <select
            id={selectId}
            ref={ref}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full appearance-none rounded-lg bg-auth-input border border-surface-600 text-surface-100 text-sm px-3.5 py-2 pr-9 transition-colors duration-150 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer',
              LeftIcon && 'pl-9',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          >
            {Array.isArray(options)
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 w-4 h-4 text-surface-400" />
        </div>
        {error ? (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;

