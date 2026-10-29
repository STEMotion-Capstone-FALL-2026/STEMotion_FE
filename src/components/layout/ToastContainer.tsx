import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warn';
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss?: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[70] w-[min(24rem,calc(100vw-2.5rem))] flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          role={t.type === 'warn' ? 'alert' : 'status'}
          aria-atomic="true"
          className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-semibold flex items-start space-x-2 animate-slide-up pointer-events-auto max-w-full ${
            t.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : t.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {t.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : t.type === 'info' ? (
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span className="min-w-0 flex-1 break-words whitespace-pre-wrap">{t.message}</span>
          {onDismiss && <button onClick={() => onDismiss(t.id)} aria-label="Đóng thông báo" className="p-1 shrink-0 rounded hover:bg-black/5"><X className="w-4 h-4" /></button>}
        </div>
      ))}
    </div>
  );
};
