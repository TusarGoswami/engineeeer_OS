import { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const fallbackId = useId();
    const inputId = id || props.name || fallbackId;

    return (
      <div className="w-full flex flex-col space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-surface-100">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {LeftIcon && (
            <div className="pointer-events-none absolute left-3.5 text-surface-400">
              <LeftIcon className="w-4 h-4" />
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full rounded-[9px] bg-auth-input border border-surface-700 text-surface-100 placeholder-surface-500 text-sm px-3.5 py-2.5 transition-all duration-200 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed',
              LeftIcon && 'pl-10',
              RightIcon && 'pr-10',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/40',
              className
            )}
            {...props}
          />
          {RightIcon && (
            <div className="absolute right-3.5 flex items-center text-surface-400">
              <RightIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[12px] font-medium text-rose-500 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-[12px] text-surface-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
