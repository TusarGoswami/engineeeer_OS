import { createContext, useContext, useEffect, useState, useMemo } from 'react';

const THEME_STORAGE_KEY = 'engineeros_theme';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Default to 'light' for first-time visitors / unauthenticated users, or respect ?theme=dark / ?theme=light
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';
    try {
      const search = window.location.search || '';
      if (/[?&]theme=dark\b/.test(search)) return 'dark';
      if (/[?&]theme=light\b/.test(search)) return 'light';

      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore localStorage write errors (e.g. private mode)
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === 'dark',
      toggleTheme,
      setTheme,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
