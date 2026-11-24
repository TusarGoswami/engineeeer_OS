import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const HEATMAP_LEVELS = [0, 1, 2, 3, 4, 5];

// Deterministic 6-level orange intensity mapper (CSS vars swap automatically between light/dark)
const getIntensityLevel = (count) => {
  if (!count || count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  if (count <= 8) return 4;
  return 5;
};

export const Heatmap = ({
  data = [],
  weeks = 52,
  onSelectDay,
  className = '',
  totalActiveDays,
  currentStreak,
  longestStreak,
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);

  // Normalize data map: { 'YYYY-MM-DD': count }
  const countMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(data)) {
      data.forEach((item) => {
        if (item && item.date) {
          map.set(item.date.slice(0, 10), item.count || item.total || 0);
        }
      });
    } else if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([d, c]) => map.set(d.slice(0, 10), Number(c) || 0));
    }
    return map;
  }, [data]);

  // Generate calendar grid for past N weeks ending on today
  const calendarGrid = useMemo(() => {
    const today = new Date();
    const days = [];
    const totalDays = weeks * 7;

    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = countMap.get(dateStr) || 0;
      days.push({
        date: dateStr,
        dayOfWeek: d.getDay(), // 0 = Sun, 6 = Sat
        count,
      });
    }

    // Group into columns of 7 days (weeks)
    const cols = [];
    for (let i = 0; i < days.length; i += 7) {
      cols.push(days.slice(i, i + 7));
    }
    return cols;
  }, [countMap, weeks]);

  return (
    <div className={cn('hm-scope space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 text-[var(--hm-text-secondary)]">
          {totalActiveDays !== undefined && (
            <span>
              Active Days:{' '}
              <strong className="font-mono font-semibold text-[var(--hm-text-primary)]">
                {totalActiveDays}
              </strong>
            </span>
          )}
          {currentStreak !== undefined && (
            <span>
              Current Streak:{' '}
              <strong className="font-mono font-semibold text-[var(--hm-accent-strong)]">
                {currentStreak}d 🔥
              </strong>
            </span>
          )}
          {longestStreak !== undefined && (
            <span>
              Max Streak:{' '}
              <strong className="font-mono font-semibold text-[var(--hm-text-primary)]">
                {longestStreak}d
              </strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[var(--hm-text-secondary)]">
          <span>Less</span>
          {HEATMAP_LEVELS.map((level) => (
            <div
              key={level}
              aria-hidden="true"
              className={cn('w-2.5 h-2.5 rounded-sm hm-cell', `hm-level-${level}`)}
            />
          ))}
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="hm-inner rounded-xl p-3 sm:p-3.5 overflow-x-auto relative scrollbar-thin">
        <div className="inline-flex gap-1">
          {calendarGrid.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {week.map((cell) => {
                const level = getIntensityLevel(cell.count);
                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => onSelectDay && onSelectDay(cell)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    aria-label={`${cell.date}: ${cell.count} activities`}
                    className={cn(
                      'w-3 h-3 rounded-[3px] hm-cell hm-cell-btn transition-transform hover:scale-125 focus:scale-125 focus:outline-none',
                      `hm-level-${level}`
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Floating Tooltip */}
        {hoveredCell && (
          <div className="hm-tooltip absolute top-2 right-2 pointer-events-none px-2.5 py-1 rounded-md text-xs font-mono z-20">
            {hoveredCell.date}:{' '}
            <strong className="text-[var(--hm-accent-strong)]">{hoveredCell.count}</strong>{' '}
            contribution{hoveredCell.count !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;

