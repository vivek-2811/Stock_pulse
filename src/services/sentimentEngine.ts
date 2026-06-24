import { mockDataEngine } from './mockDataEngine';
import type { Stock } from './mockDataEngine';

export interface MarketSentiment {
  bullish: number;
  bearish: number;
  neutral: number;
  score: number; // 0 to 100
  label: 'Strongly Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strongly Bearish';
}

class SentimentEngine {
  private positiveKeywords = [
    'surge', 'gain', 'growth', 'bullish', 'optimism', 'beat', 'buying', 
    'higher', 'climb', 'momentum', 'rally', 'record', 'highs', 'accelerate'
  ];

  private negativeKeywords = [
    'fall', 'drop', 'decline', 'bearish', 'fear', 'inflation', 'selloff', 
    'lower', 'slump', 'warnings', 'cuts', 'loss', 'losses', 'shrink', 'risk'
  ];

  public calculateSentiment(stocks: Stock[]): MarketSentiment {
    // 1. Calculate Advance / Decline influence (40% weight)
    const total = stocks.length;
    if (total === 0) {
      return { bullish: 50, bearish: 25, neutral: 25, score: 50, label: 'Neutral' };
    }

    const advancing = stocks.filter(s => s.change > 0).length;
    const ratio = advancing / total; // value between 0 and 1

    // 2. Calculate News keyword influence (40% weight)
    const news = mockDataEngine.getNews();
    let positiveCount = 0;
    let negativeCount = 0;

    news.forEach(item => {
      const text = (item.title + ' ' + item.summary).toLowerCase();
      this.positiveKeywords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      this.negativeKeywords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });

    const totalKeywords = positiveCount + negativeCount;
    const newsRatio = totalKeywords === 0 ? 0.5 : positiveCount / totalKeywords;

    // 3. Calculate Index momentum influence (20% weight)
    const indices = mockDataEngine.getIndices();
    const positiveIndices = indices.filter(idx => idx.change > 0).length;
    const indexRatio = indices.length === 0 ? 0.5 : positiveIndices / indices.length;

    // Combined Score (0 to 100)
    const combinedRatio = (ratio * 0.4) + (newsRatio * 0.4) + (indexRatio * 0.2);
    const score = Math.round(combinedRatio * 100);

    // Distribute percentages
    const bullish = score;
    const bearish = Math.round((100 - score) * 0.6);
    const neutral = 100 - bullish - bearish;

    let label: MarketSentiment['label'] = 'Neutral';
    if (score >= 80) label = 'Strongly Bullish';
    else if (score >= 60) label = 'Bullish';
    else if (score >= 40) label = 'Neutral';
    else if (score >= 20) label = 'Bearish';
    else label = 'Strongly Bearish';

    return {
      bullish,
      bearish,
      neutral,
      score,
      label
    };
  }
}

export const sentimentEngine = new SentimentEngine();
export default sentimentEngine;
