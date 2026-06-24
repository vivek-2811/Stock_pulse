import { mockDataEngine } from './mockDataEngine';
import type { Stock, MarketIndex } from './mockDataEngine';

export type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING';

export interface StreamLog {
  id: string;
  timestamp: string;
  type: 'info' | 'error' | 'success' | 'warn';
  message: string;
}

export type StreamCallback = (data: {
  stocks: Stock[];
  indices: MarketIndex[];
  status: ConnectionStatus;
  msgsPerSec: number;
  logs: StreamLog[];
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
}) => void;

class MarketDataStream {
  private status: ConnectionStatus = 'DISCONNECTED';
  private callbacks = new Set<StreamCallback>();
  private logs: StreamLog[] = [];
  private msgsPerSec = 0;
  private messageCount = 0;
  private timerId: any = null;
  private throughputTimerId: any = null;
  private reconnectTimeoutId: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private lastConnectedAt: string | null = null;
  private lastDisconnectedAt: string | null = null;
  private bufferingQueue: { stocks: Stock[]; indices: MarketIndex[] } = { stocks: [], indices: [] };
  
  // Settings
  private bufferIntervalMs = 500; // Batch updates every 500ms to avoid UI stutter
  private rateLimitIntervalMs = 3000; // Raw frequency from mockDataEngine

  constructor() {
    this.lastDisconnectedAt = new Date().toISOString();
    this.connect();
    this.startThroughputTracker();
  }

  public subscribe(cb: StreamCallback) {
    this.callbacks.add(cb);
    this.emit();
    return () => {
      this.callbacks.delete(cb);
    };
  }

  private addLog(type: 'info' | 'error' | 'success' | 'warn', message: string) {
    const timestamp = new Date().toLocaleTimeString();
    const log: StreamLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      type,
      message
    };
    this.logs = [log, ...this.logs].slice(0, 100); // Keep last 100 logs
  }

  private emit() {
    const data = {
      stocks: mockDataEngine.getStocks(),
      indices: mockDataEngine.getIndices(),
      status: this.status,
      msgsPerSec: this.msgsPerSec,
      logs: this.logs,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      lastConnectedAt: this.lastConnectedAt,
      lastDisconnectedAt: this.lastDisconnectedAt
    };
    this.callbacks.forEach(cb => cb(data));
  }

  public connect() {
    if (this.status === 'CONNECTED' || this.status === 'CONNECTING') return;

    this.status = 'CONNECTING';
    this.addLog('info', 'Establishing WebSocket connection to wss://api.stockpulse.ai/live/v1...');
    this.emit();

    // Simulate connection delay
    setTimeout(() => {
      this.status = 'CONNECTED';
      this.reconnectAttempts = 0;
      this.lastConnectedAt = new Date().toISOString();
      this.addLog('success', 'WebSocket connection established successfully. Subscribed to market feeds.');
      this.startStreaming();
      this.emit();
    }, 1500);
  }

  public disconnect() {
    this.status = 'DISCONNECTED';
    this.lastDisconnectedAt = new Date().toISOString();
    this.addLog('warn', 'WebSocket connection terminated by user.');
    this.stopStreaming();
    this.emit();
  }

  private startStreaming() {
    this.stopStreaming();

    // Listen to the mock data engine pricing loop
    const unsubscribeMock = mockDataEngine.subscribe((latest) => {
      if (this.status !== 'CONNECTED') return;

      // Queue items for buffering
      this.bufferingQueue = {
        stocks: latest.stocks,
        indices: latest.indices
      };
      
      this.messageCount += latest.stocks.length + latest.indices.length;
    });

    // Buffer tick dispatcher
    this.timerId = setInterval(() => {
      if (this.bufferingQueue.stocks.length > 0) {
        this.emit(); // Dispatch buffered updates
      }
    }, this.bufferIntervalMs);

    // Save unsubscribe callback
    (this as any).unsubscribeMock = unsubscribeMock;
  }

  private stopStreaming() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if ((this as any).unsubscribeMock) {
      (this as any).unsubscribeMock();
      (this as any).unsubscribeMock = null;
    }
  }

  private startThroughputTracker() {
    setInterval(() => {
      if (this.status === 'CONNECTED') {
        this.msgsPerSec = Math.round(this.messageCount);
      } else {
        this.msgsPerSec = 0;
      }
      this.messageCount = 0;
      this.emit();
    }, 1000);
  }

  // Force mock disconnect to demonstrate reconnect logic
  public simulateNetworkFailure() {
    if (this.status !== 'CONNECTED') return;

    this.status = 'DISCONNECTED';
    this.lastDisconnectedAt = new Date().toISOString();
    this.stopStreaming();
    this.addLog('error', 'WebSocket connection closed unexpectedly (Code 1006 - Network Timeout).');
    this.emit();

    this.triggerReconnect();
  }

  private triggerReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.addLog('error', 'Max reconnection attempts reached. Please check connection status.');
      this.emit();
      return;
    }

    this.status = 'RECONNECTING';
    this.reconnectAttempts++;
    this.lastDisconnectedAt = new Date().toISOString();
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    this.addLog('warn', `Attempting auto-reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${(delay / 1000).toFixed(0)}s...`);
    this.emit();

    this.reconnectTimeoutId = setTimeout(() => {
      this.status = 'CONNECTING';
      this.emit();
      
      setTimeout(() => {
        // 80% success probability to show backoff progression
        if (Math.random() > 0.2) {
          this.status = 'CONNECTED';
          this.reconnectAttempts = 0;
          this.lastConnectedAt = new Date().toISOString();
          this.addLog('success', 'Reconnected successfully to wss://api.stockpulse.ai/live/v1.');
          this.startStreaming();
        } else {
          this.status = 'DISCONNECTED';
          this.lastDisconnectedAt = new Date().toISOString();
          this.addLog('error', 'Reconnection failed.');
          this.triggerReconnect();
        }
        this.emit();
      }, 1000);
    }, delay);
  }
}

export const marketDataStream = new MarketDataStream();
export default marketDataStream;
