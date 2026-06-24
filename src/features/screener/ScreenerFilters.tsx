import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { ScreenerFilterState } from '../../store/SavedScreensStore';
import { SECTOR_UI_TO_DATA } from './screenerUtils';

interface Props {
  filters: ScreenerFilterState;
  onChange: (filters: ScreenerFilterState) => void;
}

const PRICE_OPTIONS = [
  { id: 'under10', label: 'Under $10' },
  { id: '10to50', label: '$10–$50' },
  { id: '50to100', label: '$50–$100' },
  { id: '100plus', label: '$100+' },
];

const MCAP_OPTIONS = [
  { id: 'small', label: 'Small Cap' },
  { id: 'mid', label: 'Mid Cap' },
  { id: 'large', label: 'Large Cap' },
];

const VOLUME_OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

const PERF_OPTIONS = [
  { id: 'gainers', label: 'Top Gainers' },
  { id: 'losers', label: 'Top Losers' },
  { id: 'momentum', label: 'High Momentum' },
];

const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Energy', 'Financials',
  'Consumer', 'Utilities', 'Industrials', 'Communication',
];

const BETA_OPTIONS = [
  { id: 'low', label: 'Low β' },
  { id: 'medium', label: 'Medium β' },
  { id: 'high', label: 'High β' },
];

function SingleToggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <motion.button
            key={opt.id}
            onClick={() => onChange(active ? null : opt.id)}
            whileTap={{ scale: 0.94 }}
            aria-pressed={active}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
              active
                ? 'bg-app-green/15 border-app-green/40 text-app-green'
                : 'bg-white/3 border-border-glass text-text-muted hover:text-white hover:border-white/20'
            }`}
          >
            {opt.label}
          </motion.button>
        );
      })}
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">{label}</p>
      {children}
    </div>
  );
}

export const ScreenerFilters: React.FC<Props> = ({ filters, onChange }) => {
  const activeCount = [
    filters.priceRange,
    filters.marketCap,
    filters.volume,
    filters.performance,
    filters.beta,
    filters.sectors.length > 0 ? 'sector' : null,
  ].filter(Boolean).length;

  const toggleSector = (sector: string) => {
    const dataSector = SECTOR_UI_TO_DATA[sector] ?? sector;
    const hasSector = filters.sectors.includes(sector) || filters.sectors.includes(dataSector);
    const newSectors = hasSector
      ? filters.sectors.filter((s) => s !== sector && s !== dataSector)
      : [...filters.sectors, sector];
    onChange({ ...filters, sectors: newSectors });
  };

  const isSectorActive = (sector: string) => {
    const dataSector = SECTOR_UI_TO_DATA[sector] ?? sector;
    return filters.sectors.includes(sector) || filters.sectors.includes(dataSector);
  };

  const reset = () =>
    onChange({
      priceRange: null, marketCap: null, volume: null,
      performance: null, sectors: [], beta: null, searchQuery: '',
    });

  return (
    <div className="glass-card rounded-2xl p-4 border border-border-glass space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-app-green" />
          <span className="text-xs font-bold text-white">Filters</span>
          <AnimatePresence>
            {activeCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="px-1.5 py-0.5 rounded-full bg-app-green text-black text-[10px] font-bold"
              >
                {activeCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {activeCount > 0 && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-[10px] text-app-green hover:underline font-bold"
          >
            <X className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search symbol or name..."
          value={filters.searchQuery}
          onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
          className="w-full bg-surface-lowest border border-border-glass rounded-xl pl-3 pr-3 py-2 text-xs text-white placeholder:text-text-muted outline-none focus:border-app-green/50 transition-colors"
          aria-label="Search stocks by symbol or name"
        />
      </div>

      <FilterGroup label="Price Range">
        <SingleToggle
          options={PRICE_OPTIONS}
          value={filters.priceRange}
          onChange={(v) => onChange({ ...filters, priceRange: v })}
        />
      </FilterGroup>

      <FilterGroup label="Market Cap">
        <SingleToggle
          options={MCAP_OPTIONS}
          value={filters.marketCap}
          onChange={(v) => onChange({ ...filters, marketCap: v })}
        />
      </FilterGroup>

      <FilterGroup label="Volume">
        <SingleToggle
          options={VOLUME_OPTIONS}
          value={filters.volume}
          onChange={(v) => onChange({ ...filters, volume: v })}
        />
      </FilterGroup>

      <FilterGroup label="Performance">
        <SingleToggle
          options={PERF_OPTIONS}
          value={filters.performance}
          onChange={(v) => onChange({ ...filters, performance: v })}
        />
      </FilterGroup>

      <FilterGroup label="Sector">
        <div className="flex flex-wrap gap-1.5">
          {SECTOR_OPTIONS.map((sector) => {
            const active = isSectorActive(sector);
            return (
              <motion.button
                key={sector}
                onClick={() => toggleSector(sector)}
                whileTap={{ scale: 0.94 }}
                aria-pressed={active}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all duration-150 ${
                  active
                    ? 'bg-blue-400/15 border-blue-400/40 text-blue-400'
                    : 'bg-white/3 border-border-glass text-text-muted hover:text-white hover:border-white/20'
                }`}
              >
                {sector}
              </motion.button>
            );
          })}
        </div>
      </FilterGroup>

      <FilterGroup label="Risk (Beta)">
        <SingleToggle
          options={BETA_OPTIONS}
          value={filters.beta}
          onChange={(v) => onChange({ ...filters, beta: v })}
        />
      </FilterGroup>
    </div>
  );
};
