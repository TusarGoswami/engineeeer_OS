import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export const ThemeToggle = ({ className = '', showLabel = false, size = 'md' }) => {
  const { isDark, toggleTheme } = useTheme();

  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  const sizeClasses = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2 rounded-xl text-sm',
    lg: 'p-2.5 rounded-xl text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-4.5 h-4.5',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 transition-all duration-200 select-none cursor-pointer',
        'text-surface-400 hover:text-surface-100 hover:bg-surface-800/80 active:scale-95',
        'border border-transparent hover:border-surface-700/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
        sizeClasses[size] || sizeClasses.md,
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun
            className={cn(
              iconSizes[size] || iconSizes.md,
              'text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45'
            )}
          />
        ) : (
          <Moon
            className={cn(
              iconSizes[size] || iconSizes.md,
              'text-surface-400 hover:text-surface-100 transition-transform duration-300 -rotate-12 hover:rotate-0'
            )}
          />
        )}
      </div>

      {showLabel && (
        <span className="text-xs font-medium text-surface-300">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;

