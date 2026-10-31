import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ToastContext = createContext(null);

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

  const toastMethods = {
    toast: addToast,
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
    success: 'border-emerald-500/40 bg-surface-900/95 text-emerald-300',
    error: 'border-rose-500/40 bg-surface-900/95 text-rose-300',
    warning: 'border-amber-500/40 bg-surface-900/95 text-amber-300',
    info: 'border-brand-500/40 bg-surface-900/95 text-brand-300',
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      {/* Toast Portaled Container */}
      <div
        aria-live="polite"
        role="region"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => {
          const Icon = icons[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={cn(
                'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md animate-fade-in-up transition-all',
                styles[t.type] || styles.info
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                {t.title && <h5 className="font-semibold text-white">{t.title}</h5>}
                {t.message && <p className="text-surface-300 mt-0.5">{t.message}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss toast"
                className="text-surface-400 hover:text-white p-0.5 rounded transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
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
    // Graceful fallback if used outside Provider
    return {
      toast: console.log,
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

