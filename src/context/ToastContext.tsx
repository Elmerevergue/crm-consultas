import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, Bell } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const remove = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />,
    error: <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />,
    warning: <Bell size={18} className="text-amber-500 flex-shrink-0" />,
    info: <Info size={18} className="text-blue-500 flex-shrink-0" />,
  };

  const bgColors: Record<ToastType, string> = {
    success: 'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800',
    error: 'bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800',
    info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800',
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg fade-in ${bgColors[t.type]}`}
          >
            {icons[t.type]}
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 flex-1">{t.message}</p>
            <button
              onClick={() => remove(t.id)}
              className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
