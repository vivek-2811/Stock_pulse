import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MessageRole = 'user' | 'assistant';
export type AnalysisMode = 'research' | 'portfolio' | 'watchlist' | 'market' | 'screener' | 'compare' | 'general';
export type PersonaType = 'strategist' | 'pm' | 'growth' | 'risk_officer';
export type ConfidenceLevel = 'Low' | 'Medium' | 'High';

export interface InsightData {
  type: 'opportunity' | 'risk' | 'trend' | 'alert' | 'neutral';
  title: string;
  value?: string;
  description: string;
}

export interface AnalysisBlock {
  id: string;
  title: string;
  content: string;
  insights?: InsightData[];
  confidence?: ConfidenceLevel;
  expanded?: boolean;
}

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  mode?: AnalysisMode;
  persona?: PersonaType;
  analysisBlocks?: AnalysisBlock[];
  insights?: InsightData[];
  confidence?: ConfidenceLevel;
  timestamp: string;
  isStreaming?: boolean;
  whyBreakdown?: string[]; // Evidence/Explainability Panel list
}

export interface Chat {
  id: string;
  title: string;
  messages: CopilotMessage[];
  createdAt: string;
  updatedAt: string;
  pinned: boolean;
  mode?: AnalysisMode;
  persona?: PersonaType;
}

export interface SavedAnalysis {
  id: string;
  title: string;
  mode: AnalysisMode;
  messages: CopilotMessage[];
  savedAt: string;
  tags: string[];
}

interface CopilotState {
  chats: Chat[];
  activeChatId: string | null;
  savedAnalyses: SavedAnalysis[];
  isTyping: boolean;
  activePersona: PersonaType;
  workspaceMode: AnalysisMode;

  // Workspace Memory (P1 Upgrade 6)
  recentStocks: string[];
  recentAnalyses: string[];
  favoriteQueries: string[];
  pinnedFindings: string[];

  // Actions — chats
  newChat: () => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  pinChat: (id: string) => void;
  setActiveChat: (id: string) => void;
  setPersona: (persona: PersonaType) => void;
  setWorkspaceMode: (mode: AnalysisMode) => void;

  // Actions — messages
  addMessage: (chatId: string, message: Omit<CopilotMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (chatId: string, msgId: string, patch: Partial<CopilotMessage>) => void;
  setTyping: (v: boolean) => void;

  // Actions — saved analyses
  saveAnalysis: (chatId: string, title: string, tags?: string[]) => void;
  deleteSavedAnalysis: (id: string) => void;

  // Actions — Workspace Memory
  addRecentStock: (symbol: string) => void;
  addRecentAnalysis: (title: string) => void;
  toggleFavoriteQuery: (query: string) => void;
  togglePinnedFinding: (finding: string) => void;

  // Selectors
  activeChat: () => Chat | null;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function defaultChat(): Chat {
  return {
    id: makeId(),
    title: 'New Conversation',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false,
    persona: 'pm',
    mode: 'general'
  };
}

export const useCopilotStore = create<CopilotState>()(
  persist(
    (set, get) => ({
      chats: [],
      activeChatId: null,
      savedAnalyses: [],
      isTyping: false,
      activePersona: 'pm',
      workspaceMode: 'general',

      recentStocks: ['AAPL', 'NVDA', 'MSFT'],
      recentAnalyses: [],
      favoriteQueries: [
        'Analyze my portfolio risk',
        'Compare AAPL vs MSFT',
        'Summarize today\'s market',
        'Explain current market regime'
      ],
      pinnedFindings: [],

      newChat: () => {
        const chat = defaultChat();
        set((s) => ({ chats: [chat, ...s.chats], activeChatId: chat.id }));
        return chat.id;
      },

      deleteChat: (id) =>
        set((s) => {
          const chats = s.chats.filter((c) => c.id !== id);
          const activeChatId =
            s.activeChatId === id ? (chats[0]?.id ?? null) : s.activeChatId;
          return { chats, activeChatId };
        }),

      renameChat: (id, title) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        })),

      pinChat: (id) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        })),

      setActiveChat: (id) => set({ activeChatId: id }),

      setPersona: (activePersona) => set({ activePersona }),

      setWorkspaceMode: (workspaceMode) => set({ workspaceMode }),

      addMessage: (chatId, message) => {
        const id = makeId();
        const msg: CopilotMessage = {
          ...message,
          id,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({
          chats: s.chats.map((c) => {
            if (c.id !== chatId) return c;
            const title =
              c.messages.length === 0 && message.role === 'user'
                ? message.content.slice(0, 48) + (message.content.length > 48 ? '…' : '')
                : c.title;
            return {
              ...c,
              title,
              messages: [...c.messages, msg],
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        return id;
      },

      updateMessage: (chatId, msgId, patch) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id !== chatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, ...patch } : m
                  ),
                }
          ),
        })),

      setTyping: (v) => set({ isTyping: v }),

      saveAnalysis: (chatId, title, tags = []) => {
        const chat = get().chats.find((c) => c.id === chatId);
        if (!chat) return;
        const analysis: SavedAnalysis = {
          id: makeId(),
          title,
          mode: chat.mode ?? 'general',
          messages: chat.messages,
          savedAt: new Date().toISOString(),
          tags,
        };
        set((s) => ({ savedAnalyses: [analysis, ...s.savedAnalyses] }));
      },

      deleteSavedAnalysis: (id) =>
        set((s) => ({
          savedAnalyses: s.savedAnalyses.filter((a) => a.id !== id),
        })),

      addRecentStock: (symbol) => set((s) => {
        const clean = symbol.toUpperCase().trim();
        if (!clean) return {};
        const list = s.recentStocks.filter(x => x !== clean);
        return { recentStocks: [clean, ...list].slice(0, 8) };
      }),

      addRecentAnalysis: (title) => set((s) => {
        const list = s.recentAnalyses.filter(x => x !== title);
        return { recentAnalyses: [title, ...list].slice(0, 8) };
      }),

      toggleFavoriteQuery: (query) => set((s) => {
        const has = s.favoriteQueries.includes(query);
        return {
          favoriteQueries: has
            ? s.favoriteQueries.filter(x => x !== query)
            : [...s.favoriteQueries, query]
        };
      }),

      togglePinnedFinding: (finding) => set((s) => {
        const has = s.pinnedFindings.includes(finding);
        return {
          pinnedFindings: has
            ? s.pinnedFindings.filter(x => x !== finding)
            : [...s.pinnedFindings, finding]
        };
      }),

      activeChat: () => {
        const s = get();
        return s.chats.find((c) => c.id === s.activeChatId) ?? null;
      },
    }),
    { name: 'stockpulse-copilot' }
  )
);
