import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface RetryPanelProps {
  message?: string;
  onRetry: () => void;
}

export const RetryPanel: React.FC<RetryPanelProps> = ({ 
  message = 'Feeds timed out before returning payload.', 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center gap-3.5 p-4 rounded-xl border border-border-glass bg-white/[0.01] max-w-sm mx-auto text-center">
      <div className="flex items-center gap-2 text-yellow-400">
        <AlertCircle size={15} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Sync Delayed</span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-border-glass hover:bg-white/10 text-white text-xs font-semibold transition-all duration-150"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Retry Query
      </button>
    </div>
  );
};

export default RetryPanel;
