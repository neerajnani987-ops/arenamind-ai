import React from 'react';

interface StadiumLegendProps {
  hasRoute: boolean;
}

/**
 * StadiumLegend displays the map markers classification, status colors,
 * and screen reader annotations for WCAG compliance.
 */
export const StadiumLegend: React.FC<StadiumLegendProps> = React.memo(({ hasRoute }) => {
  return (
    <div 
      className="absolute bottom-3 left-3 z-[1000] p-3 rounded-lg glass-panel text-xs space-y-1.5 text-white"
      role="region"
      aria-label="Stadium Map Legend"
    >
      <div className="font-semibold text-indigo-400 mb-1 border-b border-white/10 pb-1">Stadium Legend</div>
      <div className="flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full marker-pulse-emerald inline-block" aria-hidden="true"></span>
        <span><span className="sr-only">Green marker indicates </span>Normal / Low Crowds</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full marker-pulse-rose inline-block" aria-hidden="true"></span>
        <span><span className="sr-only">Red marker indicates </span>High Congestion / Alert</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" aria-hidden="true"></span>
        <span><span className="sr-only">Amber marker indicates </span>Medium Density</span>
      </div>
      {hasRoute && (
        <div className="flex items-center space-x-2">
          <span className="w-4 h-0 border-t-2 border-dashed border-[#6366f1] inline-block" aria-hidden="true"></span>
          <span><span className="sr-only">Dashed blue line indicates </span>Active Navigation Route</span>
        </div>
      )}
    </div>
  );
});

StadiumLegend.displayName = 'StadiumLegend';
export default StadiumLegend;
