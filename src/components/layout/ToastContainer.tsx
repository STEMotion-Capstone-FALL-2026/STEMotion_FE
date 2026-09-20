import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'info' | 'warn';
}

interface ToastContainerProps {
  toasts: ToastItem[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-semibold flex items-center space-x-2 animate-slide-up pointer-events-auto ${
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
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
