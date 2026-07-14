import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const typeStyles = {
    success: 'bg-[#0f172a]/95 border-emerald-500/30 text-emerald-400',
    warning: 'bg-[#0f172a]/95 border-amber-500/30 text-amber-400',
    error: 'bg-[#0f172a]/95 border-rose-500/30 text-rose-400',
    info: 'bg-[#0f172a]/95 border-indigo-500/30 text-indigo-400',
  };

  const icons = {
    success: <CheckCircle className="shrink-0 text-emerald-400" size={16} />,
    warning: <AlertTriangle className="shrink-0 text-amber-400" size={16} />,
    error: <AlertCircle className="shrink-0 text-rose-400" size={16} />,
    info: <Info className="shrink-0 text-indigo-400" size={16} />,
  };

  return (
    <div
      role="alert"
      className={`flex items-center space-x-3 p-3.5 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${typeStyles[type]}`}
    >
      {icons[type]}
      <p className="text-xs font-semibold text-white/90 pr-2 leading-tight select-none">
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="text-white/40 hover:text-white/80 transition-colors p-0.5 rounded outline-none focus:ring-1 focus:ring-indigo-500"
        aria-label="Close notification"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
