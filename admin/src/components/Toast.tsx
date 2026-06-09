import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

const toastListeners: ((toast: Omit<ToastItem, 'id'>) => void)[] = [];

export const toast = {
  success: (message: string) => toastListeners.forEach((fn) => fn({ type: 'success', message })),
  error: (message: string) => toastListeners.forEach((fn) => fn({ type: 'error', message })),
  warning: (message: string) => toastListeners.forEach((fn) => fn({ type: 'warning', message })),
  info: (message: string) => toastListeners.forEach((fn) => fn({ type: 'info', message })),
};

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const listener = (t: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2);
      setToasts((prev) => [...prev, { ...t, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    };
    toastListeners.push(listener);
    return () => {
      const idx = toastListeners.indexOf(listener);
      if (idx !== -1) toastListeners.splice(idx, 1);
    };
  }, []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    error: <XCircleIcon className="h-5 w-5 text-red-500" />,
    warning: <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  };

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] animate-slide-in ${bgColors[t.type]}`}
        >
          {icons[t.type]}
          <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{t.message}</span>
          <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
