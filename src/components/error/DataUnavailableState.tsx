import React from 'react';
import { Database, AlertCircle } from 'lucide-react';

interface DataUnavailableStateProps {
  title?: string;
  description?: string;
}

export const DataUnavailableState: React.FC<DataUnavailableStateProps> = ({ 
  title = 'Data Feed Missing', 
  description = 'No tick updates are available for this specific query parameter right now.' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center gap-3 bg-white/[0.01] border border-border-glass rounded-xl max-w-sm mx-auto">
      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-muted">
        <Database className="w-4 h-4" />
      </div>
      <div>
        <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
          {title}
        </h5>
        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

export default DataUnavailableState;
