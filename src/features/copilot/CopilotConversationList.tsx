import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Pin, Edit2, Trash2, CheckCircle, BookMarked, History, Star, Bookmark } from 'lucide-react';
import { useCopilotStore } from './CopilotStore';

interface Props {
  onPromptSelect: (text: string) => void;
}

export const CopilotConversationList: React.FC<Props> = ({ onPromptSelect }) => {
  const {
    chats, activeChatId, savedAnalyses,
    recentStocks, recentAnalyses, favoriteQueries, pinnedFindings,
    deleteChat, renameChat, pinChat, setActiveChat,
    deleteSavedAnalysis, toggleFavoriteQuery, togglePinnedFinding
  } = useCopilotStore();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const sortedChats = [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="space-y-4">
      {/* 1. Recent Chats List */}
      <div className="glass-card rounded-2xl border border-border-glass overflow-hidden">
        <div className="px-3 py-2.5 border-b border-border-glass/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Conversations</span>
          </div>
        </div>
        <div className="divide-y divide-border-glass/40 max-h-[220px] overflow-y-auto">
          {sortedChats.length === 0 ? (
            <p className="text-[10px] text-text-muted px-3 py-4 text-center">No active chats. Start one above!</p>
          ) : (
            sortedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`group px-3 py-2.5 cursor-pointer transition-all hover:bg-white/[0.02] flex items-center justify-between gap-2 ${
                  activeChatId === chat.id ? 'bg-app-green/5 border-l-2 border-l-app-green/60' : ''
                }`}
              >
                {renamingId === chat.id ? (
                  <div className="flex gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      autoFocus
                      value={renameVal}
                      onChange={(e) => setRenameVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          renameChat(chat.id, renameVal);
                          setRenamingId(null);
                        }
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      className="flex-1 bg-surface-lowest border border-border-glass rounded px-2 py-0.5 text-[11px] text-white outline-none focus:border-app-green/50"
                    />
                    <button onClick={() => { renameChat(chat.id, renameVal); setRenamingId(null); }}>
                      <CheckCircle className="w-3.5 h-3.5 text-app-green" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {chat.pinned && <Pin className="w-2.5 h-2.5 text-yellow-400 shrink-0" />}
                        <p className="text-[11px] font-semibold text-white truncate leading-tight">{chat.title}</p>
                      </div>
                      <span className="text-[9px] text-text-muted font-mono capitalize">
                        {chat.persona?.replace('_', ' ') || 'PM'} Mode
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); pinChat(chat.id); }}
                        className={`p-1 rounded transition-colors ${chat.pinned ? 'text-yellow-400' : 'text-text-muted hover:text-yellow-400'}`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setRenamingId(chat.id); setRenameVal(chat.title); }}
                        className="p-1 rounded text-text-muted hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                        className="p-1 rounded text-text-muted hover:text-app-red transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Workspace Memory: Recent Stocks & Pins */}
      <div className="glass-card rounded-2xl border border-border-glass overflow-hidden p-3.5 space-y-3">
        {/* Recent Stocks */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Recent Symbols</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {recentStocks.map((symbol) => (
              <button
                key={symbol}
                onClick={() => onPromptSelect(`Analyze ${symbol}`)}
                className="px-2 py-1 rounded bg-white/5 border border-white/5 hover:border-app-green/30 text-[10px] font-mono text-white transition-colors"
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Favorite Queries */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-3.5 h-3.5 text-text-muted" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Favorite Queries</span>
          </div>
          <div className="space-y-1">
            {favoriteQueries.map((q, idx) => (
              <div key={idx} className="flex justify-between items-center text-[10px] text-text-secondary py-0.5 border-b border-white/[0.02] last:border-0 hover:text-white">
                <button onClick={() => onPromptSelect(q)} className="text-left truncate max-w-[150px]">
                  {q}
                </button>
                <button onClick={() => toggleFavoriteQuery(q)} className="text-text-muted hover:text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Findings */}
        {pinnedFindings.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Pinned Findings</span>
            </div>
            <div className="space-y-1">
              {pinnedFindings.map((f, idx) => (
                <div key={idx} className="flex justify-between items-center text-[10px] text-text-secondary py-0.5 border-b border-white/[0.02] last:border-0">
                  <span className="truncate max-w-[150px]">{f}</span>
                  <button onClick={() => togglePinnedFinding(f)} className="text-text-muted hover:text-app-red">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="glass-card rounded-2xl border border-border-glass overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border-glass/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookMarked className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Saved Analyses</span>
            </div>
          </div>
          <div className="divide-y divide-border-glass/40 max-h-[140px] overflow-y-auto">
            {savedAnalyses.map((a) => (
              <div key={a.id} className="group flex items-start justify-between gap-2 px-3 py-2 hover:bg-white/[0.01] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-white truncate">{a.title}</p>
                  <span className="text-[9px] text-text-muted capitalize">{a.mode}</span>
                </div>
                <button
                  onClick={() => deleteSavedAnalysis(a.id)}
                  className="p-1 text-text-muted hover:text-app-red opacity-0 group-hover:opacity-100 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default CopilotConversationList;
