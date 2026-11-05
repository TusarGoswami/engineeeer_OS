import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const Table = ({ children, className = '', containerClassName = '' }) => (
  <div className={cn('relative w-full overflow-auto rounded-xl border border-[#292E38] bg-[#151922]', containerClassName)}>
    <table className={cn('w-full caption-bottom text-sm', className)}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }) => (
  <thead className={cn('bg-[#101319] border-b border-[#292E38] text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]', className)}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={cn('divide-y divide-[#292E38]', className)}>
    {children}
  </tbody>
);

export const TableFooter = ({ children, className = '' }) => (
  <tfoot className={cn('border-t border-[#292E38] bg-[#101319] font-medium text-[#A1A1AA]', className)}>
    {children}
  </tfoot>
);

export const TableRow = ({ children, className = '', hover = true }) => (
  <tr
    className={cn(
      'transition-colors',
      hover && 'hover:bg-[#1B202A]/60',
      className
    )}
  >
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }) => (
  <th
    className={cn(
      'h-10 px-4 text-left align-middle font-medium text-[#A1A1AA] select-none [&:has([role=checkbox])]:pr-0',
      className
    )}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }) => (
  <td className={cn('p-4 align-middle text-[#F4F4F5] [&:has([role=checkbox])]:pr-0', className)}>
    {children}
  </td>
);

export const TableCaption = ({ children, className = '' }) => (
  <caption className={cn('mt-4 text-xs text-[#71717A]', className)}>
    {children}
  </caption>
);

export default Table;
