import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface HeatmapBreadcrumbProps {
  zoomSector: string | null;
  onReset: () => void;
}

export const HeatmapBreadcrumb: React.FC<HeatmapBreadcrumbProps> = ({ zoomSector, onReset }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted">
      <button
        onClick={onReset}
        disabled={!zoomSector}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all duration-150 ${
          zoomSector 
            ? 'text-app-green hover:text-white hover:bg-white/5 cursor-pointer' 
            : 'text-white/80 cursor-default'
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        <span>Market Overview</span>
      </button>
      
      {zoomSector && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-text-muted/30" />
          <span className="px-2 py-1 rounded-lg text-white font-extrabold bg-[#1f2937]/35 border border-[#374151]/20">
            {zoomSector}
          </span>
        </>
      )}
    </div>
  );
};
