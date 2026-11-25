import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * Consistent page header combining Manrope hierarchy, optional terminal path cue, breadcrumbs, and actions.
 */
export const PageHeader = ({
  title,
  description,
  eyebrow,
  breadcrumbs,
  actions,
  className = '',
}) => {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-1 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-surface-400 mb-1">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.label} className="inline-flex items-center gap-1.5">
                {idx > 0 && <ChevronRight className="w-3 h-3 text-surface-500" />}
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-surface-100 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-surface-200 font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="font-mono text-[11px] font-medium uppercase tracking-wider text-brand-700">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-surface-100 leading-tight">
          {title}
        </h1>
        {description && <p className="text-sm text-surface-400 max-w-2xl">{description}</p>}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;

