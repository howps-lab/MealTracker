import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      onDismiss(toasts[0].id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, onDismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border text-sm transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-white border-emerald-200 text-slate-800 shadow-emerald-500/5'
              : toast.type === 'error'
              ? 'bg-white border-rose-200 text-slate-800 shadow-rose-500/5'
              : 'bg-white border-slate-200 text-slate-800 shadow-slate-500/5'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <div className="w-2 h-2 rounded-full bg-slate-900 shrink-0 mt-2" />
          )}

          <div className="flex-1 font-medium">{toast.message}</div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
