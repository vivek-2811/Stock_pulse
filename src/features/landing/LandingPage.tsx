import React from 'react';
import { useNavigate } from 'react-router';
import { Activity, Play, Compass, Cpu, Layers, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mockupTab, setMockupTab] = React.useState<'feeds' | 'risk' | 'ledger'>('feeds');

  const marqueeStocks = [
    { symbol: 'AAPL', price: 189.84, pct: '+0.66%' },
    { symbol: 'MSFT', price: 421.90, pct: '+0.82%' },
    { symbol: 'NVDA', price: 903.56, pct: '+2.74%' },
    { symbol: 'TSLA', price: 177.46, pct: '-2.31%' },
    { symbol: 'GOOGL', price: 176.42, pct: '-0.33%' },
    { symbol: 'JPM', price: 194.55, pct: '+0.11%' },
    { symbol: 'BTC', price: 64230, pct: '+1.45%' },
    { symbol: 'S&P 500', price: 5431.60, pct: '+0.47%' },
    { symbol: 'NASDAQ', price: 17852.12, pct: '+0.82%' }
  ];

  return (
    <div className="min-h-screen bg-[#0A0E14] text-white font-inter overflow-hidden relative selection:bg-app-green/30">
      {/* 1. Header Ticker Marquee */}
      <div className="bg-[#10141a]/60 backdrop-blur-md border-b border-border-glass h-10 overflow-hidden flex items-center relative z-20">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap gap-8">
          {marqueeStocks.concat(marqueeStocks).map((item, idx) => {
            const isPos = !item.pct.startsWith('-');
            return (
              <div key={idx} className="inline-flex items-center gap-2 font-mono text-xs">
                <span className="font-semibold">{item.symbol}</span>
                <span className="text-text-muted">${item.price.toLocaleString()}</span>
                <span className={isPos ? 'text-app-green' : 'text-app-red'}>{item.pct}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-[#00FF94]/8 blur-[130px] pointer-events-none animate-aurora-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/6 blur-[130px] pointer-events-none animate-aurora-2" />

      {/* 2. Navigation */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-app-green/10 flex items-center justify-center border border-app-green/30">
            <Activity className="w-4 h-4 text-app-green animate-pulse" />
          </div>
          <span className="font-bold text-lg text-white tracking-tight">StockPulse</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary flex items-center gap-2 text-xs font-semibold"
        >
          Launch Terminal <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* 3. Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative z-20 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6 max-w-3xl"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-app-green/10 text-app-green border border-app-green/20 text-xs font-semibold tracking-wide uppercase">
            <Cpu className="w-3.5 h-3.5" /> Next-Gen Quantitative Analytics
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            The Institutional <br />
            <span className="bg-gradient-to-r from-app-green via-cyan-400 to-indigo-500 bg-clip-text text-transparent">
              Trading Terminal
            </span>
          </h1>

          <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-xl mx-auto">
            Supercharge your market edge. Simulate WebSocket pricing queues, calculate portfolio Sharpe ratios, trigger live technical indicator overlays, and run historical market backtests in real-time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-app-green text-black font-bold text-sm hover:shadow-glow-green hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" /> Enter Application
            </button>
            <button
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-border-glass bg-surface-glass text-white font-semibold text-sm hover:bg-white/5 transition-all flex items-center justify-center"
            >
              Explore Architecture
            </button>
          </div>

          {/* Social Proof Row */}
          <div className="pt-12 pb-4">
            <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-semibold mb-6">
              Empowering leading quantitative teams globally
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 text-sm font-bold tracking-tight text-white/40">
              <span className="hover:text-white transition-colors cursor-default font-serif italic text-lg">Goldman Sachs</span>
              <span className="hover:text-white transition-colors cursor-default font-sans tracking-wide text-base">BlackRock</span>
              <span className="hover:text-white transition-colors cursor-default font-serif text-lg">Sequoia</span>
              <span className="hover:text-white transition-colors cursor-default font-mono uppercase tracking-widest text-sm">Citadel</span>
              <span className="hover:text-white transition-colors cursor-default font-mono font-black text-base">Y Combinator</span>
            </div>
          </div>
        </motion.div>

        {/* Hero Mockup Panel */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="w-full max-w-5xl mt-16 p-2 rounded-2xl border border-border-glass bg-[#10141a]/40 shadow-[0_0_50px_rgba(0,0,0,0.8)] backdrop-blur-md relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-app-green/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2 border-b border-border-glass text-[10px] font-mono select-none">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-text-muted">stockpulse://terminal-dashboard</span>
            </div>
            
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/5">
              <button 
                onClick={() => setMockupTab('feeds')}
                className={`px-2 py-0.5 rounded transition-all duration-200 ${mockupTab === 'feeds' ? 'bg-[#0E1218] text-app-green shadow-sm' : 'text-text-muted hover:text-white'}`}
              >
                Live Market Feeds
              </button>
              <button 
                onClick={() => setMockupTab('risk')}
                className={`px-2 py-0.5 rounded transition-all duration-200 ${mockupTab === 'risk' ? 'bg-[#0E1218] text-app-green shadow-sm' : 'text-text-muted hover:text-white'}`}
              >
                Risk Evaluation
              </button>
              <button 
                onClick={() => setMockupTab('ledger')}
                className={`px-2 py-0.5 rounded transition-all duration-200 ${mockupTab === 'ledger' ? 'bg-[#0E1218] text-app-green shadow-sm' : 'text-text-muted hover:text-white'}`}
              >
                Execution Ledger
              </button>
            </div>
          </div>
          
          <div className="aspect-[16/9] w-full bg-[#0E1218]/90 p-6 flex flex-col justify-between text-left font-mono">
            {mockupTab === 'feeds' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-[#8A8F98]">
                  <p className="text-app-green">{`> Connection status: CONNECTED (wss://api.stockpulse.ai/live/v1)`}</p>
                  <p>{`> Initializing historical replay buffer: [====================] 1000/1000 ticks loaded`}</p>
                  <p>{`> Activating technical indicator computations: SMA, EMA, Bollinger, RSI, MACD...`}</p>
                  <p className="text-cyan-400">{`> Portfolio Beta evaluated: 1.32 (Concentration: Technology 68.3%)`}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-border-glass/40 pt-4">
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">PORTFOLIO SHARPE</span>
                    <span className="text-lg font-bold text-white">2.41</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">REPLAY STATUS</span>
                    <span className="text-lg font-bold text-app-green">LIVE STREAMING</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">WEBSOCKET RATE</span>
                    <span className="text-lg font-bold text-cyan-400">42 msgs/sec</span>
                  </div>
                </div>
              </div>
            )}

            {mockupTab === 'risk' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 text-xs text-[#8A8F98]">
                  <div className="flex items-center justify-between border-b border-white/5 pb-1">
                    <span className="text-white/90 font-semibold">{`> PORTFOLIO RISK PROFILE`}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFC000]/10 text-[#FFC000] border border-[#FFC000]/20">MODERATE</span>
                  </div>
                  <p>{`> Sharpe Ratio: 2.41 | Sortino Ratio: 2.89 | Max Drawdown: -12.4%`}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Technology Exposure (Drift: +8.3%)</span>
                      <span className="text-app-red">68.3% / 60.0% Target</span>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-app-red h-full rounded-full" style={{ width: '68.3%' }} />
                    </div>
                  </div>
                  <p className="text-cyan-400">{`> Suggested Rebalance: Reduce tech allocation by 8.3%, purchase defensive equities.`}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-border-glass/40 pt-4">
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">PORTFOLIO BETA</span>
                    <span className="text-lg font-bold text-white">1.32</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">HEALTH SCORE</span>
                    <span className="text-lg font-bold text-app-green">87 / 100</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">VAR (95% 1-DAY)</span>
                    <span className="text-lg font-bold text-cyan-400">-$4,210 (2.1%)</span>
                  </div>
                </div>
              </div>
            )}

            {mockupTab === 'ledger' && (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-2 text-xs text-[#8A8F98]">
                  <div className="grid grid-cols-6 text-text-muted border-b border-white/5 pb-1 font-semibold text-[10px]">
                    <span>ID</span>
                    <span>SYMBOL</span>
                    <span>SIDE</span>
                    <span>QTY</span>
                    <span>PRICE</span>
                    <span className="text-right">STATUS</span>
                  </div>
                  <div className="grid grid-cols-6 py-0.5 text-white/90">
                    <span className="text-text-muted">#0982</span>
                    <span>NVDA</span>
                    <span className="text-app-green font-bold">BUY</span>
                    <span>50</span>
                    <span>$903.20</span>
                    <span className="text-app-green text-right">FILLED</span>
                  </div>
                  <div className="grid grid-cols-6 py-0.5 text-white/90">
                    <span className="text-text-muted">#0981</span>
                    <span>AAPL</span>
                    <span className="text-app-red font-bold">SELL</span>
                    <span>100</span>
                    <span>$189.50</span>
                    <span className="text-app-green text-right">FILLED</span>
                  </div>
                  <div className="grid grid-cols-6 py-0.5 text-white/90">
                    <span className="text-text-muted">#0980</span>
                    <span>TSLA</span>
                    <span className="text-app-green font-bold">BUY</span>
                    <span>20</span>
                    <span>$177.10</span>
                    <span className="text-app-green text-right">FILLED</span>
                  </div>
                  <p className="text-text-muted text-[10px] pt-1">{`> Total transactions logged in current session: 48 | Realized P&L: +$2,340.50`}</p>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t border-border-glass/40 pt-4">
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">REALIZED P&L</span>
                    <span className="text-lg font-bold text-app-green">+$2,340.50</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">COMMISSIONS</span>
                    <span className="text-lg font-bold text-white">$12.40</span>
                  </div>
                  <div className="p-3 bg-white/2 rounded-lg border border-white/5">
                    <span className="text-[10px] text-text-muted block">UNREALIZED P&L</span>
                    <span className="text-lg font-bold text-app-green">+$11,840.00</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* 4. Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-border-glass/40 relative z-20">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold">Built for Real-Time Execution</h2>
          <p className="text-xs sm:text-sm text-text-muted">
            Engineered with a clean separation between reactive state layers and execution services.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-[#10141a]/40 border border-border-glass hover:border-app-green/30 transition-all group">
            <Play className="w-8 h-8 text-app-green mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-base mb-2">Market Replay Engine</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Step backward or fast-forward through 1000 ticks of price history at up to 10x speeds to backtest execution strategies.
            </p>
          </div>
          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-[#10141a]/40 border border-border-glass hover:border-app-green/30 transition-all group">
            <Compass className="w-8 h-8 text-app-green mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-base mb-2">Advanced Visualizations</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Overlay SMA/EMA, Bollinger Bands, and oscillators like RSI and MACD computed via custom client-side TypeScript.
            </p>
          </div>
          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-[#10141a]/40 border border-border-glass hover:border-app-green/30 transition-all group">
            <Cpu className="w-8 h-8 text-app-green mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-base mb-2">Portfolio risk analytics</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Evaluate Sharpe Ratio, Beta correlation, realized trade P/L ledgers, and backtest custom target allocations.
            </p>
          </div>
          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-[#10141a]/40 border border-border-glass hover:border-app-green/30 transition-all group">
            <Layers className="w-8 h-8 text-app-green mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-base mb-2">AI Copilot Chat Engine</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Execute buy/sell trades or evaluate volatility comparisons dynamically through a state-persistent, context-aware chatbot.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-border-glass/40 py-12 relative z-20">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-app-green" />
            <span className="font-bold text-white">StockPulse</span>
            <span>• Next-Gen Trading Terminal Sandbox</span>
          </div>
          <div>© 2026 StockPulse. Senior Staff Engineering Showcase.</div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
