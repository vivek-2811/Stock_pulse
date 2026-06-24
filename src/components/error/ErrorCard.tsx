import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorCardProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ 
  title = 'Execution Error', 
  message = 'An unexpected system fault occurred while fetching ledger data.',
  onRetry 
}) => {
  return (
    <div className="glass-card border border-app-red/25 bg-app-red/5 rounded-xl p-4 flex gap-3.5 max-w-xl mx-auto">
      <AlertCircle className="w-5 h-5 text-app-red shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-0.5">{title}</h4>
        <p className="text-xs text-text-secondary leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-app-red/10 border border-app-red/20 hover:bg-app-red/20 text-app-red text-xs font-semibold transition-all duration-150"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorCard;
