import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { Compass, Sparkles, AlertTriangle, ShieldCheck, Plus, Check, Clipboard } from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { useAlertStore } from '../../store/useAlertStore';
import { calculateMarketIntelligence } from './utils/intelCalculations';
import type { MarketIntelligence } from './utils/intelCalculations';

// Subcomponents
import { MarketHealthScore } from './MarketHealthScore';
import { MarketRegime } from './MarketRegime';
import { FearGreedGauge } from './FearGreedGauge';
import { MarketNarrative } from './MarketNarrative';
import { MarketInternals } from './MarketInternals';
import { MarketBreadth } from './MarketBreadth';
import { SectorRotation } from './SectorRotation';
import { InstitutionalFlow } from './InstitutionalFlow';
import { MarketTimeline } from './MarketTimeline';
import type { TimelineEvent } from './MarketTimeline';

export const MarketIntelligencePage: React.FC = () => {
  const navigate = useNavigate();
  const { stocks, indices } = useMarketStore();
  const { createAlert, alerts } = useAlertStore();

  const [intel, setIntel] = useState<MarketIntelligence | null>(null);
  const [liveTimelineEvents, setLiveTimelineEvents] = useState<TimelineEvent[]>([]);

  // Throttled calculation: run every 1500ms
  useEffect(() => {
    if (stocks.length === 0 || indices.length === 0) return;

    // Initial run
    const initialIntel = calculateMarketIntelligence(stocks, indices);
    setIntel(initialIntel);

    const intervalId = setInterval(() => {
      setIntel(prevIntel => {
        const nextIntel = calculateMarketIntelligence(stocks, indices);
        
        // Dynamic Timeline Events Generator
        if (prevIntel) {
          const newEvents: TimelineEvent[] = [];
          const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

          // 1. Regime shift
          if (nextIntel.regime !== prevIntel.regime) {
            newEvents.push({
              id: `live-regime-${Date.now()}`,
              time: currentTime,
              title: `Market Regime Shift: ${nextIntel.regime}`,
              description: `Index momentum and breadth metrics shifted the market regime to ${nextIntel.regime}.`,
              type: nextIntel.regime === 'Risk-On' ? 'success' : nextIntel.regime === 'Risk-Off' ? 'danger' : 'info'
            });
          }

          // 2. F&G thresholds crossed
          if (prevIntel.fgScore < 70 && nextIntel.fgScore >= 70) {
            newEvents.push({
              id: `live-fg-70-${Date.now()}`,
              time: currentTime,
              title: 'Sentiment Greed Threshold Breached',
              description: `Fear & Greed Index crossed into Greed territory at ${nextIntel.fgScore}.`,
              type: 'alert'
            });
          } else if (prevIntel.fgScore > 30 && nextIntel.fgScore <= 30) {
            newEvents.push({
              id: `live-fg-30-${Date.now()}`,
              time: currentTime,
              title: 'Sentiment Fear Threshold Breached',
              description: `Fear & Greed Index breached Fear threshold down to ${nextIntel.fgScore}.`,
              type: 'danger'
            });
          }

          // 3. Breadth thresholds
          if (prevIntel.breadth.breadthPct < 75 && nextIntel.breadth.breadthPct >= 75) {
            newEvents.push({
              id: `live-breadth-75-${Date.now()}`,
              time: currentTime,
              title: 'Breadth Expansion (>75% Advancing)',
              description: `Market breadth expanded bullishly with ${Math.round(nextIntel.breadth.breadthPct)}% of stocks advancing.`,
              type: 'success'
            });
          }

          if (newEvents.length > 0) {
            setLiveTimelineEvents(prev => [...newEvents, ...prev]);
          }
        }

        return nextIntel;
      });
    }, 1500);

    return () => clearInterval(intervalId);
  }, [stocks, indices]);

  // Alert form states
  const [alertTypeSelect, setAlertTypeSelect] = useState<'FEAR_GREED' | 'MARKET_HEALTH' | 'REGIME' | 'BREADTH'>('FEAR_GREED');
  const [alertCondition, setAlertCondition] = useState<'ABOVE' | 'BELOW' | 'RISK_ON' | 'RISK_OFF' | 'LEADERSHIP_CHANGE'>('ABOVE');
  const [alertThreshold, setAlertThreshold] = useState<number>(70);
  const [alertCreatedSuccess, setAlertCreatedSuccess] = useState(false);

  const handleCreateIntelAlert = (e: React.FormEvent) => {
    e.preventDefault();

    let targetType: any = 'FEAR_GREED_ABOVE';
    let targetValue = alertThreshold;

    if (alertTypeSelect === 'FEAR_GREED') {
      targetType = alertCondition === 'ABOVE' ? 'FEAR_GREED_ABOVE' : 'FEAR_GREED_BELOW';
    } else if (alertTypeSelect === 'MARKET_HEALTH') {
      targetType = alertCondition === 'ABOVE' ? 'MARKET_HEALTH_ABOVE' : 'MARKET_HEALTH_BELOW';
    } else if (alertTypeSelect === 'BREADTH') {
      targetType = 'BREADTH_BELOW';
      targetValue = alertThreshold;
    } else if (alertTypeSelect === 'REGIME') {
      targetType = alertCondition === 'RISK_ON' ? 'RISK_ON_BEGINS' : alertCondition === 'RISK_OFF' ? 'RISK_OFF_BEGINS' : 'SECTOR_LEADERSHIP_CHANGE';
      targetValue = 0; // Trigger threshold doesn't apply to state switches
    }

    createAlert('$MARKET', targetType, targetValue);

    setAlertCreatedSuccess(true);
    setTimeout(() => setAlertCreatedSuccess(false), 2500);
  };

  // Filter out market-wide intelligence alerts to display
  const activeIntelAlerts = useMemo(() => {
    return alerts.filter(a => a.symbol === '$MARKET' && !a.isTriggered);
  }, [alerts]);

  // Render Skeletons on initial load
  if (!intel) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-3 w-60 bg-white/5 rounded animate-pulse" />
          </div>
        </div>

        {/* Top Row Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card h-[230px] p-5 border border-border-glass bg-[#10141a]/40 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-20 w-full bg-white/5 rounded-2xl" />
          </div>
          <div className="glass-card h-[230px] p-5 border border-border-glass bg-[#10141a]/40 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-20 w-full bg-white/5 rounded-2xl" />
          </div>
          <div className="glass-card h-[230px] p-5 border border-border-glass bg-[#10141a]/40 animate-pulse flex flex-col justify-between">
            <div className="h-4 w-28 bg-white/5 rounded" />
            <div className="h-20 w-full bg-white/5 rounded-2xl" />
          </div>
        </div>

        {/* Narrative Skeleton */}
        <div className="glass-card h-[130px] p-5 border border-border-glass bg-[#10141a]/30 animate-pulse space-y-3">
          <div className="h-4 w-48 bg-white/5 rounded" />
          <div className="h-3 w-full bg-white/5 rounded" />
          <div className="h-3 w-5/6 bg-white/5 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-container-max mx-auto pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-app-green/10 flex items-center justify-center border border-app-green/30">
            <Compass className="w-5 h-5 text-app-green animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Market Intelligence Center
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Live macro breadth, rotation structures, and institutional flow mapping.
            </p>
          </div>
        </div>

        {/* Live Refresh Badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-green opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-app-green"></span>
          </span>
          <span className="text-[10px] font-bold text-app-green font-mono uppercase tracking-wider">
            Feed Tick (1.5s)
          </span>
        </div>
      </div>

      {/* TIER 1: Top Indicators Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <MarketHealthScore
          healthScore={intel.healthScore}
          confidence={intel.healthConfidence}
        />
        <MarketRegime
          regime={intel.regime}
          regimeScore={intel.regimeScore}
          confidence={intel.regimeConfidence}
          explanations={intel.regimeExplanations}
        />
        <FearGreedGauge
          fgScore={intel.fgScore}
          fgLabel={intel.fgLabel}
          fgDetails={intel.fgDetails}
        />
      </div>

      {/* TIER 2: Narrative Engine */}
      <MarketNarrative intel={intel} />

      {/* TIER 3: Internals & Breadth Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <MarketInternals intel={intel} />
        <MarketBreadth breadth={intel.breadth} />
      </div>

      {/* TIER 4: Sector Rotation & Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sector Wheel, Table, Drilldown takes 8 columns */}
        <div className="lg:col-span-8">
          <SectorRotation sectors={intel.sectors} />
        </div>
        
        {/* Institutional Flow takes 4 columns */}
        <div className="lg:col-span-4">
          <InstitutionalFlow intel={intel} />
        </div>
      </div>

      {/* TIER 5: Movers Heat Strip & Alerts Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Movers Heat Strip Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 card-hover-lift">
            <div className="flex justify-between items-center pb-2.5 border-b border-border-glass/40 mb-3.5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Volume-Weighted Movers Heat Strip
              </h3>
              <span className="text-[9px] font-mono font-bold text-text-muted">
                TILE WIDTH = VOLUME | COLOR = GAIN/LOSS
              </span>
            </div>

            {/* Horizontal Heat Strip */}
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2 overflow-x-auto py-2 scrollbar-none snap-x w-full">
              {intel.heatStripStocks.map((stock) => {
                const isPos = stock.changePercent >= 0;
                
                // Opacity intensity based on performance strength
                const alpha = Math.min(0.95, 0.15 + Math.abs(stock.changePercent) * 0.28);
                const tileBg = isPos 
                  ? `rgba(0, 255, 148, ${alpha})`
                  : `rgba(255, 59, 92, ${alpha})`;
                  
                const textColor = alpha > 0.45 ? 'text-black font-extrabold' : 'text-white font-bold';

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => navigate(`/stock/${stock.symbol}`)}
                    className={`h-[48px] rounded-xl flex flex-col justify-center px-3 cursor-pointer select-none transition-all hover:scale-[1.03] active:scale-[0.98] snap-start shrink-0`}
                    style={{
                      width: `${stock.relativeWidth * 1.5}px`,
                      backgroundColor: tileBg,
                      boxShadow: alpha > 0.6 ? `0 0 10px ${isPos ? 'rgba(0, 255, 148, 0.2)' : 'rgba(255, 59, 92, 0.2)'}` : undefined
                    }}
                    title={`${stock.symbol}: $${stock.price} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent}%) - Vol: ${(stock.volume / 1000000).toFixed(1)}M`}
                  >
                    <span className={`text-xs tracking-tight leading-none ${textColor}`}>{stock.symbol}</span>
                    <span className={`text-[9px] font-mono leading-none mt-0.5 opacity-90 ${textColor}`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Intelligence Alerts Integration Column */}
        <div className="lg:col-span-4">
          <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 h-full flex flex-col justify-between card-hover-lift">
            <div>
              <div className="flex justify-between items-center pb-2.5 border-b border-border-glass/40 mb-3.5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-app-green animate-pulse" /> Intel Alerts setup
                </h3>
                <span className="text-[9px] font-mono text-text-muted font-bold">
                  ACTIVE CRITERIA
                </span>
              </div>

              {/* Form to create intelligence alert */}
              <form onSubmit={handleCreateIntelAlert} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="text-text-muted font-bold block text-[10px] uppercase">Alert Parameter</label>
                  <select 
                    value={alertTypeSelect}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setAlertTypeSelect(val);
                      if (val === 'BREADTH') {
                        setAlertCondition('BELOW');
                        setAlertThreshold(45);
                      } else if (val === 'REGIME') {
                        setAlertCondition('RISK_ON');
                      } else {
                        setAlertCondition('ABOVE');
                        setAlertThreshold(70);
                      }
                    }}
                    className="w-full bg-surface-low border border-border-glass rounded px-2.5 py-1.5 text-white outline-none focus:border-app-green"
                  >
                    <option value="FEAR_GREED">Fear & Greed Index</option>
                    <option value="MARKET_HEALTH">Market Health Score</option>
                    <option value="REGIME">Regime Engine Swaps</option>
                    <option value="BREADTH">Advance/Decline Breadth %</option>
                  </select>
                </div>

                {alertTypeSelect !== 'BREADTH' && (
                  <div className="space-y-1">
                    <label className="text-text-muted font-bold block text-[10px] uppercase">Condition</label>
                    <select
                      value={alertCondition}
                      onChange={(e) => setAlertCondition(e.target.value as any)}
                      className="w-full bg-surface-low border border-border-glass rounded px-2.5 py-1.5 text-white outline-none focus:border-app-green"
                    >
                      {alertTypeSelect === 'REGIME' ? (
                        <>
                          <option value="RISK_ON">Switches to Risk-On</option>
                          <option value="RISK_OFF">Switches to Risk-Off</option>
                          <option value="LEADERSHIP_CHANGE">Sector Leadership Changes</option>
                        </>
                      ) : (
                        <>
                          <option value="ABOVE">Greater Than (&gt;)</option>
                          <option value="BELOW">Less Than (&lt;)</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {alertTypeSelect !== 'REGIME' && (
                  <div className="space-y-1">
                    <label className="text-text-muted font-bold block text-[10px] uppercase">Threshold Value</label>
                    <input 
                      type="number"
                      min="1"
                      max="99"
                      value={alertThreshold}
                      onChange={(e) => setAlertThreshold(Number(e.target.value))}
                      className="w-full bg-surface-low border border-border-glass rounded px-2.5 py-1.5 text-white outline-none focus:border-app-green font-mono"
                    />
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full bg-app-green hover:shadow-glow-green-sm text-black font-extrabold py-2 px-4 rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  {alertCreatedSuccess ? (
                    <>
                      <Check className="w-4 h-4" /> Registered Alert!
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Register Intel Alert
                    </>
                  )}
                </button>
              </form>

              {/* Active Rules List */}
              <div className="mt-4 pt-3 border-t border-border-glass/30">
                <span className="text-[8px] font-extrabold uppercase text-text-muted tracking-wider block mb-2">
                  Active Intel Rules ({activeIntelAlerts.length})
                </span>
                <div className="space-y-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {activeIntelAlerts.map(a => {
                    let desc = '';
                    if (a.type.includes('FEAR_GREED')) desc = `Fear & Greed ${a.type.includes('ABOVE') ? '>' : '<'} ${a.value}`;
                    else if (a.type.includes('MARKET_HEALTH')) desc = `Health Score ${a.type.includes('ABOVE') ? '>' : '<'} ${a.value}`;
                    else if (a.type.includes('BREADTH')) desc = `Breadth < ${a.value}%`;
                    else if (a.type === 'RISK_ON_BEGINS') desc = 'Regime Fips to Risk-On';
                    else if (a.type === 'RISK_OFF_BEGINS') desc = 'Regime Flips to Risk-Off';
                    else if (a.type === 'SECTOR_LEADERSHIP_CHANGE') desc = 'Sector Leadership Swap';

                    return (
                      <div key={a.id} className="flex justify-between items-center py-1 px-2 bg-white/2 rounded-lg text-[10px] text-[#dfe2eb] border border-white/5 font-mono">
                        <span>{desc}</span>
                        <span className="text-app-green font-bold uppercase text-[8px] border border-app-green/20 px-1 py-0.5 rounded bg-app-green/5">Active</span>
                      </div>
                    );
                  })}
                  {activeIntelAlerts.length === 0 && (
                    <span className="text-[10px] text-text-muted italic">No macro alerts configured.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TIER 6: Market Session Timeline */}
      <MarketTimeline liveEvents={liveTimelineEvents} />

    </div>
  );
};
export default MarketIntelligencePage;
