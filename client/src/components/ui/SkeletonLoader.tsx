import React from 'react';

interface SkeletonLoaderProps {
  variant?: 'card' | 'list' | 'text' | 'map';
  count?: number;
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'card',
  count = 1,
  className = ''
}) => {
  const renderItems = () => {
    const items = [];
    for (let i = 0; i < count; i++) {
      if (variant === 'card') {
        items.push(
          <div
            key={i}
            className="glass-panel p-5 rounded-xl border border-white/5 bg-white/[0.02] shadow-glass flex flex-col space-y-4 animate-pulse"
          >
            <div className="h-4 bg-white/10 rounded w-1/3"></div>
            <div className="space-y-2">
              <div className="h-3 bg-white/5 rounded w-full"></div>
              <div className="h-3 bg-white/5 rounded w-5/6"></div>
              <div className="h-3 bg-white/5 rounded w-4/6"></div>
            </div>
            <div className="h-8 bg-white/10 rounded-lg w-full mt-2"></div>
          </div>
        );
      } else if (variant === 'list') {
        items.push(
          <div
            key={i}
            className="flex items-center space-x-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg animate-pulse"
          >
            <div className="h-9 w-9 rounded-full bg-white/10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-white/10 rounded w-1/4"></div>
              <div className="h-2.5 bg-white/5 rounded w-1/2"></div>
            </div>
          </div>
        );
      } else if (variant === 'map') {
        items.push(
          <div
            key={i}
            className="w-full h-[350px] md:h-[450px] rounded-xl overflow-hidden shadow-2xl bg-[#0f172a] border border-white/5 flex items-center justify-center relative animate-pulse"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] via-white/[0.03] to-white/[0.01]"></div>
            <div className="flex flex-col items-center space-y-3 z-10">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <div className="h-5 w-5 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
              </div>
              <div className="h-3 bg-white/10 rounded w-24"></div>
            </div>
          </div>
        );
      } else {
        // text layout
        items.push(
          <div key={i} className="space-y-2 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4"></div>
            <div className="h-3 bg-white/5 rounded w-full"></div>
            <div className="h-3 bg-white/5 rounded w-5/6"></div>
          </div>
        );
      }
    }
    return items;
  };

  return (
    <div className={`grid gap-4 ${className}`}>
      {renderItems()}
    </div>
  );
};

export default SkeletonLoader;
