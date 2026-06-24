import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, Loader2, Sparkles, Filter, Activity, BarChart2, Star } from 'lucide-react';
import { useCopilotStore } from './CopilotStore';
import type { AnalysisMode } from './CopilotStore';
import { useMarketStore } from '../../store/useMarketStore';
import { usePortfolioStore } from '../../store/usePortfolioStore';
import { useWatchlistStore } from '../../store/useWatchlistStore';
import { useSavedScreensStore } from '../../store/SavedScreensStore';
import { CopilotEngine } from './CopilotEngine';
import { CopilotMessage } from './CopilotMessage';
import { CopilotPromptSuggestions } from './CopilotPromptSuggestions';
import { DailyBriefingCard } from './DailyBriefingCard';
import { CopilotInsightsFeed } from './CopilotInsightsFeed';

interface CopilotChatHandle {
  sendPrompt: (text: string) => void;
}

interface CopilotChatProps {
  initialPrompt?: string;
}

export const CopilotChat = forwardRef<CopilotChatHandle, CopilotChatProps>(
  ({ initialPrompt }, ref) => {
    const {
      activeChatId, isTyping, workspaceMode, activePersona,
      newChat, addMessage, updateMessage, setTyping, saveAnalysis, activeChat, setWorkspaceMode
    } = useCopilotStore();

    const { stocks } = useMarketStore();
    const { holdings } = usePortfolioStore();
    const { watchlists, activeListId } = useWatchlistStore();
    const { screens } = useSavedScreensStore();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const chat = activeChat();
    const messages = chat?.messages ?? [];

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, isTyping]);

    const promptSentRef = useRef(false);

    // Auto-send initialPrompt once
    useEffect(() => {
      if (initialPrompt && !promptSentRef.current) {
        promptSentRef.current = true;
        const t = setTimeout(() => handleSend(initialPrompt), 600);
        return () => clearTimeout(t);
      }
    }, [initialPrompt]);

    // Auto-resize textarea
    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
      }
    }, [input]);

    const handleSend = useCallback(async (text?: string) => {
      const promptText = (text ?? input).trim();
      if (!promptText) return;

      setInput('');

      let chatId = activeChatId;
      if (!chatId) {
        chatId = newChat();
      }

      // Add user prompt
      addMessage(chatId, { role: 'user', content: promptText });

      setTyping(true);
      // Simulate thinking duration
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTyping(false);

      // Evaluate active symbols list
      const activeWatchlist = watchlists.find(w => w.id === activeListId);
      const watchlistSymbols = activeWatchlist?.symbols ?? [];
      const activeScreenerMatches = stocks.filter(s => s.changePercent > 0.5); // Dummy screener match list

      // Run central analysis
      const result = CopilotEngine.generateAnalysis(
        promptText,
        activePersona,
        workspaceMode,
        stocks,
        holdings,
        watchlistSymbols,
        activeScreenerMatches
      );

      // Add assistant response
      addMessage(chatId, {
        role: 'assistant',
        content: result.summary,
        mode: result.mode,
        insights: result.insights,
        analysisBlocks: result.blocks,
        confidence: result.confidence,
        whyBreakdown: result.whyBreakdown
      });
    }, [input, activeChatId, newChat, addMessage, setTyping, activePersona, workspaceMode, stocks, holdings, watchlists, activeListId]);

    useImperativeHandle(ref, () => ({
      sendPrompt: (text: string) => handleSend(text)
    }), [handleSend]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    };

    const handleSave = () => {
      if (!activeChatId) return;
      saveAnalysis(activeChatId, `Analysis - ${new Date().toLocaleDateString()}`);
    };

    const contextChips: { id: AnalysisMode; label: string; icon: any }[] = [
      { id: 'general', label: 'All Context', icon: Bot },
      { id: 'portfolio', label: 'Portfolio', icon: BarChart2 },
      { id: 'watchlist', label: 'Watchlist', icon: Star },
      { id: 'market', label: 'Market', icon: Activity },
      { id: 'screener', label: 'Screener', icon: Filter },
      { id: 'research', label: 'Stock Search', icon: Sparkles }
    ];

    const isEmpty = messages.length === 0;

    return (
      <div className="flex-1 flex flex-col min-w-0 bg-[#0E1218]/45 border border-border-glass rounded-2xl p-4">
        {/* Messages / Briefing Workspace */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
          {isEmpty ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              {/* Daily Briefing Card */}
              <DailyBriefingCard onSelectPrompt={handleSend} />

              <div className="text-center space-y-2 mt-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Copilot Analysis Workspace</h2>
                <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
                  Toggle workspace modes or personas on the left sidebar to audit concentration drawdowns, beta variances, and macro sector signals.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="w-full">
                <CopilotPromptSuggestions onSelect={handleSend} />
              </div>

              {/* Passive Insights Feed */}
              <CopilotInsightsFeed onSelectPrompt={handleSend} />
            </motion.div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <CopilotMessage
                  key={msg.id}
                  msg={msg}
                  isLatest={i === messages.length - 1}
                  onSave={handleSave}
                  onSelectPrompt={handleSend}
                />
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-text-muted font-mono animate-pulse pl-2">
                  <Loader2 className="w-4.5 h-4.5 text-app-green animate-spin" />
                  <span>AI Copilot is generating quantitative analysis...</span>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Context Chips & Text Area */}
        <div className="mt-4 shrink-0 space-y-2.5">
          {/* Context Chips Selector (P0 Upgrade 5) */}
          <div className="flex flex-wrap gap-1.5 border-b border-border-glass/40 pb-2">
            {contextChips.map((chip) => {
              const Icon = chip.icon;
              const isSel = workspaceMode === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setWorkspaceMode(chip.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold tracking-tight transition-all duration-200 ${
                    isSel
                      ? 'border-app-green/30 bg-app-green/5 text-white'
                      : 'border-border-glass bg-white/[0.01] text-text-secondary hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {chip.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-end gap-3 p-3 rounded-2xl border border-border-glass bg-surface-low/60 backdrop-blur-glass focus-within:border-app-green/40 transition-colors duration-200">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything (${workspaceMode === 'general' ? 'general' : workspaceMode} mode)...`}
              rows={1}
              aria-label="Prompt input"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-text-muted resize-none outline-none leading-relaxed min-h-[24px]"
              style={{ maxHeight: 120 }}
            />
            <motion.button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              whileTap={{ scale: 0.92 }}
              className="w-9 h-9 rounded-xl bg-app-green flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-app-green/80 transition-colors"
              aria-label="Submit prompt"
            >
              <Send className="w-4 h-4 text-black" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }
);

CopilotChat.displayName = 'CopilotChat';
