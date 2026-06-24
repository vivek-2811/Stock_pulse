import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import type { Watchlist, WatchlistItemMetadata } from '../../store/useWatchlistStore';
import { useMarketStore } from '../../store/useMarketStore';
import { useAlertStore } from '../../store/useAlertStore';
import type { AlertType } from '../../store/useAlertStore';
import { TableSkeleton } from '../../components/LoadingState';
import { LiveTickText } from '../../components/LiveTickText';
import { 
  Star, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUpDown, 
  X, 
  ListPlus,
  ExternalLink,
  Bell,
  Pin,
  Edit3,
  Activity,
  TrendingUp,
  Clock,
  GripVertical,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stock } from '../../services/mockDataEngine';

// Dnd Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ----------------------------------------------------------------------
// 1. Mini Sparkline Component
// ----------------------------------------------------------------------
const MiniSparkline: React.FC<{ data: number[]; isPositive: boolean }> = React.memo(({ data, isPositive }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 100;
  const height = 30;
  const padding = 2;
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg width="70" height="24" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        fill="none"
        stroke={isPositive ? '#00FF94' : '#FF3B5C'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
});

MiniSparkline.displayName = 'MiniSparkline';

// ----------------------------------------------------------------------
// 2. Sortable Table Row Component (React.memo)
// ----------------------------------------------------------------------
interface SortableRowProps {
  stock: Stock;
  index: number;
  originalIdx: number;
  metadata?: WatchlistItemMetadata;
  isPositive: boolean;
  focused: boolean;
  onFocus: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onNavigate: () => void;
  onRemove: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onOpenAlert: (e: React.MouseEvent) => void;
  onUpdateNote: (note: string) => void;
  handleMove: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableRow: React.FC<SortableRowProps> = React.memo(({
  stock,
  index,
  originalIdx,
  metadata,
  isPositive,
  focused,
  onFocus,
  onKeyDown,
  onNavigate,
  onRemove,
  onTogglePin,
  onOpenAlert,
  onUpdateNote,
  handleMove,
  isFirst,
  isLast
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stock.symbol });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform ? { ...transform, x: 0 } : null),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'static',
  };

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(metadata?.notes || '');

  useEffect(() => {
    setNoteText(metadata?.notes || '');
  }, [metadata?.notes]);

  const handleNoteBlur = () => {
    setIsEditingNote(false);
    onUpdateNote(noteText.trim());
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.stopPropagation();
      onUpdateNote(noteText.trim());
      setIsEditingNote(false);
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setNoteText(metadata?.notes || '');
      setIsEditingNote(false);
    }
  };

  // Return performance computations
  const addedPrice = metadata?.addedPrice || stock.price;
  const returnDollar = stock.price - addedPrice;
  const returnPercent = addedPrice > 0 ? (returnDollar / addedPrice) * 100 : 0;
  const isReturnPositive = returnDollar >= 0;

  // Format date
  const addedDateFormatted = useMemo(() => {
    if (!metadata?.addedAt) return 'Today';
    return new Date(metadata.addedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
  }, [metadata?.addedAt]);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={onNavigate}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      id={`row-${stock.symbol}`}
      tabIndex={0}
      className={`group hover:bg-white/[0.04] transition-all duration-200 border-b border-border-glass outline-none focus:bg-white/[0.05] focus:ring-1 focus:ring-app-green/30 ${
        focused ? 'bg-white/[0.05] ring-1 ring-app-green/30' : ''
      } ${metadata?.isPinned ? 'bg-yellow-500/[0.02]' : ''}`}
    >
      {/* Drag & Drop Handle / Move Buttons */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 text-text-muted">
          <div
            {...attributes}
            {...listeners}
            className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-white/5 hover:text-white"
            title="Drag to Reorder"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <button
              onClick={() => handleMove(originalIdx, 'up')}
              disabled={isFirst}
              className="p-0.5 rounded hover:bg-white/5 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Move Up"
            >
              <ArrowUp className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => handleMove(originalIdx, 'down')}
              disabled={isLast}
              className="p-0.5 rounded hover:bg-white/5 hover:text-white disabled:opacity-20 cursor-pointer"
              title="Move Down"
            >
              <ArrowDown className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>
      </td>
      
      {/* Symbol */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {metadata?.isPinned && (
            <Pin className="w-3 h-3 text-yellow-500 fill-yellow-500/30 shrink-0" />
          )}
          <div className="flex flex-col justify-center">
            <span className="font-bold text-white group-hover:text-app-green transition-colors text-sm">
              {stock.symbol}
            </span>
            <span className="text-[10px] text-text-muted font-sans truncate max-w-[110px]">{stock.name}</span>
          </div>
        </div>
      </td>

      {/* Price */}
      <td className="py-3 px-4 text-right font-semibold text-white">
        <LiveTickText value={stock.price} format={(val) => `$${val.toFixed(2)}`} />
      </td>

      {/* Change */}
      <td className="py-3 px-4 text-right font-bold">
        <LiveTickText 
          value={stock.changePercent} 
          format={(val) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`}
          className={isPositive ? 'text-app-green' : 'text-app-red'}
        />
      </td>

      {/* Return since added */}
      <td className="py-3 px-4 text-right hidden lg:table-cell">
        <div className="flex flex-col items-end">
          <span className={`font-bold ${isReturnPositive ? 'text-app-green' : 'text-app-red'}`}>
            {isReturnPositive ? '+' : ''}{returnPercent.toFixed(2)}%
          </span>
          <span className="text-[9px] text-text-muted font-sans mt-0.5" title={`Added on ${addedDateFormatted} at $${addedPrice.toFixed(2)}`}>
            {isReturnPositive ? '+' : ''}${returnDollar.toFixed(2)}
          </span>
        </div>
      </td>

      {/* Volume */}
      <td className="py-3 px-4 text-right text-text-muted hidden md:table-cell">
        {(stock.volume / 1000000).toFixed(2)}M
      </td>

      {/* Market Cap */}
      <td className="py-3 px-4 text-right text-text-muted hidden md:table-cell">
        ${(stock.marketCap / 1000000000).toFixed(1)}B
      </td>

      {/* Watchlist Notes */}
      <td className="py-3 px-4 max-w-[160px]" onClick={(e) => e.stopPropagation()}>
        {isEditingNote ? (
          <input
            type="text"
            className="px-2 py-1 rounded bg-surface-lowest border border-border-glass text-[11px] text-white focus:outline-none focus:border-app-green w-full font-sans"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleNoteBlur}
            onKeyDown={handleNoteKeyDown}
            autoFocus
          />
        ) : (
          <div 
            onClick={() => setIsEditingNote(true)}
            className="text-[11px] text-text-muted hover:text-white transition-colors cursor-pointer truncate max-w-[150px] font-sans flex items-center gap-1.5"
            title={metadata?.notes || 'Add Note'}
          >
            {metadata?.notes ? (
              <>
                <Edit3 className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 shrink-0" />
                <span className="truncate">{metadata.notes}</span>
              </>
            ) : (
              <span className="italic text-text-muted/40 group-hover:text-text-muted/70 flex items-center gap-1">
                <Edit3 className="w-2.5 h-2.5 opacity-20" /> Add note...
              </span>
            )}
          </div>
        )}
      </td>

      {/* Mini Sparkline */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center">
          <MiniSparkline data={stock.sparkline} isPositive={isPositive} />
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={onOpenAlert}
            className="p-1.5 rounded-lg border border-border-glass text-text-muted hover:text-white hover:bg-white/5 transition-all"
            title="Create Price Alert"
          >
            <Bell className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onTogglePin}
            className={`p-1.5 rounded-lg border border-border-glass transition-all ${
              metadata?.isPinned 
                ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' 
                : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
            title={metadata?.isPinned ? 'Unpin symbol' : 'Pin symbol to top'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 rounded-lg border border-red-500/15 text-app-red bg-app-red/[0.02] hover:bg-app-red/10 transition-all opacity-40 group-hover:opacity-100"
            title="Remove from Watchlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
});

SortableRow.displayName = 'SortableRow';

// ----------------------------------------------------------------------
// 3. Health Score Circular Gauge Component
// ----------------------------------------------------------------------
const HealthScoreGauge: React.FC<{ score: number }> = React.memo(({ score }) => {
  const radius = 26;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let strokeColor = '#FF3B5C'; // Red
  let scoreClass = 'text-app-red';
  if (score >= 75) {
    strokeColor = '#00FF94'; // Green
    scoreClass = 'text-app-green';
  } else if (score >= 50) {
    strokeColor = '#FFB800'; // Amber
    scoreClass = 'text-yellow-500';
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            className="stroke-border-glass fill-none"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="32"
            cy="32"
            r={radius}
            stroke={strokeColor}
            fill="none"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-xs font-bold font-mono ${scoreClass}`}>{score}</span>
      </div>
      <div>
        <div className="flex items-center gap-1">
          <Activity className="w-3.5 h-3.5 text-text-muted" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Health Score</h4>
        </div>
        <p className="text-[10px] text-text-muted mt-1 max-w-[160px] leading-tight">
          {score >= 75 
            ? 'Strong balance & diversification.' 
            : score >= 50 
              ? 'Balanced, but holds mid-volatility.' 
              : 'High concentration. Add sectors.'}
        </p>
      </div>
    </div>
  );
});

HealthScoreGauge.displayName = 'HealthScoreGauge';

// ----------------------------------------------------------------------
// 4. Market Breadth Card Component
// ----------------------------------------------------------------------
const MarketBreadthBar: React.FC<{ advancers: number; decliners: number; total: number }> = React.memo(({ advancers, decliners, total }) => {
  const flat = total - advancers - decliners;
  const ratio = decliners === 0 ? advancers : (advancers / decliners);
  
  const advPct = total > 0 ? (advancers / total) * 100 : 50;
  const decPct = total > 0 ? (decliners / total) * 100 : 50;
  const flatPct = total > 0 ? (flat / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-app-green flex items-center gap-1">
          ▲ {advancers} Up
        </span>
        <span className="text-[10px] text-text-muted font-bold font-mono">
          A/D Ratio: {ratio.toFixed(1)}x
        </span>
        <span className="font-bold text-app-red flex items-center gap-1">
          ▼ {decliners} Down
        </span>
      </div>
      
      {/* Split progress bar */}
      <div className="h-2 rounded-full overflow-hidden flex bg-surface-lowest">
        {advancers > 0 && (
          <div
            style={{ width: `${advPct}%` }}
            className="h-full bg-app-green transition-all duration-500"
          />
        )}
        {flat > 0 && (
          <div
            style={{ width: `${flatPct}%` }}
            className="h-full bg-text-muted/40 transition-all duration-500"
          />
        )}
        {decliners > 0 && (
          <div
            style={{ width: `${decPct}%` }}
            className="h-full bg-app-red transition-all duration-500"
          />
        )}
      </div>
      <div className="flex justify-between text-[9px] text-text-muted uppercase tracking-wider font-semibold">
        <span>{advPct.toFixed(0)}% Bulls</span>
        <span>{flat > 0 ? `${flat} flat` : ''}</span>
        <span>{decPct.toFixed(0)}% Bears</span>
      </div>
    </div>
  );
});

MarketBreadthBar.displayName = 'MarketBreadthBar';

// ----------------------------------------------------------------------
// 5. Main WatchlistPage Component
// ----------------------------------------------------------------------
export const WatchlistPage: React.FC = () => {
  const navigate = useNavigate();

  // Zustand Watchlist Selectors
  const watchlists = useWatchlistStore(state => state.watchlists);
  const activeListId = useWatchlistStore(state => state.activeListId);
  const createWatchlist = useWatchlistStore(state => state.createWatchlist);
  const deleteWatchlist = useWatchlistStore(state => state.deleteWatchlist);
  const addToWatchlist = useWatchlistStore(state => state.addToWatchlist);
  const removeFromWatchlist = useWatchlistStore(state => state.removeFromWatchlist);
  const reorderSymbols = useWatchlistStore(state => state.reorderSymbols);
  const setActiveListId = useWatchlistStore(state => state.setActiveListId);
  const togglePinSymbol = useWatchlistStore(state => state.togglePinSymbol);
  const updateSymbolNote = useWatchlistStore(state => state.updateSymbolNote);

  // Alert Store Actions
  const createAlert = useAlertStore(state => state.createAlert);

  // Market Price Feed Selector
  const allStocks = useMarketStore(state => state.stocks);

  // Selected watchlist
  const activeList = useMemo(() => {
    return watchlists.find(wl => wl.id === activeListId) || watchlists[0];
  }, [watchlists, activeListId]);

  // Modal & Notification States
  const [newListName, setNewListName] = useState('');
  const [newListModalOpen, setNewListModalOpen] = useState(false);
  const [quickAddSymbol, setQuickAddSymbol] = useState('');
  const [quickAddFocused, setQuickAddFocused] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Alert Creation Modal State
  const [alertSymbol, setAlertSymbol] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<AlertType>('PRICE_ABOVE');
  const [alertValue, setAlertValue] = useState<number>(0);

  // Keyboard accessibility focused row tracker
  const [focusedSymbol, setFocusedSymbol] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Success Notification Toast Fade
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  // Pre-fill Price Alert modal value when opened
  useEffect(() => {
    if (alertSymbol) {
      const stock = allStocks.find(s => s.symbol === alertSymbol);
      if (stock) {
        if (alertType.startsWith('PRICE')) {
          setAlertValue(Number(stock.price.toFixed(2)));
        } else {
          setAlertValue(5.00); // Default threshold 5% for percentage changes
        }
      }
    }
  }, [alertSymbol, alertType, allStocks]);

  // Handle Toast helper
  const triggerToast = (msg: string) => {
    setToastMsg(msg);
  };

  // Get stock details for the symbols in the active watchlist
  const activeSymbols = activeList?.symbols || [];
  const watchedStocks = useMemo(() => {
    return activeSymbols
      .map(sym => allStocks.find(s => s.symbol === sym))
      .filter((s): s is Stock => s !== undefined);
  }, [activeSymbols, allStocks]);

  // Pinned vs Unpinned layout sorting logic
  const sortedStocks = useMemo(() => {
    const list = [...watchedStocks];
    const itemsMeta = activeList?.itemsMetadata || {};

    if (sortField) {
      list.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal) 
            : bVal.localeCompare(aVal);
        }
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return 0;
      });
    } else {
      // Drag/natural order: Pinned stocks kept at the top of the workspace
      list.sort((a, b) => {
        const aPinned = !!itemsMeta[a.symbol]?.isPinned;
        const bPinned = !!itemsMeta[b.symbol]?.isPinned;
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0;
      });
    }
    return list;
  }, [watchedStocks, activeList?.itemsMetadata, sortField, sortDirection]);

  // Handle drag reordering with pins boundary correction
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeList) return;

    const oldIndex = sortedStocks.findIndex(s => s.symbol === active.id);
    const newIndex = sortedStocks.findIndex(s => s.symbol === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedStocks = arrayMove(sortedStocks, oldIndex, newIndex);
      const newSymbols = reorderedStocks.map(s => s.symbol);

      // Save order
      reorderSymbols(activeList.id, newSymbols);

      // Bubble pin logic: dragging an item across pinning thresholds updates pin state
      const itemsMeta = activeList.itemsMetadata || {};
      const isActivePinned = !!itemsMeta[active.id as string]?.isPinned;
      const pinnedCount = reorderedStocks.filter(s => !!itemsMeta[s.symbol]?.isPinned).length;

      if (isActivePinned && newIndex >= pinnedCount) {
        // Dragged below pinned list: Unpin
        togglePinSymbol(activeList.id, active.id as string);
        triggerToast(`Unpinned ${active.id} and moved to standard watchlist.`);
      } else if (!isActivePinned && newIndex < pinnedCount) {
        // Dragged into pinned zone: Pin
        togglePinSymbol(activeList.id, active.id as string);
        triggerToast(`Pinned ${active.id} to the top of watchlist.`);
      } else {
        triggerToast(`Reordered watchlist rows.`);
      }
    }
  }, [sortedStocks, activeList, reorderSymbols, togglePinSymbol]);

  // Keyboard and Pointer Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Quick Add autocomplete dropdown filtering
  const availableToAdd = useMemo(() => {
    if (!quickAddSymbol) return [];
    return allStocks.filter(
      stock => 
        !activeSymbols.includes(stock.symbol) &&
        (stock.symbol.toLowerCase().includes(quickAddSymbol.toLowerCase()) ||
         stock.name.toLowerCase().includes(quickAddSymbol.toLowerCase()))
    ).slice(0, 5);
  }, [quickAddSymbol, allStocks, activeSymbols]);

  const handleCreateListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createWatchlist(newListName.trim());
    triggerToast(`Created new watchlist "${newListName.trim()}"`);
    setNewListName('');
    setNewListModalOpen(false);
  };

  const handleQuickAddSelect = useCallback((symbol: string) => {
    if (activeListId) {
      addToWatchlist(activeListId, symbol);
      triggerToast(`Added ${symbol} to watchlist.`);
      setQuickAddSymbol('');
      setQuickAddFocused(false);
    }
  }, [activeListId, addToWatchlist]);

  const handleRemove = useCallback((symbol: string) => {
    if (activeListId) {
      removeFromWatchlist(activeListId, symbol);
      triggerToast(`Removed ${symbol} from watchlist.`);
    }
  }, [activeListId, removeFromWatchlist]);

  const handleTogglePin = useCallback((symbol: string) => {
    if (activeListId) {
      togglePinSymbol(activeListId, symbol);
      const isPinned = !activeList?.itemsMetadata?.[symbol]?.isPinned;
      triggerToast(isPinned ? `Pinned ${symbol} to the top.` : `Unpinned ${symbol}.`);
    }
  }, [activeListId, activeList?.itemsMetadata, togglePinSymbol]);

  const handleUpdateNote = useCallback((symbol: string, note: string) => {
    if (activeListId) {
      updateSymbolNote(activeListId, symbol, note);
    }
  }, [activeListId, updateSymbolNote]);

  // Reorder buttons logic
  const handleMove = useCallback((index: number, direction: 'up' | 'down') => {
    if (!activeList) return;
    const newSymbols = [...activeList.symbols];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newSymbols.length) return;
    
    // Swap symbols
    const temp = newSymbols[index];
    newSymbols[index] = newSymbols[targetIndex];
    newSymbols[targetIndex] = temp;
    
    reorderSymbols(activeList.id, newSymbols);
    triggerToast(`Moved stock row ${direction}.`);
  }, [activeList, reorderSymbols]);

  // Keyboard accessibility listeners (Row-level handlers)
  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, symbol: string, index: number) => {
    const isAlt = e.altKey;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (isAlt) {
          handleMove(index, 'down');
          setTimeout(() => document.getElementById(`row-${symbol}`)?.focus(), 80);
        } else {
          if (index < sortedStocks.length - 1) {
            const nextSymbol = sortedStocks[index + 1].symbol;
            setFocusedSymbol(nextSymbol);
            document.getElementById(`row-${nextSymbol}`)?.focus();
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isAlt) {
          handleMove(index, 'up');
          setTimeout(() => document.getElementById(`row-${symbol}`)?.focus(), 80);
        } else {
          if (index > 0) {
            const prevSymbol = sortedStocks[index - 1].symbol;
            setFocusedSymbol(prevSymbol);
            document.getElementById(`row-${prevSymbol}`)?.focus();
          }
        }
        break;

      case 'Enter':
        e.preventDefault();
        navigate(`/stock/${symbol}`);
        break;

      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (activeListId) {
          handleRemove(symbol);
          const nextFocusIndex = index < sortedStocks.length - 1 ? index : index - 1;
          if (sortedStocks.length > 1 && nextFocusIndex >= 0) {
            const nextSymbol = sortedStocks[nextFocusIndex].symbol;
            setFocusedSymbol(nextSymbol);
            setTimeout(() => document.getElementById(`row-${nextSymbol}`)?.focus(), 80);
          } else {
            setFocusedSymbol(null);
          }
        }
        break;

      case 'p':
      case 'P':
        e.preventDefault();
        handleTogglePin(symbol);
        break;

      default:
        break;
    }
  }, [sortedStocks, activeListId, handleMove, handleRemove, handleTogglePin, navigate]);

  // Column Header Sorting handler
  const handleSort = (field: 'symbol' | 'price' | 'changePercent' | 'volume' | 'marketCap') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ----------------------------------------------------------------------
  // COMPUTE METRICS: Health Score & Market Breadth (Memoized)
  // ----------------------------------------------------------------------
  const metrics = useMemo(() => {
    if (watchedStocks.length === 0) {
      return { healthScore: 0, advancers: 0, decliners: 0 };
    }

    // 1. Sector Diversification Score
    const uniqueSectors = new Set(watchedStocks.map(s => s.sector)).size;
    const sectorScore = Math.min(100, uniqueSectors * 20 + 20);

    // 2. Diversification HHI Score
    const divScore = Math.min(100, watchedStocks.length * 12);

    // 3. Volatility Beta Score
    const avgBeta = watchedStocks.reduce((sum, s) => sum + (s.beta || 1), 0) / (watchedStocks.length || 1);
    const volScore = Math.max(0, 100 - Math.abs(avgBeta - 1.1) * 50);

    // 4. Performance Score
    const avgDailyReturn = watchedStocks.reduce((sum, s) => sum + s.changePercent, 0) / (watchedStocks.length || 1);
    const perfScore = Math.min(100, Math.max(0, 50 + avgDailyReturn * 10));

    const healthScore = Math.round((divScore * 0.3) + (sectorScore * 0.3) + (volScore * 0.2) + (perfScore * 0.2));

    // Breadth counts
    const advancers = watchedStocks.filter(s => s.changePercent > 0).length;
    const decliners = watchedStocks.filter(s => s.changePercent < 0).length;

    return { healthScore, advancers, decliners };
  }, [watchedStocks]);

  // ----------------------------------------------------------------------
  // COMPUTE: Recently Added (Memoized last 5 symbols added)
  // ----------------------------------------------------------------------
  const recentlyAddedData = useMemo(() => {
    if (!activeList || !activeList.itemsMetadata) return [];
    return Object.entries(activeList.itemsMetadata)
      .sort((a, b) => new Date(b[1].addedAt).getTime() - new Date(a[1].addedAt).getTime())
      .slice(0, 5)
      .map(([symbol, meta]) => ({
        symbol,
        addedAt: meta.addedAt,
        addedPrice: meta.addedPrice
      }));
  }, [activeList]);

  const handleOpenAlertModal = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    setAlertSymbol(symbol);
  };

  const handleCreateAlertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertSymbol) return;
    createAlert(alertSymbol, alertType, alertValue);
    triggerToast(`Created Alert: ${alertSymbol} ${alertType.replaceAll('_', ' ')} ${alertValue}`);
    setAlertSymbol(null);
  };

  // Determine suggestions for empty state
  const suggestions = useMemo(() => {
    if (!activeList) return [];
    const name = activeList.name.toLowerCase();
    if (name.includes('tech') || name.includes('growth') || name.includes('semiconductor') || name.includes('software')) {
      return [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corp.' },
        { symbol: 'NVDA', name: 'NVIDIA Corp.' },
        { symbol: 'AMD', name: 'Advanced Micro Devices' },
        { symbol: 'ADBE', name: 'Adobe Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' }
      ];
    }
    if (name.includes('defensive') || name.includes('income') || name.includes('dividend') || name.includes('value') || name.includes('safe')) {
      return [
        { symbol: 'KO', name: 'Coca-Cola' },
        { symbol: 'PEP', name: 'PepsiCo' },
        { symbol: 'WMT', name: 'Walmart' },
        { symbol: 'JPM', name: 'JPMorgan' },
        { symbol: 'V', name: 'Visa' },
        { symbol: 'DIS', name: 'Disney' }
      ];
    }
    return [
      { symbol: 'AAPL', name: 'Apple Inc.' },
      { symbol: 'MSFT', name: 'Microsoft Corp.' },
      { symbol: 'NVDA', name: 'NVIDIA Corp.' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.' },
      { symbol: 'AMZN', name: 'Amazon.com' },
      { symbol: 'TSLA', name: 'Tesla Inc.' }
    ];
  }, [activeList]);

  // Overall empty state (no lists exist)
  if (watchlists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-card border border-dashed border-border-glass rounded-2xl max-w-lg mx-auto mt-20">
        <Star className="w-12 h-12 text-yellow-500/80 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">Create Your First Watchlist</h3>
        <p className="text-xs text-text-muted text-center mt-2 max-w-xs leading-relaxed">
          Monitor custom sector groups, track performance since added, and configure price alert targets.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={() => setNewListModalOpen(true)}
            className="px-4 py-2.5 bg-app-green text-black text-xs font-bold rounded-xl btn-primary"
          >
            Create Watchlist
          </button>
          <button
            onClick={() => navigate('/markets')}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-border-glass text-xs font-bold rounded-xl transition-colors"
          >
            Browse Markets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed bottom-6 right-6 px-4 py-3 bg-[#111622] border border-app-green/30 text-white rounded-xl shadow-2xl z-50 flex items-center gap-2.5"
          >
            <Check className="w-4 h-4 text-app-green" />
            <span className="text-xs font-medium">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-border-glass">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Watchlist Workspace</h1>
          <p className="text-xs text-text-muted mt-1 font-medium">
            Monitor real-time ticker prices, manage notes, and track performance targets since addition.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* List Selector dropdown */}
          <select
            value={activeListId}
            onChange={(e) => setActiveListId(e.target.value)}
            className="flex-1 md:flex-initial px-3.5 py-2.5 rounded-xl border border-border-glass bg-surface-low text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-app-green cursor-pointer text-white"
          >
            {watchlists.map(wl => (
              <option key={wl.id} value={wl.id}>{wl.name}</option>
            ))}
          </select>

          {/* New List button */}
          <button
            onClick={() => setNewListModalOpen(true)}
            className="p-2.5 rounded-xl border border-border-glass bg-surface-glass text-text-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title="Create New List"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          {/* Delete List button */}
          <button
            onClick={() => {
              if (watchlists.length <= 1) {
                alert("Cannot delete the final watchlist.");
                return;
              }
              if (confirm(`Are you sure you want to delete "${activeList?.name}"?`)) {
                deleteWatchlist(activeList.id);
              }
            }}
            disabled={watchlists.length <= 1}
            className="p-2.5 rounded-xl border border-red-500/10 text-app-red bg-app-red/[0.03] hover:bg-app-red/10 transition-colors disabled:opacity-40 cursor-pointer"
            title="Delete Current List"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards Panel (Health, Breadth, Recently Added) */}
      {watchedStocks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Circular Health Score Card */}
          <div className="glass-card p-4 rounded-xl border border-border-glass flex items-center justify-between">
            <HealthScoreGauge score={metrics.healthScore} />
          </div>

          {/* Market Breadth Split Card */}
          <div className="glass-card p-4 rounded-xl border border-border-glass flex flex-col justify-center">
            <div className="flex items-center gap-1.5 mb-2.5">
              <TrendingUp className="w-3.5 h-3.5 text-text-muted" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Market Breadth</h4>
            </div>
            <MarketBreadthBar
              advancers={metrics.advancers}
              decliners={metrics.decliners}
              total={watchedStocks.length}
            />
          </div>

          {/* Recently Added Card */}
          <div className="glass-card p-4 rounded-xl border border-border-glass">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Clock className="w-3.5 h-3.5 text-text-muted" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Recently Added</h4>
            </div>
            <RecentlyAddedList
              symbols={recentlyAddedData}
              stocksBySymbol={useMarketStore.getState().stocksBySymbol}
              onFocusStock={(sym) => {
                setFocusedSymbol(sym);
                document.getElementById(`row-${sym}`)?.focus();
                triggerToast(`Focused row for ${sym}`);
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Quick Add Section */}
      {activeList && (
        <div className="relative max-w-md">
          <div className="relative">
            <Plus className="absolute left-3.5 top-3 w-4.5 h-4.5 text-text-muted" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-sm placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-app-green text-white font-semibold"
              placeholder={`Quick add stock to "${activeList.name}"...`}
              value={quickAddSymbol}
              onChange={e => {
                setQuickAddSymbol(e.target.value);
                setQuickAddFocused(true);
              }}
              onFocus={() => setQuickAddFocused(true)}
            />
            {quickAddSymbol && (
              <button 
                onClick={() => setQuickAddSymbol('')}
                className="absolute right-3 top-3 text-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {quickAddFocused && quickAddSymbol && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setQuickAddFocused(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-1.5 rounded-xl glass-card border border-border-glass shadow-2xl p-1.5 z-40 max-h-56 overflow-y-auto bg-[#10141a]"
                >
                  {availableToAdd.length > 0 ? (
                    availableToAdd.map(stock => (
                      <div
                        key={stock.symbol}
                        onClick={() => handleQuickAddSelect(stock.symbol)}
                        className="flex justify-between items-center px-3 py-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors text-xs font-semibold text-white"
                      >
                        <div className="flex gap-2">
                          <span className="w-12 block">{stock.symbol}</span>
                          <span className="text-text-muted font-normal truncate max-w-[180px]">{stock.name}</span>
                        </div>
                        <span className="text-text-muted font-mono">${stock.price.toFixed(2)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-3 text-center text-xs text-text-muted">
                      No matching stocks found
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* 4. Watchlist Table / Empty Suggestions State */}
      {watchedStocks.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="glass-card rounded-2xl overflow-hidden border border-border-glass">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-border-glass bg-surface-lowest/50 text-[10px] font-bold text-text-muted uppercase tracking-wider select-none">
                    <th className="py-3 px-4 w-18">Reorder</th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>
                      <div className="flex items-center gap-1">Symbol <ChevronsUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort('price')}>
                      <div className="flex items-center justify-end gap-1">Price <ChevronsUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => handleSort('changePercent')}>
                      <div className="flex items-center justify-end gap-1">Day Change <ChevronsUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-4 text-right hidden lg:table-cell">Return Added</th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white text-right hidden md:table-cell" onClick={() => handleSort('volume')}>
                      <div className="flex items-center justify-end gap-1">Volume <ChevronsUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-4 cursor-pointer hover:text-white text-right hidden md:table-cell" onClick={() => handleSort('marketCap')}>
                      <div className="flex items-center justify-end gap-1">Mkt Cap <ChevronsUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="py-3 px-4">Watchlist Notes</th>
                    <th className="py-3 px-4 text-center">Sparkline</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass font-mono text-xs text-on-surface">
                  <SortableContext
                    items={sortedStocks.map(s => s.symbol)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sortedStocks.map((stock, index) => {
                      const isPositive = stock.changePercent >= 0;
                      const originalIdx = activeList.symbols.indexOf(stock.symbol);
                      const isFirst = index === 0;
                      const isLast = index === sortedStocks.length - 1;

                      return (
                        <SortableRow
                          key={stock.symbol}
                          stock={stock}
                          index={index}
                          originalIdx={originalIdx}
                          metadata={activeList.itemsMetadata?.[stock.symbol]}
                          isPositive={isPositive}
                          focused={focusedSymbol === stock.symbol}
                          onFocus={() => setFocusedSymbol(stock.symbol)}
                          onKeyDown={(e) => handleRowKeyDown(e, stock.symbol, index)}
                          onNavigate={() => navigate(`/stock/${stock.symbol}`)}
                          onRemove={(e) => {
                            e.stopPropagation();
                            handleRemove(stock.symbol);
                          }}
                          onTogglePin={(e) => {
                            e.stopPropagation();
                            handleTogglePin(stock.symbol);
                          }}
                          onOpenAlert={(e) => handleOpenAlertModal(e, stock.symbol)}
                          onUpdateNote={(note) => handleUpdateNote(stock.symbol, note)}
                          handleMove={handleMove}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                      );
                    })}
                  </SortableContext>
                </tbody>
              </table>
            </div>
          </div>
        </DndContext>
      ) : (
        /* Suggested Chips for empty custom Watchlists */
        <div className="glass-card rounded-2xl p-12 text-center text-text-muted border border-dashed border-border-glass flex flex-col justify-center items-center">
          <Star className="w-10 h-10 text-yellow-500/80 mb-2.5 animate-pulse" />
          <p className="text-sm font-bold text-white">Watchlist is empty</p>
          <p className="text-xs mt-1 max-w-xs text-center leading-relaxed">
            Add holdings manually above, or select from these suggested stocks matching your watchlist category:
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
            {suggestions.map((sug) => (
              <button
                key={sug.symbol}
                onClick={() => handleQuickAddSelect(sug.symbol)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-border-glass text-xs font-semibold text-white hover:bg-app-green/10 hover:border-app-green/30 hover:text-app-green transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{sug.symbol}</span>
                <span className="text-[10px] text-text-muted font-normal">({sug.name})</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => navigate('/markets')}
            className="mt-8 px-5 py-2.5 btn-primary text-xs font-bold rounded-xl cursor-pointer"
          >
            Browse Markets
          </button>
        </div>
      )}

      {/* 5. Create List Modal Dialog */}
      <AnimatePresence>
        {newListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6 bg-[#10141a]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-base text-white">Create Watchlist</span>
                <button onClick={() => setNewListModalOpen(false)} className="p-1 rounded-lg hover:bg-white/5 text-text-muted cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateListSubmit} className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">List Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs focus:outline-none focus:ring-1 focus:ring-app-green text-white font-semibold"
                    placeholder="e.g. Technology Growth, Dividends"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                  />
                </div>

                <button type="submit" className="w-full py-3 rounded-xl bg-app-green text-black font-bold text-xs shadow-md cursor-pointer hover:shadow-glow-green-sm transition-all">
                  Create List
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Create Price Alert Modal Dialog */}
      <AnimatePresence>
        {alertSymbol && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm glass-card border border-border-glass shadow-2xl rounded-3xl p-6 bg-[#10141a]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-border-glass">
                <span className="font-bold text-base text-white">Create Price Alert</span>
                <button onClick={() => setAlertSymbol(null)} className="p-1 rounded-lg hover:bg-white/5 text-text-muted cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateAlertSubmit} className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">Stock Symbol</label>
                  <input
                    type="text"
                    disabled
                    className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-text-muted font-bold"
                    value={alertSymbol}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">Alert Trigger Type</label>
                  <select
                    value={alertType}
                    onChange={(e) => setAlertType(e.target.value as AlertType)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs text-white font-semibold cursor-pointer"
                  >
                    <option value="PRICE_ABOVE">Price Above</option>
                    <option value="PRICE_BELOW">Price Below</option>
                    <option value="PCT_CHANGE_ABOVE">% Change Above</option>
                    <option value="PCT_CHANGE_BELOW">% Change Below</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-muted block">
                    Trigger Threshold ({alertType.startsWith('PRICE') ? 'USD $' : 'Percent %'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-border-glass bg-surface-lowest text-xs focus:outline-none focus:ring-1 focus:ring-app-green text-white font-semibold font-mono"
                    value={alertValue || ''}
                    onChange={e => setAlertValue(Number(e.target.value))}
                  />
                  <div className="text-[10px] text-text-muted font-medium mt-1">
                    Current Price: ${allStocks.find(s => s.symbol === alertSymbol)?.price.toFixed(2)} • Daily Change: {allStocks.find(s => s.symbol === alertSymbol)?.changePercent.toFixed(2)}%
                  </div>
                </div>

                <button type="submit" className="w-full py-3 rounded-xl bg-app-green text-black font-bold text-xs shadow-md cursor-pointer hover:shadow-glow-green-sm transition-all">
                  Set Alert Trigger
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

// Simple list wrapper component helper
const RecentlyAddedList: React.FC<{
  symbols: { symbol: string; addedAt: string; addedPrice: number }[];
  stocksBySymbol: Record<string, Stock>;
  onFocusStock: (symbol: string) => void;
}> = React.memo(({ symbols, stocksBySymbol, onFocusStock }) => {
  return (
    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
      {symbols.length === 0 ? (
        <div className="text-[10px] text-text-muted py-3 text-center">No stocks recently added</div>
      ) : (
        symbols.map(({ symbol, addedPrice }) => {
          const stock = stocksBySymbol?.[symbol];
          if (!stock) return null;
          const returnPct = addedPrice > 0 ? ((stock.price - addedPrice) / addedPrice) * 100 : 0;
          const isPositive = returnPct >= 0;
          return (
            <div
              key={symbol}
              onClick={() => onFocusStock(symbol)}
              className="flex justify-between items-center py-1 px-2 rounded hover:bg-white/5 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs">{symbol}</span>
                <span className="text-[9px] text-text-muted font-sans font-medium">Added at: ${addedPrice.toFixed(2)}</span>
              </div>
              <span className={`text-[10px] font-mono font-bold ${isPositive ? 'text-app-green' : 'text-app-red'}`}>
                {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
              </span>
            </div>
          );
        })
      )}
    </div>
  );
});

RecentlyAddedList.displayName = 'RecentlyAddedList';

export default WatchlistPage;
