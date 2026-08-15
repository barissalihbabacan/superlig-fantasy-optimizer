import React, { useState, createContext, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';

export type ToastType = 'success' | 'info' | 'warning' | 'optimizer';

export interface ToastItem {
  id: string;
  message: string;
  subMessage?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, subMessage?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success', subMessage?: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, subMessage, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 3800);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            id="toast-container"
            className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full px-4 sm:px-0 pointer-events-none"
          >
            {toasts.map((toast) => {
              const isSuccess = toast.type === 'success';
              const isOptimizer = toast.type === 'optimizer';
              const isWarning = toast.type === 'warning';

              return (
                <div
                  key={toast.id}
                  id={`toast-item-${toast.id}`}
                  className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl bg-[#121824] border border-[#222c3f] shadow-2xl text-white backdrop-blur-md animate-slideUp transition-all hover:border-[var(--color-brand)]"
                  style={{
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isOptimizer ? (
                      <div className="w-6 h-6 rounded-lg bg-[var(--color-brand)] text-black flex items-center justify-center font-bold">
                        <Zap className="w-3.5 h-3.5" />
                      </div>
                    ) : isSuccess ? (
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : isWarning ? (
                      <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                      {toast.message}
                    </div>
                    {toast.subMessage && (
                      <div className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5 leading-snug">
                        {toast.subMessage}
                      </div>
                    )}
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-white p-1 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};
