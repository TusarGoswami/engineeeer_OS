import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Table = ({ children, className = '', containerClassName = '' }) => (
  <div className={cn('relative w-full overflow-auto rounded-xl border border-surface-800 bg-surface-900/40', containerClassName)}>
    <table className={cn('w-full caption-bottom text-sm', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead className={cn('bg-surface-900/80 border-b border-surface-800 text-xs font-semibold uppercase tracking-wider text-surface-400', className)}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={cn('divide-y divide-surface-850', className)}>
    {children}
  </tbody>
);

export const TableFooter = ({ children, className = '' }) => (
  <tfoot className={cn('border-t border-surface-800 bg-surface-900/50 font-medium text-surface-300', className)}>
    {children}
  </tfoot>
);

export const TableRow = ({ children, className = '', hover = true }) => (
  <tr
    className={cn(
      'transition-colors',
      hover && 'hover:bg-surface-800/40',
      className
    )}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }) => (
  <th
    className={cn(
      'h-10 px-4 text-left align-middle font-medium text-surface-400 select-none [&:has([role=checkbox])]:pr-0',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={cn('p-4 align-middle text-surface-200 [&:has([role=checkbox])]:pr-0', className)}>
    {children}
  </td>
);

export const TableCaption = ({ children, className = '' }) => (
  <caption className={cn('mt-4 text-xs text-surface-500', className)}>
    {children}
  </caption>
);

export default Table;

