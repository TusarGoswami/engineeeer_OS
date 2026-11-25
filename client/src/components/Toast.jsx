import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ToastContext = createContext(null);

/**
 * Application-wide non-blocking toast notification provider and queue.
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      setToasts((prev) => [...prev, { id, title, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const showToast = useCallback(
    (messageOrOptions, type = 'info', title) => {
      if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
        return addToast(messageOrOptions);
      }
      const defaultTitle =
        type === 'success'
          ? 'Success'
          : type === 'error'
          ? 'Error'
          : type === 'warning'
          ? 'Warning'
          : 'Info';
      return addToast({
        message: String(messageOrOptions || ''),
        type: type || 'info',
        title: title !== undefined ? title : defaultTitle,
      });
    },
    [addToast]
  );

  const toastMethods = {
    toast: addToast,
    showToast,
    success: (message, title = 'Success') => addToast({ title, message, type: 'success' }),
    error: (message, title = 'Error') => addToast({ title, message, type: 'error' }),
    info: (message, title = 'Info') => addToast({ title, message, type: 'info' }),
    warning: (message, title = 'Warning') => addToast({ title, message, type: 'warning' }),
    dismiss: removeToast,
  };

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const styles = {
    success: 'border-compiler-500/35 bg-card badge-compiler',
    error: 'border-rose-500/40 bg-card text-rose-700 dark:text-rose-400',
    warning: 'border-amber-500/40 bg-card text-amber-700 dark:text-amber-400',
    info: 'border-brand-500/35 bg-card text-brand-700',
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notifications"
        className="fixed bottom-20 lg:bottom-5 right-4 z-50 flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-[var(--shadow-elevated)] animate-fade-in-up transition-all',
                styles[t.type] || styles.info
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-xs">
                {t.title && <h5 className="font-semibold text-surface-100">{t.title}</h5>}
                {t.message && <p className="text-surface-400 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast"
                className="text-surface-400 hover:text-surface-100 p-1 rounded-md hover:bg-elevated transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toast: console.log,
      showToast: (msg, type) => console.log(`[Toast ${type || 'info'}]`, msg),
      success: console.log,
      error: console.error,
      info: console.info,
      warning: console.warn,
      dismiss: () => {},
    };
  }
  return context;
};

export default ToastProvider;
