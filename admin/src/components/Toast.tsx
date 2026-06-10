import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  show: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircleIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
  error: <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />,
  info: <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
  warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />,
};

const bgMap: Record<ToastType, string> = {
  success: 'border-l-emerald-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
};

// Event bus for legacy toast object
type ToastEvent = { type: ToastType; message: string };
const toastListeners: Array<(event: ToastEvent) => void> = [];

const emitToast = (event: ToastEvent) => {
  toastListeners.forEach((fn) => fn(event));
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = React.useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((type: ToastType, message: string) => {
    nextIdRef.current += 1;
    const id = nextIdRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => removeToast(id), 4000);
  }, [removeToast]);

  const success = useCallback((message: string) => show('success', message), [show]);
  const error = useCallback((message: string) => show('error', message), [show]);
  const info = useCallback((message: string) => show('info', message), [show]);
  const warning = useCallback((message: string) => show('warning', message), [show]);

  // Listen for global toast events (from legacy toast.success/error pattern)
  useEffect(() => {
    const listener = (event: ToastEvent) => show(event.type, event.message);
    toastListeners.push(listener);
    return () => {
      const idx = toastListeners.indexOf(listener);
      if (idx >= 0) toastListeners.splice(idx, 1);
    };
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-900 dark:border-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] animate-slide-in ${bgMap[t.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{iconMap[t.type]}</div>
            <p className="flex-1 text-sm font-bold text-gray-900 dark:text-gray-100">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="flex-shrink-0 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Legacy toast object — dispatches via event bus so visual toasts appear
const toast = {
  success: (msg: string) => emitToast({ type: 'success', message: msg }),
  error: (msg: string) => emitToast({ type: 'error', message: msg }),
  info: (msg: string) => emitToast({ type: 'info', message: msg }),
  warning: (msg: string) => emitToast({ type: 'warning', message: msg }),
};

export default toast;
