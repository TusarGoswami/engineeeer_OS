import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Multiline textarea input with label, error feedback, and optional character counter.
 */
export const Textarea = forwardRef(
  (
    {
      label,
      error,
      helperText,
      maxLength,
      value,
      showCount = false,
      className = '',
      id,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const fallbackId = useId();
    const textareaId = id || props.name || fallbackId;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {(label || showCount) && (
          <div className="flex items-center justify-between gap-2">
            {label && (
              <label htmlFor={textareaId} className="text-[13px] font-medium text-surface-100">
                {label}
              </label>
            )}
            {showCount && maxLength && (
              <span className="text-[11px] font-mono tabular-nums text-surface-400">
                {currentLength}/{maxLength}
              </span>
            )}
          </div>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          maxLength={maxLength}
          value={value}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full rounded-lg bg-auth-input border border-surface-600 text-surface-100 placeholder:text-surface-500 text-sm px-3.5 py-2.5 transition-colors duration-150 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:opacity-55 disabled:cursor-not-allowed resize-y',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-surface-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;

