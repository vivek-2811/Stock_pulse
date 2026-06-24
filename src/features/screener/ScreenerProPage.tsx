import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Save, FolderOpen, Bell, BellOff, Zap, LayoutList, Grid3X3,
  Trash2, Edit2, CheckCircle, X, Plus
} from 'lucide-react';
import { useMarketStore } from '../../store/useMarketStore';
import { useSavedScreensStore } from '../../store/SavedScreensStore';
import { useScanHistoryStore } from '../../store/ScanHistoryStore';
import { useAlertStore } from '../../store/useAlertStore';
import { EMPTY_FILTERS, SMART_SCANS, applyFilters, computeOpportunityScore } from './screenerUtils';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';
import type { Stock } from '../../services/mockDataEngine';

import { ScreenerMarketContext } from './ScreenerMarketContext';
import { ScreenerStatsBar } from './ScreenerStatsBar';
import { ScreenerInsights } from './ScreenerInsights';
import { ScreenerFilters } from './ScreenerFilters';
import { ScreenerResults } from './ScreenerResults';
import { ScreenerQuickPreview } from './ScreenerQuickPreview';
import { ScreenerCompareDrawer } from './ScreenerCompareDrawer';
import { ScreenerScanHistory } from './ScreenerScanHistory';

// ─── Saved Screens Panel ──────────────────────────────────────────────────────
function SavedScreensPanel({
  onLoad,
  currentFilters,
  filteredCount,
  topSymbol,
}: {
  onLoad: (filters: ScreenerFilterState) => void;
  currentFilters: ScreenerFilterState;
  filteredCount: number;
  topSymbol: string | null;
}) {
  const { screens, saveScreen, deleteScreen, renameScreen, toggleAlert, updateRunStats } = useSavedScreensStore();
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const handleSave = () => {
    if (!saveName.trim()) return;
    saveScreen(saveName.trim(), currentFilters, filteredCount, topSymbol);
    setSaveName('');
    setSaving(false);
  };

  const handleLoad = (id: string) => {
    const screen = screens.find((s) => s.id === id);
    if (!screen) return;
    updateRunStats(id, filteredCount, topSymbol);
    onLoad(screen.filters);
  };

  return (
    <div className="glass-card rounded-2xl border border-border-glass overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-glass">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-app-green" />
          <span className="text-xs font-bold text-white">Saved Screens</span>
        </div>
        <button
          onClick={() => setSaving((p) => !p)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-app-green hover:underline"
        >
          <Save className="w-3 h-3" /> Save Current
        </button>
      </div>

      {/* Save form */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border-glass"
          >
            <div className="px-4 py-3 flex gap-2">
              <input
                autoFocus
                type="text"
                placeholder="Screen name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                className="flex-1 bg-surface-lowest border border-border-glass rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-text-muted outline-none focus:border-app-green/50 transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 rounded-lg bg-app-green/15 border border-app-green/30 text-app-green text-[11px] font-bold disabled:opacity-40 hover:bg-app-green/25 transition-colors"
              >
                Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Screen list */}
      <div className="divide-y divide-border-glass/50 max-h-64 overflow-y-auto">
        {screens.length === 0 ? (
          <p className="text-xs text-text-muted px-4 py-4 text-center">No saved screens yet</p>
        ) : (
          screens.map((screen) => {
            const prev = screen.runHistory.length > 1 ? screen.runHistory[1].matchCount : null;
            const curr = screen.matchCount;
            const delta = prev !== null ? Math.round(((curr - prev) / Math.max(prev, 1)) * 100) : null;

            return (
              <div key={screen.id} className="px-4 py-3 hover:bg-white/[0.02] group transition-colors">
                {renameId === screen.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { renameScreen(screen.id, renameVal); setRenameId(null); }
                        if (e.key === 'Escape') setRenameId(null);
                      }}
                      className="flex-1 bg-surface-lowest border border-border-glass rounded px-2 py-1 text-xs text-white outline-none focus:border-app-green/50"
                    />
                    <button onClick={() => { renameScreen(screen.id, renameVal); setRenameId(null); }} className="text-app-green">
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => handleLoad(screen.id)}
                        className="text-xs font-bold text-white hover:text-app-green transition-colors text-left"
                      >
                        {screen.name}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                          onClick={() => { setRenameId(screen.id); setRenameVal(screen.name); }}
                          className="p-1 text-text-muted hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => toggleAlert(screen.id)}
                          className={`p-1 transition-colors ${screen.hasAlert ? 'text-yellow-400' : 'text-text-muted hover:text-yellow-400'}`}
                        >
                          {screen.hasAlert ? <Bell className="w-3 h-3" /> : <BellOff className="w-3 h-3" />}
                        </button>
                        <button onClick={() => deleteScreen(screen.id)} className="p-1 text-text-muted hover:text-app-red transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted">{curr} matches</span>
                      {screen.topStock && (
                        <span className="text-[10px] text-text-muted">· Top: <span className="text-white font-bold">{screen.topStock}</span></span>
                      )}
                      {delta !== null && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          delta > 0
                            ? 'text-app-green bg-app-green/10 border-app-green/20'
                            : delta < 0
                            ? 'text-app-red bg-app-red/10 border-app-red/20'
                            : 'text-text-muted bg-white/5 border-border-glass'
                        }`}>
                          {delta > 0 ? '+' : ''}{delta}%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ScreenerProPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { stocks: allStocks } = useMarketStore();
  const { addToHistory } = useScanHistoryStore();

  // Filters
  const [filters, setFilters] = useState<ScreenerFilterState>(EMPTY_FILTERS);
  const [viewMode, setViewMode] = useState<'table' | 'heatmap'>('table');
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [hoveredStock, setHoveredStock] = useState<Stock | null>(null);
  const [previewPinned, setPreviewPinned] = useState(false);

  // Scan complete pulse state
  const [scanPulse, setScanPulse] = useState(false);
  const prevCountRef = useRef(0);

  // Debounced filtered stocks (500ms)
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedFilters(filters), 500);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [filters]);

  const filteredStocks = useMemo(
    () => applyFilters(allStocks, debouncedFilters),
    [allStocks, debouncedFilters]
  );

  const topSymbol = useMemo(() => {
    if (filteredStocks.length === 0) return null;
    return [...filteredStocks].sort((a, b) => computeOpportunityScore(b) - computeOpportunityScore(a))[0]?.symbol ?? null;
  }, [filteredStocks]);

  // Handle URL params (command palette deep-links)
  useEffect(() => {
    const preset = searchParams.get('preset');
    const action = searchParams.get('action');
    if (preset && SMART_SCANS[preset]) {
      setFilters(SMART_SCANS[preset].filters);
    }
    if (action === 'save') {
      // Will be handled by the SavedScreensPanel opening via auto-expand
    }
  }, [searchParams]);

  // Scan pulse effect when result count changes
  useEffect(() => {
    if (filteredStocks.length !== prevCountRef.current && prevCountRef.current !== 0) {
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 700);
    }
    prevCountRef.current = filteredStocks.length;
  }, [filteredStocks.length]);

  // Add to scan history on filter change
  useEffect(() => {
    if (filteredStocks.length === 0) return;
    const topStocks = [...filteredStocks]
      .sort((a, b) => computeOpportunityScore(b) - computeOpportunityScore(a))
      .slice(0, 3)
      .map((s) => ({ symbol: s.symbol, name: s.name, score: computeOpportunityScore(s) }));
    addToHistory({
      timestamp: new Date().toISOString(),
      filters: debouncedFilters,
      matchCount: filteredStocks.length,
      topStocks,
    });
  }, [filteredStocks.length, debouncedFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const handleHover = (stock: Stock | null) => {
    if (!previewPinned) setHoveredStock(stock);
  };

  const activePreviewStock = hoveredStock;

  // Stagger section reveals
  const sectionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.35 } }),
  };

  return (
    <div className="space-y-4 pb-32">
      {/* Page Header */}
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-app-green/10 border border-app-green/25 flex items-center justify-center">
              <Zap className="w-4 h-4 text-app-green" />
            </div>
            Screener Pro
          </h1>
          <p className="text-xs text-text-muted mt-1">Stock discovery platform · {allStocks.length} stocks live</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-border-glass bg-surface-lowest/60">
          {(['table', 'heatmap'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                viewMode === mode
                  ? 'bg-app-green/15 text-app-green border border-app-green/30'
                  : 'text-text-muted hover:text-white'
              }`}
            >
              {mode === 'table' ? <LayoutList className="w-3.5 h-3.5" /> : <Grid3X3 className="w-3.5 h-3.5" />}
              {mode === 'table' ? 'Table' : 'Heatmap'}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Smart Scans */}
      <motion.div custom={0.5} initial="hidden" animate="visible" variants={sectionVariants}>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SMART_SCANS).map(([key, scan]) => {
            const isActive = JSON.stringify(filters) === JSON.stringify(scan.filters);
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilters(isActive ? EMPTY_FILTERS : scan.filters)}
                title={scan.description}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-app-green/15 border-app-green/40 text-app-green shadow-glow-green-sm'
                    : 'bg-white/3 border-border-glass text-text-muted hover:text-white hover:border-white/20'
                }`}
              >
                <span>{scan.emoji}</span>
                {scan.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Market Context Bar */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={sectionVariants}>
        <ScreenerMarketContext allStocks={allStocks} />
      </motion.div>

      {/* Stats Bar */}
      <motion.div custom={2} initial="hidden" animate="visible" variants={sectionVariants}>
        <ScreenerStatsBar filteredStocks={filteredStocks} />
      </motion.div>

      {/* Insights */}
      <motion.div custom={3} initial="hidden" animate="visible" variants={sectionVariants}>
        <ScreenerInsights filteredStocks={filteredStocks} allStocks={allStocks} />
      </motion.div>

      {/* Filters + Saved Screens + Scan History */}
      <motion.div custom={4} initial="hidden" animate="visible" variants={sectionVariants}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-3">
            <ScreenerFilters filters={filters} onChange={setFilters} />
            <SavedScreensPanel
              onLoad={setFilters}
              currentFilters={filters}
              filteredCount={filteredStocks.length}
              topSymbol={topSymbol}
            />
            <ScreenerScanHistory onRestoreFilters={setFilters} />
          </div>

          {/* Results + Preview */}
          <div className="lg:col-span-2 flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              {/* Scan pulse badge */}
              <div className="relative mb-2 h-6 flex items-center">
                <AnimatePresence>
                  {scanPulse && (
                    <motion.div
                      key="pulse"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.1 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-x-0 flex items-center justify-center"
                    >
                      <span className="px-3 py-1 rounded-full bg-app-green/15 border border-app-green/40 text-app-green text-[10px] font-bold shadow-glow-green-sm">
                        ✦ {filteredStocks.length} Matches Found
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <ScreenerResults
                stocks={filteredStocks}
                allStocks={allStocks}
                filters={debouncedFilters}
                onResetFilters={resetFilters}
                selectedSymbols={selectedSymbols}
                onSelectionChange={setSelectedSymbols}
                onHoverStock={handleHover}
                viewMode={viewMode}
              />
            </div>

            {/* Quick Preview Panel */}
            {activePreviewStock && (
              <ScreenerQuickPreview
                stock={activePreviewStock}
                filters={debouncedFilters}
                onClose={() => setHoveredStock(null)}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Compare Drawer */}
      {selectedSymbols.length >= 2 && (
        <ScreenerCompareDrawer
          selectedSymbols={selectedSymbols}
          allStocks={allStocks}
          onClear={() => setSelectedSymbols([])}
        />
      )}
    </div>
  );
};
