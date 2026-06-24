import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Newspaper, Zap, TrendingUp, TrendingDown, Minus,
  AlertCircle, Radio, Search, BarChart2, LayoutGrid, Maximize2
} from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { STATIC_ARTICLES } from '../../store/NewsStore';
import { NewsFeed } from './NewsFeed';
import { CatalystTimeline } from './CatalystTimeline';
import { EarningsCenter } from './EarningsCenter';
import { MarketSentiment } from './MarketSentiment';
import { SectorNews } from './SectorNews';
import { TrendingStocks } from './TrendingStocks';

// ─── Breaking News Banner ─────────────────────────────────────────────────────
const BreakingBanner: React.FC = () => {
  const breaking = STATIC_ARTICLES.filter((a) => a.isBreaking);
  const [idx, setIdx] = useState(0);
  const current = breaking[idx % breaking.length];
  if (!breaking.length || !current) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-app-red/8 border border-app-red/25 overflow-hidden"
    >
      <div className="flex items-center gap-2 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-red opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-app-red" />
        </span>
        <span className="text-[9px] font-black uppercase tracking-widest text-app-red">Breaking</span>
      </div>
      <p className="text-xs font-semibold text-white truncate flex-1">{current.headline}</p>
      <span className="text-[10px] text-text-muted shrink-0">{current.source}</span>
      {breaking.length > 1 && (
        <button
          onClick={() => setIdx((i) => i + 1)}
          className="text-[10px] text-text-muted hover:text-white transition-colors shrink-0 px-2 py-0.5 rounded border border-border-glass"
        >
          Next
        </button>
      )}
    </motion.div>
  );
};

// ─── Market Headlines Bar ─────────────────────────────────────────────────────
const MarketHeadlines: React.FC = () => {
  const { stocks } = useMarketStore();
  const advancing = stocks.filter((s) => s.changePercent > 0).length;
  const declining = stocks.filter((s) => s.changePercent < 0).length;
  const breadthPct = stocks.length > 0 ? Math.round((advancing / stocks.length) * 100) : 50;
  const avgChange = stocks.length > 0 ? stocks.reduce((s, x) => s + x.changePercent, 0) / stocks.length : 0;
  const regime = breadthPct > 55 ? 'Risk-On' : breadthPct < 45 ? 'Risk-Off' : 'Neutral';
  const regimeColor = regime === 'Risk-On' ? 'text-app-green' : regime === 'Risk-Off' ? 'text-app-red' : 'text-yellow-400';
  const raw = breadthPct * 0.6 + Math.max(0, Math.min(100, (avgChange + 3) / 6 * 100)) * 0.4;
  const fearGreed = Math.round(Math.max(0, Math.min(100, raw)));
  const fgLabel = fearGreed >= 75 ? 'Extreme Greed' : fearGreed >= 51 ? 'Greed' : fearGreed >= 26 ? 'Fear' : 'Extreme Fear';

  const stats = [
    { label: 'Regime', value: regime, color: regimeColor },
    { label: 'Advancing', value: `${advancing}`, color: 'text-app-green' },
    { label: 'Declining', value: `${declining}`, color: 'text-app-red' },
    { label: 'Breadth', value: `${breadthPct}%`, color: breadthPct > 55 ? 'text-app-green' : 'text-app-red' },
    { label: 'Avg Δ', value: `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`, color: avgChange >= 0 ? 'text-app-green' : 'text-app-red' },
    { label: 'Stocks', value: stocks.length.toLocaleString(), color: 'text-white' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-6 overflow-x-auto px-4 py-3.5 glass-card rounded-xl border border-border-glass h-full"
    >
      {stats.map((stat, i) => (
        <React.Fragment key={stat.label}>
          {i > 0 && <div className="h-6 w-px bg-border-glass shrink-0" />}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">{stat.label}</span>
            <span className={`text-xs font-bold font-mono ${stat.color}`}>{stat.value}</span>
          </div>
        </React.Fragment>
      ))}
    </motion.div>
  );
};

// ─── Compact Sentiment Card ───────────────────────────────────────────────────
const CompactSentimentCard: React.FC = () => {
  const { stocks } = useMarketStore();
  const advancing = stocks.filter((s) => s.changePercent > 0).length;
  const breadthPct = stocks.length > 0 ? Math.round((advancing / stocks.length) * 100) : 50;

  const newsSentiment = useMemo(() => {
    const total = STATIC_ARTICLES.length;
    const bullishCount = STATIC_ARTICLES.filter((a) => a.sentiment === 'Bullish').length;
    return total > 0 ? (bullishCount / total) * 100 : 50;
  }, []);

  const score = Math.max(0, Math.min(100, newsSentiment * 0.6 + breadthPct * 0.4));
  const label = score >= 75 ? 'Extreme Greed' : score >= 51 ? 'Greed' : score >= 26 ? 'Fear' : 'Extreme Fear';
  const colorClass = score >= 75 ? 'text-app-green' : score <= 35 ? 'text-app-red' : 'text-yellow-400';

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5 glass-card rounded-xl border border-border-glass h-full">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[9px] uppercase tracking-widest text-text-muted font-bold">Fear & Greed</span>
        <span className={`text-xs font-black ${colorClass} tracking-wide`}>
          {Math.round(score)} · {label}
        </span>
        <p className="text-[9px] text-text-muted truncate">Breadth and sentiment combined</p>
      </div>
      <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-10 h-10 transform -rotate-90">
          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" />
          <motion.circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeDasharray="100 100"
            className={colorClass}
            initial={{ strokeDashoffset: 100 }}
            animate={{ strokeDashoffset: 100 - score }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute text-[10px] font-black font-mono text-white">{Math.round(score)}</span>
      </div>
    </div>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────
type PageTab = 'news' | 'catalyst' | 'earnings' | 'sentiment' | 'sectors';
type ViewMode = 'terminal' | 'focused';

const TABS: { id: PageTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'news', label: 'News Feed', icon: Newspaper },
  { id: 'catalyst', label: 'Catalyst Timeline', icon: Zap },
  { id: 'earnings', label: 'Earnings Calendar', icon: BarChart2 },
  { id: 'sentiment', label: 'Market Sentiment', icon: Radio },
  { id: 'sectors', label: 'Sector News', icon: TrendingUp },
];

// ─── Main page ────────────────────────────────────────────────────────────────
export const NewsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PageTab>('news');
  const [viewMode, setViewMode] = useState<ViewMode>('terminal');

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-80px)] overflow-hidden">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
            <Newspaper className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">News & Catalyst Engine</h1>
            <p className="text-[10px] text-text-muted">Bloomberg · MarketWatch · Benzinga · TradingView</p>
          </div>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border-glass bg-surface-lowest/60">
          <button
            onClick={() => setViewMode('terminal')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
              viewMode === 'terminal'
                ? 'bg-white/8 text-white border border-white/10 shadow-sm'
                : 'text-text-muted hover:text-white'
            }`}
            title="Terminal Workspace View"
          >
            <LayoutGrid className="w-3 h-3" />
            Terminal View
          </button>
          <button
            onClick={() => setViewMode('focused')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150 ${
              viewMode === 'focused'
                ? 'bg-white/8 text-white border border-white/10 shadow-sm'
                : 'text-text-muted hover:text-white'
            }`}
            title="Single Focus View"
          >
            <Maximize2 className="w-3 h-3" />
            Focused View
          </button>
        </div>
      </motion.div>

      {/* Breaking news banner */}
      <BreakingBanner />

      {/* Top Row: Market Headlines + Market Sentiment Dial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
        <div className="lg:col-span-2">
          <MarketHeadlines />
        </div>
        <div>
          <CompactSentimentCard />
        </div>
      </div>

      {/* Main Grid View */}
      {viewMode === 'terminal' ? (
        // Bloomberg-style terminal workspace
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 flex-1 min-h-0 pb-4">
          {/* Left Column: News Feed */}
          <div className="glass-card border border-border-glass rounded-xl p-4 flex flex-col h-full min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Newspaper className="w-4 h-4 text-yellow-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">News Feed</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <NewsFeed />
            </div>
          </div>

          {/* Center Column: Catalyst Timeline */}
          <div className="glass-card border border-border-glass rounded-xl p-4 flex flex-col h-full min-h-0">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <Zap className="w-4 h-4 text-blue-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Catalyst Timeline</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              <CatalystTimeline />
            </div>
          </div>

          {/* Right Column: Stack of trending, sectors, earnings */}
          <div className="glass-card border border-border-glass rounded-xl p-4 flex flex-col h-full min-h-0 xl:col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <LayoutGrid className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Market Intelligence</h2>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-6">
              <div className="border-b border-border-glass pb-6">
                <TrendingStocks />
              </div>
              <div className="border-b border-border-glass pb-6">
                <SectorNews />
              </div>
              <div>
                <EarningsCenter />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Focused single-tab view
        <div className="flex flex-col gap-4 flex-1 min-h-0 pb-4">
          {/* Tab bar selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.02] border border-border-glass w-fit shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? 'bg-white/8 text-white border border-border-glass shadow-sm'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content wrapper */}
          <div className="glass-card border border-border-glass rounded-xl p-6 flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'news' ? (
              <NewsFeed />
            ) : activeTab === 'catalyst' ? (
              <CatalystTimeline />
            ) : activeTab === 'earnings' ? (
              <EarningsCenter />
            ) : activeTab === 'sentiment' ? (
              <MarketSentiment />
            ) : (
              <SectorNews />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;
