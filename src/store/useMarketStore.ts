import { create } from 'zustand';
import { marketDataStream } from '../services/marketDataStream';
import type { ConnectionStatus, StreamLog } from '../services/marketDataStream';
import { replayEngine } from '../services/replayEngine';
import { mockDataEngine } from '../services/mockDataEngine';
import type { Stock, MarketIndex } from '../services/mockDataEngine';

interface MarketState {
  stocks: Stock[];
  stocksBySymbol: Record<string, Stock>;
  stockIdsBySector: Record<string, string[]>;
  indices: MarketIndex[];
  
  // Mode Status
  isReplayMode: boolean;
  
  // WebSocket Stream Status
  connectionStatus: ConnectionStatus;
  msgsPerSec: number;
  connectionLogs: StreamLog[];
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
  
  // Replay Status
  playbackState: 'playing' | 'paused';
  currentSpeed: 1 | 2 | 5 | 10;
  tickIndex: number;
  bufferSize: number;

  // Actions
  setReplayMode: (active: boolean) => void;
  playReplay: () => void;
  pauseReplay: () => void;
  setReplaySpeed: (speed: 1 | 2 | 5 | 10) => void;
  stepForward: () => void;
  stepBackward: () => void;
  seekReplay: (index: number) => void;
  seekToTimestamp: (timestamp: number) => void;
  
  connectSocket: () => void;
  disconnectSocket: () => void;
  triggerFailure: () => void;
}

// Helper to build fast O(1) indices for stock retrieval
function buildSectorAndSymbolIndexes(stocksList: Stock[]) {
  const stocksBySymbol: Record<string, Stock> = {};
  const stockIdsBySector: Record<string, string[]> = {};
  
  stocksList.forEach(stock => {
    stocksBySymbol[stock.symbol] = stock;
    if (!stockIdsBySector[stock.sector]) {
      stockIdsBySector[stock.sector] = [];
    }
    stockIdsBySector[stock.sector].push(stock.symbol);
  });
  
  return { stocksBySymbol, stockIdsBySector };
}

// Global active unsubscribes to manage hooks cleanups
let activeUnsubscribe: (() => void) | null = null;

export const useMarketStore = create<MarketState>((set, get) => {
  // Syncing logic: Subscribe to appropriate engine
  const syncWithEngine = (isReplay: boolean) => {
    if (activeUnsubscribe) {
      activeUnsubscribe();
      activeUnsubscribe = null;
    }

    if (isReplay) {
      // Pause live socket stream
      marketDataStream.disconnect();
      
      // Subscribe to ReplayEngine
      activeUnsubscribe = replayEngine.subscribe(({ stocks, indices, state }) => {
        const { stocksBySymbol, stockIdsBySector } = buildSectorAndSymbolIndexes(stocks);
        set({
          stocks,
          stocksBySymbol,
          stockIdsBySector,
          indices,
          playbackState: state.playbackState,
          currentSpeed: state.currentSpeed,
          tickIndex: state.tickIndex,
          bufferSize: state.bufferSize,
          connectionStatus: 'DISCONNECTED',
          msgsPerSec: 0,
          reconnectAttempts: 0,
          maxReconnectAttempts: 5,
          lastConnectedAt: null,
          lastDisconnectedAt: null
        });
      });
      // Start paused by default
      replayEngine.pause();
    } else {
      // Reconnect Live Socket stream
      marketDataStream.connect();

      // Subscribe to live feed
      activeUnsubscribe = marketDataStream.subscribe(({ stocks, indices, status, msgsPerSec, logs, reconnectAttempts, maxReconnectAttempts, lastConnectedAt, lastDisconnectedAt }) => {
        const { stocksBySymbol, stockIdsBySector } = buildSectorAndSymbolIndexes(stocks);
        set({
          stocks,
          stocksBySymbol,
          stockIdsBySector,
          indices,
          connectionStatus: status,
          msgsPerSec,
          connectionLogs: logs,
          reconnectAttempts,
          maxReconnectAttempts,
          lastConnectedAt,
          lastDisconnectedAt,
          playbackState: 'paused',
          currentSpeed: 1,
          tickIndex: 999,
          bufferSize: 1000
        });
      });
    }
  };

  // Initialize with live data stream on load
  setTimeout(() => syncWithEngine(false), 50);

  const initialStocks = mockDataEngine.getStocks();
  const { stocksBySymbol, stockIdsBySector } = buildSectorAndSymbolIndexes(initialStocks);

  return {
    stocks: initialStocks,
    stocksBySymbol,
    stockIdsBySector,
    indices: mockDataEngine.getIndices(),
    
    isReplayMode: false,
    connectionStatus: 'DISCONNECTED',
    msgsPerSec: 0,
    connectionLogs: [],
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    lastConnectedAt: null,
    lastDisconnectedAt: new Date().toISOString(),
    
    playbackState: 'paused',
    currentSpeed: 1,
    tickIndex: 999,
    bufferSize: 1000,

    setReplayMode: (active) => {
      set({ isReplayMode: active });
      syncWithEngine(active);
    },

    playReplay: () => {
      if (get().isReplayMode) replayEngine.play();
    },

    pauseReplay: () => {
      if (get().isReplayMode) replayEngine.pause();
    },

    setReplaySpeed: (speed) => {
      if (get().isReplayMode) replayEngine.setSpeed(speed);
    },

    stepForward: () => {
      if (get().isReplayMode) replayEngine.stepForward();
    },

    stepBackward: () => {
      if (get().isReplayMode) replayEngine.stepBackward();
    },

    seekReplay: (index) => {
      if (get().isReplayMode) replayEngine.seek(index);
    },

    seekToTimestamp: (timestamp) => {
      if (!get().isReplayMode) {
        get().setReplayMode(true);
      }
      replayEngine.seekToTimestamp(timestamp);
    },

    connectSocket: () => {
      if (!get().isReplayMode) marketDataStream.connect();
    },

    disconnectSocket: () => {
      if (!get().isReplayMode) marketDataStream.disconnect();
    },

    triggerFailure: () => {
      if (!get().isReplayMode) marketDataStream.simulateNetworkFailure();
    }
  };
});
