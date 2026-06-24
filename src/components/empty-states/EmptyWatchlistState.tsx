import React from 'react';
import { Star, Zap, Activity } from 'lucide-react';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useToast } from '../toasts/ToastProvider';

interface EmptyWatchlistStateProps {
  listId: string;
}

export const EmptyWatchlistState: React.FC<EmptyWatchlistStateProps> = ({ listId }) => {
  const { showToast } = useToast();

  const loadPreset = (type: 'mag7' | 'aileaders') => {
    const symbols = type === 'mag7' 
      ? ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'TSLA', 'AMZN'] 
      : ['NVDA', 'MSFT', 'AAPL', 'KO', 'PEP']; // select symbols existing in mock market
    
    useWatchlistStore.setState((state) => ({
      watchlists: state.watchlists.map(wl => 
        wl.id === listId ? { ...wl, symbols } : wl
      )
    }));

    showToast(`Loaded ${type === 'mag7' ? 'Magnificent Seven' : 'AI Leaders'} into watchlist!`, 'success');
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass-card border border-border-glass rounded-2xl max-w-xl mx-auto gap-4">
      <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
        <Star className="w-5 h-5 animate-pulse" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Empty Watchlist</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          No trackers set in this column. Add tickers manually or trigger a preset watchlist below.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full max-w-xs">
        <button
          onClick={() => loadPreset('mag7')}
          className="w-full py-2 px-4 rounded-xl bg-app-green/10 border border-app-green/20 hover:bg-app-green/20 text-app-green text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Load Mag Seven
        </button>
        <button
          onClick={() => loadPreset('aileaders')}
          className="w-full py-2 px-4 rounded-xl bg-white/5 border border-border-glass hover:bg-white/10 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Activity className="w-3.5 h-3.5" />
          Load AI Leaders
        </button>
      </div>
    </div>
  );
};
