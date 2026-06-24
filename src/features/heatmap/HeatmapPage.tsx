import React from 'react';
import { MarketHeatmap } from './MarketHeatmap.tsx';
import { Layers } from 'lucide-react';

export const HeatmapPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-app-green animate-pulse" /> Treemap Heatmap Terminal
          </h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Real-time D3.js hierarchical treemap. Sized by Market Capitalization, colored by daily performance. Click to zoom, hover to inspect.
          </p>
        </div>
      </div>

      {/* Main Heatmap Visualization */}
      <MarketHeatmap />
    </div>
  );
};

export default HeatmapPage;
