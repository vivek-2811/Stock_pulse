import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Star, Scale, Play, Filter, RefreshCw } from 'lucide-react';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useAlertStore } from '../../store/useAlertStore';

interface Props {
  ticker?: string;
  tickers?: string[];
  mode?: string;
}

export const CopilotActionPanel: React.FC<Props> = ({ ticker, tickers, mode }) => {
  const navigate = useNavigate();
  const { addToWatchlist, watchlists, activeListId } = useWatchlistStore();
  const { createAlert } = useAlertStore();

  const [watchlistAdded, setWatchlistAdded] = useState(false);
  const [alertCreated, setAlertCreated] = useState(false);

  const activeWatchlist = watchlists.find(w => w.id === activeListId) || watchlists[0];

  const handleAddToWatchlist = () => {
    if (!ticker) return;
    addToWatchlist(activeWatchlist.id, ticker.toUpperCase());
    setWatchlistAdded(true);
    setTimeout(() => setWatchlistAdded(false), 2000);
  };

  const handleCreateAlert = () => {
    if (!ticker) return;
    createAlert(ticker.toUpperCase(), 'PRICE_ABOVE', 100);
    setAlertCreated(true);
    setTimeout(() => setAlertCreated(false), 2000);
  };

  const hasTicker = !!ticker;
  const hasTickers = !!(tickers && tickers.length >= 2);

  return (
    <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-border-glass/40">
      {hasTicker && (
        <>
          <button
            onClick={() => navigate(`/stock/${ticker}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Open Details
          </button>
          
          <button
            onClick={handleAddToWatchlist}
            disabled={watchlistAdded}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all disabled:opacity-55"
          >
            <Star className="w-3.5 h-3.5" />
            {watchlistAdded ? 'Added ✓' : 'Add to Watchlist'}
          </button>

          <button
            onClick={handleCreateAlert}
            disabled={alertCreated}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all disabled:opacity-55"
          >
            <Bell className="w-3.5 h-3.5" />
            {alertCreated ? 'Alert Set ✓' : 'Create Alert'}
          </button>

          <button
            onClick={() => navigate(`/compare?symbols=${ticker},MSFT`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all"
          >
            <Scale className="w-3.5 h-3.5" />
            Compare
          </button>
        </>
      )}

      {hasTickers && (
        <button
          onClick={() => navigate(`/compare?symbols=${tickers.join(',')}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all"
        >
          <Scale className="w-3.5 h-3.5" />
          Compare Set
        </button>
      )}

      {mode === 'portfolio' && (
        <button
          onClick={() => navigate('/portfolio')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Rebalance Portfolio
        </button>
      )}

      {mode === 'screener' && (
        <button
          onClick={() => navigate('/screener-pro')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-glass hover:border-app-green/30 bg-white/2 hover:bg-app-green/8 text-text-secondary hover:text-app-green text-[10px] font-bold transition-all"
        >
          <Filter className="w-3.5 h-3.5" />
          Run Screener Pro
        </button>
      )}
    </div>
  );
};
export default CopilotActionPanel;
