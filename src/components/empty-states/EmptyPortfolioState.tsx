import React from 'react';
import { Briefcase, Zap, Plus } from 'lucide-react';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useToast } from '../toasts/ToastProvider';

export const EmptyPortfolioState: React.FC = () => {
  const { showToast } = useToast();

  const loadPreset = (type: 'growth' | 'defensive') => {
    if (type === 'growth') {
      usePortfolioStore.setState({
        holdings: [
          { symbol: 'NVDA', quantity: 30, avgBuyPrice: 900.00 },
          { symbol: 'AAPL', quantity: 20, avgBuyPrice: 172.00 },
          { symbol: 'TSLA', quantity: 15, avgBuyPrice: 165.40 },
          { symbol: 'AMZN', quantity: 25, avgBuyPrice: 180.10 },
        ],
        transactions: [
          { id: 'pres-1', symbol: 'NVDA', type: 'BUY', quantity: 30, price: 900.00, fee: 4.50, date: new Date().toISOString() },
          { id: 'pres-2', symbol: 'AAPL', type: 'BUY', quantity: 20, price: 172.00, fee: 1.72, date: new Date().toISOString() },
          { id: 'pres-3', symbol: 'TSLA', type: 'BUY', quantity: 15, price: 165.40, fee: 1.65, date: new Date().toISOString() },
          { id: 'pres-4', symbol: 'AMZN', type: 'BUY', quantity: 25, price: 180.10, fee: 1.80, date: new Date().toISOString() },
        ],
        realizedPnL: 0
      });
      showToast('Loaded Tech Growth Portfolio preset!', 'success');
    } else {
      usePortfolioStore.setState({
        holdings: [
          { symbol: 'KO', quantity: 100, avgBuyPrice: 60.20 },
          { symbol: 'JPM', quantity: 40, avgBuyPrice: 195.50 },
          { symbol: 'PEP', quantity: 50, avgBuyPrice: 168.00 },
          { symbol: 'DIS', quantity: 35, avgBuyPrice: 98.40 },
        ],
        transactions: [
          { id: 'pres-5', symbol: 'KO', type: 'BUY', quantity: 100, price: 60.20, fee: 2.01, date: new Date().toISOString() },
          { id: 'pres-6', symbol: 'JPM', type: 'BUY', quantity: 40, price: 195.50, fee: 3.91, date: new Date().toISOString() },
          { id: 'pres-7', symbol: 'PEP', type: 'BUY', quantity: 50, price: 168.00, fee: 4.20, date: new Date().toISOString() },
          { id: 'pres-8', symbol: 'DIS', type: 'BUY', quantity: 35, price: 98.40, fee: 1.72, date: new Date().toISOString() },
        ],
        realizedPnL: 45.20
      });
      showToast('Loaded Defensive Value Portfolio preset!', 'success');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center glass-card border border-border-glass rounded-2xl max-w-xl mx-auto gap-4">
      <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center text-yellow-400">
        <Briefcase className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">No Portfolio Assets</h3>
        <p className="text-xs text-text-muted mt-1 max-w-sm">
          Your institutional investment ledger is currently empty. Buy shares of a stock or load one of our demo presets.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-2 mt-2 w-full max-w-xs">
        <button
          onClick={() => loadPreset('growth')}
          className="w-full py-2 px-4 rounded-xl bg-app-green/10 border border-app-green/20 hover:bg-app-green/20 text-app-green text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5" />
          Load Growth Preset
        </button>
        <button
          onClick={() => loadPreset('defensive')}
          className="w-full py-2 px-4 rounded-xl bg-white/5 border border-border-glass hover:bg-white/10 text-white text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Load Defensive Preset
        </button>
      </div>
    </div>
  );
};
