import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Responsive data table container with restrained borders, header tint, and row hover states.
 */
export const Table = ({ children, className = '', containerClassName = '' }) => (
  <div
    className={cn(
      'relative w-full overflow-x-auto rounded-xl border border-surface-700 bg-card shadow-[var(--shadow-card)]',
      containerClassName
    )}
  >
    <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead
    className={cn(
      'bg-elevated/80 border-b border-surface-700 text-[11px] font-semibold uppercase tracking-wider text-surface-400',
      className
    )}
  >
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={cn('divide-y divide-surface-700', className)}>{children}</tbody>
);

export const TableFooter = ({ children, className = '' }) => (
  <tfoot className={cn('border-t border-surface-700 bg-elevated/60 font-medium text-surface-300', className)}>
    {children}
  </tfoot>
);

export const TableRow = ({ children, className = '', hover = true }) => (
  <tr className={cn('transition-colors', hover && 'hover:bg-elevated/55', className)}>
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }) => (
  <th
    className={cn(
      'h-10 px-4 text-left align-middle font-semibold text-surface-400 select-none [&:has([role=checkbox])]:pr-0',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={cn('px-4 py-3.5 align-middle text-surface-200 [&:has([role=checkbox])]:pr-0', className)}>
    {children}
  </td>
);

export const TableCaption = ({ children, className = '' }) => (
  <caption className={cn('mt-3 text-xs text-surface-400', className)}>{children}</caption>
);

export default Table;
