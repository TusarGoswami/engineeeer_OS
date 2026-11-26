import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

/**
 * Clean Sun/Moon theme toggle button integrated with ThemeContext.
 */
export const ThemeToggle = ({ className = '', showLabel = false, size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark
    ? 'Switch to light theme (Day Mode)'
    : 'Switch to dark theme (Night Mode)';

  const sizeClasses =
    size === 'sm'
      ? 'h-8 px-2 text-xs'
      : size === 'lg'
      ? 'h-10 px-3 text-sm'
      : 'h-9 px-2.5 text-xs';

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      aria-pressed={isDark}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-surface-700 bg-elevated/70 text-surface-200 hover:border-surface-600 hover:bg-elevated hover:text-brand-500 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun className={`${iconSize} text-amber-400`} />
      ) : (
        <Moon className={`${iconSize} text-surface-300`} />
      )}
      {showLabel && (
        <span className="font-medium">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};

export default ThemeToggle;
