/**
 * Technical indicators helper formulas for StockPulse
 */

// Simple Moving Average (SMA)
export function calculateSMA(data: number[], period: number): (number | null)[] {
  const sma: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      sma.push(Number((sum / period).toFixed(2)));
    }
  }
  return sma;
}

// Exponential Moving Average (EMA)
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const ema: (number | null)[] = [];
  if (data.length === 0) return ema;

  const k = 2 / (period + 1);
  let prevEma = data[0]; // Seed with the first value

  // Seed first elements up to period with SMA, or simple average
  let initialSum = 0;
  for (let i = 0; i < Math.min(period, data.length); i++) {
    initialSum += data[i];
  }
  prevEma = initialSum / Math.min(period, data.length);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null);
    } else if (i === period - 1) {
      ema.push(Number(prevEma.toFixed(2)));
    } else {
      const currentEma = data[i] * k + prevEma * (1 - k);
      ema.push(Number(currentEma.toFixed(2)));
      prevEma = currentEma;
    }
  }
  return ema;
}

// Bollinger Bands (BB)
export function calculateBollingerBands(
  data: number[],
  period: number,
  stdDevMultiplier: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const upper: (number | null)[] = [];
  const middle: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(null);
      middle.push(null);
      lower.push(null);
    } else {
      // SMA middle band
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      const avg = sum / period;
      middle.push(Number(avg.toFixed(2)));

      // Standard Deviation
      let varianceSum = 0;
      for (let j = 0; j < period; j++) {
        varianceSum += Math.pow(data[i - j] - avg, 2);
      }
      const stdDev = Math.sqrt(varianceSum / period);

      upper.push(Number((avg + stdDev * stdDevMultiplier).toFixed(2)));
      lower.push(Number((avg - stdDev * stdDevMultiplier).toFixed(2)));
    }
  }

  return { upper, middle, lower };
}

// Relative Strength Index (RSI)
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  const rsi: (number | null)[] = [];
  if (data.length < period + 1) {
    return Array(data.length).fill(null);
  }

  let gains = 0;
  let losses = 0;

  // Calculate first average gain and loss
  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Fill up to index 'period' with null
  for (let i = 0; i < period; i++) {
    rsi.push(null);
  }

  const initialRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  rsi.push(Number((100 - 100 / (1 + initialRs)).toFixed(2)));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    let currentGain = diff > 0 ? diff : 0;
    let currentLoss = diff < 0 ? -diff : 0;

    // Smoothed values
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(Number((100 - 100 / (1 + rs)).toFixed(2)));
    }
  }

  return rsi;
}

// MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const macd: (number | null)[] = [];
  const signal: (number | null)[] = [];
  const histogram: (number | null)[] = [];

  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);

  // Compute raw MACD line (Fast EMA - Slow EMA)
  const macdLineRaw: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const fast = fastEma[i];
    const slow = slowEma[i];

    if (fast === null || slow === null) {
      macd.push(null);
      macdLineRaw.push(0); // placeholder for signal EMA calculation
    } else {
      const val = fast - slow;
      macd.push(Number(val.toFixed(2)));
      macdLineRaw.push(val);
    }
  }

  // Compute Signal Line (EMA of MACD line)
  // We need to slice the raw macd line to only compute EMA on valid values
  const validStartIndex = slowPeriod - 1;
  const validMacdLine = macdLineRaw.slice(validStartIndex);
  const signalLineRaw = calculateEMA(validMacdLine, signalPeriod);

  // Re-align signal line with original indices
  let signalIndex = 0;
  for (let i = 0; i < data.length; i++) {
    if (i < validStartIndex + signalPeriod - 1) {
      signal.push(null);
      histogram.push(null);
    } else {
      const sigVal = signalLineRaw[signalIndex++];
      const macdVal = macd[i];

      if (sigVal === null || macdVal === null) {
        signal.push(null);
        histogram.push(null);
      } else {
        signal.push(Number(sigVal.toFixed(2)));
        histogram.push(Number((macdVal - sigVal).toFixed(2)));
      }
    }
  }

  return { macd, signal, histogram };
}
