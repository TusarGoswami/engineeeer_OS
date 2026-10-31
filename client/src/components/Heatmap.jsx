import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

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

  // Intensity color mapper
  const getIntensityClass = (count) => {
    if (!count || count === 0) return 'bg-surface-800/70 border-surface-700/30';
    if (count <= 2) return 'bg-emerald-900/80 border-emerald-700/40 text-emerald-300';
    if (count <= 5) return 'bg-emerald-700 border-emerald-600/50 text-emerald-100';
    if (count <= 8) return 'bg-emerald-500 border-emerald-400 text-white';
    return 'bg-emerald-400 border-emerald-300 text-black shadow-sm shadow-emerald-400/30';
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-surface-400">
          {totalActiveDays !== undefined && (
            <span>
              Active Days: <strong className="font-mono text-surface-100">{totalActiveDays}</strong>
            </span>
          )}
          {currentStreak !== undefined && (
            <span>
              Current Streak: <strong className="font-mono text-emerald-400">{currentStreak}d 🔥</strong>
            </span>
          )}
          {longestStreak !== undefined && (
            <span>
              Max Streak: <strong className="font-mono text-surface-200">{longestStreak}d</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-surface-400">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-sm bg-surface-800 border border-surface-700/30" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900/80 border border-emerald-700/40" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700 border border-emerald-600/50" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400 border border-emerald-300" />
          <span>More</span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 relative scrollbar-thin">
        <div className="inline-flex gap-1">
          {calendarGrid.map((week, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-1">
              {week.map((cell) => (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => onSelectDay && onSelectDay(cell)}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  aria-label={`${cell.date}: ${cell.count} activities`}
                  className={cn(
                    'w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 focus:scale-125 focus:outline-none focus:ring-1 focus:ring-emerald-400',
                    getIntensityClass(cell.count)
                  )}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Floating Tooltip */}
        {hoveredCell && (
          <div className="absolute top-0 right-0 pointer-events-none bg-surface-900/95 border border-surface-700 px-2 py-1 rounded-md text-xs font-mono text-surface-200 shadow-xl z-20">
            {hoveredCell.date}: <strong>{hoveredCell.count}</strong> contribution{hoveredCell.count !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default Heatmap;

