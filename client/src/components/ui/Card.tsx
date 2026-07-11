import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-panel p-5 rounded-xl border border-white/10 shadow-glass transition-all ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
export default Card;
