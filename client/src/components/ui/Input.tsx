import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Input: React.FC<InputProps> = React.memo(({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="space-y-1 w-full text-left">
      {label && (
        <label htmlFor={inputId} className="text-[10px] text-white/50 uppercase font-bold block">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full glass-input rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
          error ? 'border-rose-500 focus:ring-rose-500' : ''
        } ${className}`}
        {...props}
      />
      {error && (
        <span className="text-[10px] text-rose-400 block mt-0.5" role="alert">
          {error}
        </span>
      )}
    </div>
  );
});
Input.displayName = 'Input';
export default Input;
