import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ChevronDown, ChevronUp, RotateCcw, Trash2 } from 'lucide-react';
import type { ScanHistoryEntry } from '../../store/ScanHistoryStore';
import { useScanHistoryStore } from '../../store/ScanHistoryStore';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';

interface Props {
  onRestoreFilters: (filters: ScreenerFilterState) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function FilterPill({ label }: { label: string }) {
  return (
    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-border-glass text-text-muted">
      {label}
    </span>
  );
}

function ScanCard({ entry, onRestore }: { entry: ScanHistoryEntry; onRestore: () => void }) {
  const f = entry.filters;
  const pills: string[] = [];
  if (f.priceRange) pills.push(`Price: ${f.priceRange}`);
  if (f.marketCap) pills.push(`Cap: ${f.marketCap}`);
  if (f.volume) pills.push(`Vol: ${f.volume}`);
  if (f.performance) pills.push(f.performance);
  if (f.sectors.length) pills.push(f.sectors.join(', '));
  if (f.beta) pills.push(`β: ${f.beta}`);
  if (f.searchQuery) pills.push(`"${f.searchQuery}"`);

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border-glass hover:border-white/15 transition-colors group">
      <div className="mt-0.5">
        <Clock className="w-4 h-4 text-text-muted" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] text-text-muted">{formatTime(entry.timestamp)}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-app-green/10 border border-app-green/20 text-[9px] font-bold text-app-green">
            {entry.matchCount} matches
          </span>
        </div>
        {pills.length > 0 ? (
          <div className="flex flex-wrap gap-1 mb-1.5">
            {pills.map((p) => <FilterPill key={p} label={p} />)}
          </div>
        ) : (
          <p className="text-[10px] text-text-muted mb-1.5 italic">No filters applied</p>
        )}
        {entry.topStocks.length > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-text-muted">
            Top:
            {entry.topStocks.map((s) => (
              <span key={s.symbol} className="text-white font-bold">{s.symbol}</span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onRestore}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg border border-border-glass text-text-muted hover:text-app-green hover:border-app-green/30"
        title="Rerun this scan"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export const ScreenerScanHistory: React.FC<Props> = ({ onRestoreFilters }) => {
  const { history, clearHistory } = useScanHistoryStore();
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl border border-border-glass overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-bold text-white">Scan History</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 border border-border-glass text-text-muted">
            {history.length}
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              <div className="flex justify-end">
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1 text-[10px] text-text-muted hover:text-app-red transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> Clear All
                </button>
              </div>
              {history.map((entry) => (
                <ScanCard
                  key={entry.id}
                  entry={entry}
                  onRestore={() => onRestoreFilters(entry.filters)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
