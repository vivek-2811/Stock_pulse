import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentSector: string | null;
  onReset: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentSector, onReset }) => {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-text-muted select-none">
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
      >
        <Home className="w-3.5 h-3.5 text-app-green/80" />
        <span>Market</span>
      </button>
      {currentSector && (
        <>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded-md border border-border-glass">
            {currentSector}
          </span>
        </>
      )}
    </div>
  );
};

export default Breadcrumbs;
