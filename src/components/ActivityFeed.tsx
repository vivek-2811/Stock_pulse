import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bell, Newspaper, Briefcase, Zap, Bot, Clock } from 'lucide-react';
import { useAlertStore } from '../store/useAlertStore';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { STATIC_ARTICLES } from '../store/NewsStore';

interface FeedItem {
  id: string;
  type: 'alert' | 'news' | 'portfolio' | 'copilot';
  timestamp: string;
  title: string;
  description: string;
  badgeColor: string;
  icon: React.ComponentType<any>;
}

export const ActivityFeed: React.FC = () => {
  const { notifications } = useAlertStore();
  const { transactions } = usePortfolioStore();

  const feedItems = useMemo<FeedItem[]>(() => {
    const list: FeedItem[] = [];

    // 1. Add Alert notifications
    notifications.forEach((n) => {
      list.push({
        id: `alert-${n.id}`,
        type: 'alert',
        timestamp: n.timestamp,
        title: n.title,
        description: n.message,
        badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
        icon: Bell,
      });
    });

    // 2. Add Recent news articles
    STATIC_ARTICLES.slice(0, 4).forEach((art) => {
      list.push({
        id: `news-${art.id}`,
        type: 'news',
        timestamp: art.publishedAt,
        title: art.headline,
        description: art.summary,
        badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        icon: Newspaper,
      });
    });

    // 3. Add Portfolio transaction events
    transactions.slice(0, 3).forEach((tx) => {
      const typeStr = tx.type === 'BUY' ? 'Acquired' : 'Sold';
      list.push({
        id: `portfolio-${tx.id}`,
        type: 'portfolio',
        timestamp: tx.date,
        title: `${typeStr} ${tx.quantity} shares of ${tx.symbol}`,
        description: `Executed at price $${tx.price.toFixed(2)} with transaction fee $${tx.fee.toFixed(2)}.`,
        badgeColor: 'text-app-green bg-app-green/10 border-app-green/20',
        icon: Briefcase,
      });
    });

    // 4. Add mock Copilot insight
    list.push({
      id: 'copilot-static-1',
      type: 'copilot',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
      title: 'Copilot Risk Audit Complete',
      description: 'Zustand analyzer parsed 4 holdings. Recommended adding beta-hedging defensive assets.',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      icon: Bot,
    });

    // Sort by timestamp descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notifications, transactions]);

  // Helper to format relative time
  const formatTime = (isoString: string) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-app-green" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Unified Activity Feed</h3>
      </div>

      {/* Feed Container */}
      <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
        {feedItems.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-xs">
            No events registered in activity ledger.
          </div>
        ) : (
          feedItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="glass-card border border-border-glass rounded-xl p-3.5 flex gap-3 hover:border-white/10 transition-colors"
              >
                {/* Badge Icon */}
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${item.badgeColor}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-xs font-bold text-white leading-tight truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-text-muted shrink-0 flex items-center gap-1 font-mono">
                      <Clock size={9} />
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-secondary leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
