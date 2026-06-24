import React from 'react';
import { Scale, Zap, Activity } from 'lucide-react';
import { useToast } from '../toasts/ToastProvider';

interface EmptyCompareStateProps {
  onSelectSymbols: (symbols: string[]) => void;
}

export const EmptyCompareState: React.FC<EmptyCompareStateProps> = ({ onSelectSymbols }) => {
  const { showToast } = useToast();

  const handleSelect = (symbols: string[]) => {
    onSelectSymbols(symbols);
    showToast(`Loading comparison: ${symbols.join(' vs ')}`, 'success');
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass-card border border-border-glass rounded-2xl max-w-xl mx-auto gap-4">
      <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400">
        <Scale className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Comparison Targets</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Select up to 4 stocks to compare correlation coefficients, technical radar stats, and chart performative trends.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full max-w-xs">
        <button
          onClick={() => handleSelect(['NVDA', 'AMD'])}
          className="w-full py-2 px-4 rounded-xl bg-app-green/10 border border-app-green/20 hover:bg-app-green/20 text-app-green text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Compare NVDA vs AMD
        </button>
        <button
          onClick={() => handleSelect(['AAPL', 'MSFT'])}
          className="w-full py-2 px-4 rounded-xl bg-white/5 border border-border-glass hover:bg-white/10 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          Compare AAPL vs MSFT
        </button>
      </div>
    </div>
  );
};
export default EmptyCompareState;
