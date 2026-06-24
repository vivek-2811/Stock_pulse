import { mockDataEngine } from './mockDataEngine';
import type { Stock, MarketIndex } from './mockDataEngine';

export interface ReplayState {
  playbackState: 'playing' | 'paused';
  currentSpeed: 1 | 2 | 5 | 10;
  tickIndex: number;
  bufferSize: number;
}

export type ReplayCallback = (data: {
  stocks: Stock[];
  indices: MarketIndex[];
  state: ReplayState;
}) => void;

class ReplayEngine {
  private buffer: { stocks: Stock[]; indices: MarketIndex[]; timestamp: number }[] = [];
  private maxBufferSize = 1000;
  private currentIndex = 999; // start at the latest index
  private speed: 1 | 2 | 5 | 10 = 1;
  private isPlaying = false;
  private timerId: any = null;
  private baseIntervalMs = 2000; // 2 seconds base update frequency
  private callbacks = new Set<ReplayCallback>();

  constructor() {
    this.initializeBuffer();
  }

  // Pre-populate 1000 ticks of data using random walk
  private initializeBuffer() {
    const liveStocks = [...mockDataEngine.getStocks()];
    const liveIndices = [...mockDataEngine.getIndices()];

    // Seed data
    let currentStocks = JSON.parse(JSON.stringify(liveStocks)) as Stock[];
    let currentIndices = JSON.parse(JSON.stringify(liveIndices)) as MarketIndex[];

    // Calculate backward ticks
    const temporaryBuffer: { stocks: Stock[]; indices: MarketIndex[]; timestamp: number }[] = [];

    for (let i = 0; i < this.maxBufferSize; i++) {
      // Simulate random walk step for each stock
      currentStocks = currentStocks.map(stock => {
        const volatility = (stock.beta || 1.0) * 0.0015;
        const direction = Math.random() - 0.49; // slight upward bias
        const variance = direction * volatility;
        const changeVal = stock.price * variance;
        const newPrice = Math.max(1, Number((stock.price + changeVal).toFixed(2)));
        const originalBase = stock.price - stock.change;
        const totalChange = Number((newPrice - originalBase).toFixed(2));
        const percent = Number(((totalChange / originalBase) * 100).toFixed(2));

        return {
          ...stock,
          price: newPrice,
          change: totalChange,
          changePercent: percent,
          sparkline: [...stock.sparkline.slice(1), newPrice]
        };
      });

      // Sim walk for indices
      currentIndices = currentIndices.map(idx => {
        const direction = idx.symbol === 'DOW JONES' ? -0.45 : 0.52;
        const variance = (Math.random() - direction) * 0.002;
        const changeVal = idx.price * variance;
        const newPrice = Math.max(1, Number((idx.price + changeVal).toFixed(2)));
        const originalBase = idx.price - idx.change;
        const totalChange = Number((newPrice - originalBase).toFixed(2));
        const percent = Number(((totalChange / originalBase) * 100).toFixed(2));

        return {
          ...idx,
          price: newPrice,
          change: totalChange,
          changePercent: percent,
          sparkline: [...idx.sparkline.slice(1), newPrice]
        };
      });

      temporaryBuffer.unshift({
        stocks: JSON.parse(JSON.stringify(currentStocks)),
        indices: JSON.parse(JSON.stringify(currentIndices)),
        timestamp: Date.now() - (this.maxBufferSize - 1 - i) * 2000
      });
    }

    this.buffer = temporaryBuffer;
    this.currentIndex = this.maxBufferSize - 1; // point to latest tick
  }

  // Register subscription callbacks
  public subscribe(cb: ReplayCallback) {
    this.callbacks.add(cb);
    this.emitState();
    return () => {
      this.callbacks.delete(cb);
    };
  }

  private emitState() {
    const currentTick = this.buffer[this.currentIndex];
    const state: ReplayState = {
      playbackState: this.isPlaying ? 'playing' : 'paused',
      currentSpeed: this.speed,
      tickIndex: this.currentIndex,
      bufferSize: this.maxBufferSize
    };
    this.callbacks.forEach(cb => cb({
      stocks: currentTick.stocks,
      indices: currentTick.indices,
      state
    }));
  }

  // Play controls
  public play() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.startTimer();
    this.emitState();
  }

  public pause() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.stopTimer();
    this.emitState();
  }

  public setSpeed(speed: 1 | 2 | 5 | 10) {
    this.speed = speed;
    this.emitState();
    if (this.isPlaying) {
      this.stopTimer();
      this.startTimer();
    }
  }

  public stepForward() {
    if (this.currentIndex < this.maxBufferSize - 1) {
      this.currentIndex++;
      this.emitState();
    }
  }

  public stepBackward() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.emitState();
    }
  }

  public seek(index: number) {
    if (index >= 0 && index < this.maxBufferSize) {
      this.currentIndex = index;
      this.emitState();
    }
  }

  public seekToTimestamp(targetTimestamp: number) {
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < this.buffer.length; i++) {
      const diff = Math.abs(this.buffer[i].timestamp - targetTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    this.seek(closestIndex);
  }

  private startTimer() {
    const interval = this.baseIntervalMs / this.speed;
    this.timerId = setInterval(() => {
      if (this.currentIndex < this.maxBufferSize - 1) {
        this.currentIndex++;
        this.emitState();
      } else {
        // Wrap around/loop or pause
        this.pause();
      }
    }, interval);
  }

  private stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getBuffer() {
    return this.buffer;
  }

  public getCurrentIndex() {
    return this.currentIndex;
  }
}

export const replayEngine = new ReplayEngine();
export default replayEngine;
