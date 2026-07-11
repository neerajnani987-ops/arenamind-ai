import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold text-xs transition-all outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 select-none flex items-center justify-center space-x-1.5 cursor-pointer";
  
  const variants = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-neon active:scale-[0.98]",
    secondary: "bg-white/5 border border-white/10 hover:bg-white/10 text-white active:scale-[0.98]",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-neon-rose active:scale-[0.98]",
    ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
export default Button;
