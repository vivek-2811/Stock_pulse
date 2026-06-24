import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Clock,
  ExternalLink,
  Search,
  Filter,
} from 'lucide-react';
import { useNewsStore, STATIC_ARTICLES } from '../../store/NewsStore';
import type { NewsArticle, NewsCategory, NewsSentiment } from '../../store/NewsStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const CATEGORIES: NewsCategory[] = [
  'All',
  'Market News',
  'Sector News',
  'Company News',
  'Earnings',
  'Economy',
  'Analyst Actions',
  'My News',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SentimentIcon({ sentiment }: { sentiment: NewsSentiment }) {
  if (sentiment === 'Bullish')
    return <TrendingUp size={14} className="text-app-green" />;
  if (sentiment === 'Bearish')
    return <TrendingDown size={14} className="text-app-red" />;
  return <Minus size={14} className="text-text-muted" />;
}

function ImpactBadge({ level, score }: { level: string; score: number }) {
  const color =
    level === 'High'
      ? 'text-app-red bg-app-red/10 border-app-red/25'
      : level === 'Medium'
        ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25'
        : 'text-text-muted bg-white/5 border-border-glass';

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}
    >
      {level} · {score}
    </span>
  );
}

function ArticleCard({
  article,
  index,
  isBookmarked,
  onToggleBookmark,
}: {
  article: NewsArticle;
  index: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.28, delay: index * 0.05, ease: 'easeOut' }}
      className="glass-card border border-border-glass rounded-xl p-4 hover:border-white/20 transition-colors group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {article.isBreaking && (
            <span className="relative inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-app-red bg-app-red/10 border border-app-red/30 uppercase tracking-wide">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-app-red opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-app-red" />
              </span>
              Breaking
            </span>
          )}
          <ImpactBadge level={article.impactLevel} score={article.impactScore} />
          <span className="inline-flex items-center gap-0.5 text-[11px] text-text-muted">
            <SentimentIcon sentiment={article.sentiment} />
            <span
              className={
                article.sentiment === 'Bullish'
                  ? 'text-app-green'
                  : article.sentiment === 'Bearish'
                    ? 'text-app-red'
                    : 'text-text-muted'
              }
            >
              {article.sentiment}
            </span>
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onToggleBookmark(article.id)}
            className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck size={15} className="text-yellow-400" />
            ) : (
              <Bookmark
                size={15}
                className="text-text-muted group-hover:text-text-secondary transition-colors"
              />
            )}
          </button>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg hover:bg-white/8 transition-colors"
            aria-label="Open article"
          >
            <ExternalLink size={14} className="text-text-muted hover:text-white transition-colors" />
          </a>
        </div>
      </div>

      {/* Headline */}
      <h3 className="font-bold text-white text-sm leading-snug mb-1.5 line-clamp-2">
        {article.headline}
      </h3>

      {/* Source + time row */}
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-medium text-text-secondary">{article.source}</span>
        <span className="text-text-muted text-[10px]">·</span>
        <span className="flex items-center gap-1 text-[11px] text-text-muted">
          <Clock size={11} />
          {formatRelativeTime(article.publishedAt)}
        </span>
      </div>

      {/* Bottom tags */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Sector pill */}
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/6 text-text-secondary border border-border-glass">
          {article.relatedSector}
        </span>

        {/* Symbol pills */}
        {article.relatedSymbols.map((sym) => (
          <span
            key={sym}
            className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-app-green bg-app-green/10 border border-app-green/20"
          >
            {sym}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NewsFeed() {
  const { activeCategory, searchQuery, bookmarks, setCategory, setSearch, toggleBookmark } =
    useNewsStore();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  const { watchlists, activeListId } = useWatchlistStore();
  const { holdings } = usePortfolioStore();

  // Collect all symbols from active watchlist + portfolio
  const mySymbols = useMemo<Set<string>>(() => {
    const set = new Set<string>();
    const activeWatchlist = watchlists.find((w) => w.id === activeListId);
    activeWatchlist?.symbols.forEach((s) => set.add(s));
    holdings.forEach((h) => set.add(h.symbol));
    return set;
  }, [watchlists, activeListId, holdings]);

  const filteredArticles = useMemo(() => {
    let articles = [...STATIC_ARTICLES].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Category filter
    if (activeCategory === 'My News') {
      articles = articles.filter((a) =>
        a.relatedSymbols.some((sym) => mySymbols.has(sym))
      );
    } else if (activeCategory !== 'All') {
      articles = articles.filter((a) => a.category === activeCategory);
    }

    // Search filter
    const q = localSearch.trim().toLowerCase();
    if (q) {
      articles = articles.filter(
        (a) =>
          a.headline.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.relatedSymbols.some((s) => s.toLowerCase().includes(q)) ||
          a.relatedSector.toLowerCase().includes(q)
      );
    }

    return articles;
  }, [activeCategory, localSearch, mySymbols]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalSearch(e.target.value);
    setSearch(e.target.value);
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Search bar */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
        <input
          type="text"
          value={localSearch}
          onChange={handleSearchChange}
          placeholder="Search headlines, symbols, sources…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-low border border-border-glass text-sm text-white placeholder:text-text-muted focus:outline-none focus:border-white/30 transition-colors"
        />
        {localSearch && (
          <button
            onClick={() => {
              setLocalSearch('');
              setSearch('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category tab bar */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              activeCategory === cat
                ? 'bg-white/12 text-white border border-white/20 shadow-sm'
                : 'text-text-muted hover:text-text-secondary hover:bg-white/5'
            }`}
          >
            {cat}
            {cat === 'My News' && mySymbols.size > 0 && (
              <span className="ml-1.5 text-[9px] bg-app-green/20 text-app-green px-1 py-0.5 rounded-full">
                {mySymbols.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' && ` · ${activeCategory}`}
        </p>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Filter size={11} />
          <span>Sorted by Latest</span>
        </div>
      </div>

      {/* Article list */}
      <div className="flex flex-col gap-3 overflow-y-auto pb-2">
        <AnimatePresence mode="popLayout">
          {filteredArticles.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 gap-3"
            >
              <Zap size={32} className="text-text-muted opacity-40" />
              <p className="text-text-muted text-sm">No articles found</p>
              <p className="text-text-muted text-xs opacity-60">
                {activeCategory === 'My News'
                  ? 'Add symbols to your watchlist or portfolio to see personalized news'
                  : 'Try adjusting your search or category filter'}
              </p>
            </motion.div>
          ) : (
            filteredArticles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={i}
                isBookmarked={bookmarks.includes(article.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
