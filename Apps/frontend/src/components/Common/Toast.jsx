import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({
  message,
  type = 'success', // 'success' | 'error' | 'info'
  onClose,
  duration = 3500
}) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-200 bg-white text-slate-800',
    error: 'border-red-200 bg-white text-slate-800',
    info: 'border-blue-200 bg-white text-slate-800'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${borders[type]} max-w-md`}
      >
        {icons[type]}
        <p className="text-xs font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-auto text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
