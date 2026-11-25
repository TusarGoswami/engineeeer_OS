import { ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

/**
 * CSS-variable palette tokens compatible with Recharts SVG props and both themes.
 */
export const CHART_PALETTE = {
  brand: 'var(--color-brand)',
  compiler: 'var(--color-compiler)',
  signal: 'var(--color-signal)',
  cyan: 'var(--color-cyan)',
  grid: 'var(--border-subtle)',
  axis: 'var(--text-secondary)',
};

/**
 * Responsive chart shell providing optional heading, caption, legend slot, and consistent dimensions.
 */
export const ChartContainer = ({
  title,
  description,
  actions,
  height = 240,
  children,
  className = '',
}) => {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-700 bg-card p-5 shadow-[var(--shadow-card)] flex flex-col gap-4',
        className
      )}
    >
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h3 className="font-display text-sm sm:text-base font-semibold text-surface-100">
                {title}
              </h3>
            )}
            {description && <p className="text-xs text-surface-400 mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      <div className="w-full" style={{ height }}>
        {typeof window !== 'undefined' && typeof window.ResizeObserver !== 'undefined' ? (
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
            {children}
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">{children}</div>
        )}
      </div>
    </div>
  );
};

/**
 * Recharts custom tooltip styled with EngineerOS card surface, monospace values, and theme tokens.
 */
export const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-surface-700 bg-card px-3 py-2 text-xs shadow-[var(--shadow-elevated)]">
      {label && <p className="font-mono font-semibold text-surface-100 mb-1">{label}</p>}
      <div className="space-y-1">
        {payload.map((entry, idx) => (
          <div key={entry.dataKey || idx} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-surface-400">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || CHART_PALETTE.brand }}
              />
              <span>{entry.name || entry.dataKey}</span>
            </span>
            <span className="font-mono tabular-nums font-semibold text-surface-100">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartContainer;
