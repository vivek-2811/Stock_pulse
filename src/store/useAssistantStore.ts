import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePortfolioStore } from './usePortfolioStore';
import { useMarketStore } from './useMarketStore';
import type { Stock } from '../services/mockDataEngine';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AssistantState {
  messages: ChatMessage[];
  lastComparedSymbols: string[];
  lastAnalyzedSymbol: string;
  lastPortfolioSummary: string;

  addMessage: (role: 'user' | 'assistant', content: string) => void;
  clearHistory: () => void;
  generateResponse: (userMessage: string) => Promise<string>;
}

export const useAssistantStore = create<AssistantState>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: 'initial',
          role: 'assistant',
          content: 'Hello, I am your StockPulse AI Copilot. I have access to your live portfolio, watchlist alerts, and market trends. Try typing commands like `/risk`, `/compare AAPL MSFT`, or ask a follow-up like "Which of those has lower beta?"',
          timestamp: new Date().toLocaleTimeString()
        }
      ],
      lastComparedSymbols: [],
      lastAnalyzedSymbol: '',
      lastPortfolioSummary: '',

      addMessage: (role, content) => {
        const msg: ChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          role,
          content,
          timestamp: new Date().toLocaleTimeString()
        };
        set(state => ({ messages: [...state.messages, msg] }));
      },

      clearHistory: () => set({
        messages: [
          {
            id: 'initial',
            role: 'assistant',
            content: 'Conversation history cleared. Ask me anything about stock symbols or your portfolio!',
            timestamp: new Date().toLocaleTimeString()
          }
        ],
        lastComparedSymbols: [],
        lastAnalyzedSymbol: '',
        lastPortfolioSummary: ''
      }),

      generateResponse: async (userMessage) => {
        const query = userMessage.trim();
        let response = '';

        const marketState = useMarketStore.getState();
        const portfolioState = usePortfolioStore.getState();

        const cleanQuery = query.toLowerCase();

        // 1. Analyze /buy command
        if (cleanQuery.startsWith('/buy')) {
          const parts = query.split(/\s+/);
          const symbol = parts[1]?.toUpperCase();
          const quantity = parseInt(parts[2]);

          if (!symbol || isNaN(quantity)) {
            response = 'Usage: `/buy SYMBOL QUANTITY` (e.g. `/buy AAPL 10`)';
          } else {
            const stock = marketState.stocks.find(s => s.symbol === symbol);
            if (!stock) {
              response = `Symbol ${symbol} not found in our live market list.`;
            } else {
              portfolioState.buyStock(symbol, quantity, stock.price);
              response = `Trade Executed: Successfully purchased ${quantity} shares of **${symbol}** at $${stock.price.toFixed(2)} each. Transaction logged in your ledger.`;
              set({ lastAnalyzedSymbol: symbol });
            }
          }
        }
        // 2. Analyze /sell command
        else if (cleanQuery.startsWith('/sell')) {
          const parts = query.split(/\s+/);
          const symbol = parts[1]?.toUpperCase();
          const quantity = parseInt(parts[2]);

          if (!symbol || isNaN(quantity)) {
            response = 'Usage: `/sell SYMBOL QUANTITY` (e.g. `/sell TSLA 5`)';
          } else {
            const holding = portfolioState.holdings.find(h => h.symbol === symbol);
            if (!holding || holding.quantity < quantity) {
              response = `Insufficient holdings. You only own ${holding?.quantity || 0} shares of **${symbol}**.`;
            } else {
              const stock = marketState.stocks.find(s => s.symbol === symbol);
              const price = stock ? stock.price : holding.avgBuyPrice;
              portfolioState.sellStock(symbol, quantity, price);
              response = `Trade Executed: Successfully sold ${quantity} shares of **${symbol}** at $${price.toFixed(2)} each. Ledger updated.`;
              set({ lastAnalyzedSymbol: symbol });
            }
          }
        }
        // 3. Analyze /compare command
        else if (cleanQuery.startsWith('/compare')) {
          const parts = query.split(/\s+/).slice(1);
          const symbols = parts.map(s => s.toUpperCase().replace(',', ''));

          if (symbols.length < 2) {
            response = 'Usage: `/compare SYMBOL1 SYMBOL2` (e.g. `/compare AAPL MSFT`)';
          } else {
            const comparisons = symbols.map(sym => {
              const s = marketState.stocks.find(st => st.symbol === sym);
              return s ? `${sym} ($${s.price.toFixed(2)}, PE: ${s.peRatio || '--'}, Beta: ${s.beta || '1.0'}, Day change: ${s.changePercent.toFixed(2)}%)` : null;
            }).filter(Boolean);

            if (comparisons.length === 0) {
              response = 'None of the requested symbols were found in our data engine.';
            } else {
              response = `### Comparison Summary:\n${comparisons.map(c => `- ${c}`).join('\n')}\n\nYou can ask follow-up questions like: "Which is safer?" or "Which has higher beta?"`;
              set({ lastComparedSymbols: symbols });
            }
          }
        }
        // 4. Analyze /analyze command
        else if (cleanQuery.startsWith('/analyze')) {
          const parts = query.split(/\s+/);
          const symbol = parts[1]?.toUpperCase();

          if (!symbol) {
            response = 'Usage: `/analyze SYMBOL` (e.g. `/analyze NVDA`)';
          } else {
            const stock = marketState.stocks.find(s => s.symbol === symbol);
            if (!stock) {
              response = `Symbol ${symbol} was not found.`;
            } else {
              const rating = stock.peRatio > 40 ? 'HOLD / OVERVALUED' : stock.peRatio < 20 ? 'BUY / UNDERVALUED' : 'HOLD / NEUTRAL';
              response = `### Detailed Analysis for **${symbol}** (${stock.name}):\n` +
                `- **Sector:** ${stock.sector}\n` +
                `- **Live Price:** $${stock.price.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)\n` +
                `- **Beta (Risk Factor):** ${stock.beta || 1.0}\n` +
                `- **P/E Ratio:** ${stock.peRatio || '--'}\n` +
                `- **EPS:** $${stock.eps.toFixed(2)}\n` +
                `- **Div Yield:** ${stock.dividendYield > 0 ? `${stock.dividendYield}%` : 'N/A'}\n` +
                `- **Analyst Recommendation:** ${rating}`;
              set({ lastAnalyzedSymbol: symbol });
            }
          }
        }
        // 5. Analyze /risk command
        else if (cleanQuery.startsWith('/risk')) {
          const holdings = portfolioState.holdings;
          if (holdings.length === 0) {
            response = 'Your portfolio is empty. Log buy transactions using `/buy SYMBOL QUANTITY` or via the Portfolio Hub first.';
          } else {
            // Calculate weights and concentrations
            const stocksMap = marketState.stocks;
            let totalValue = 0;
            const values = holdings.map(h => {
              const st = stocksMap.find(s => s.symbol === h.symbol);
              const price = st ? st.price : h.avgBuyPrice;
              const val = h.quantity * price;
              totalValue += val;
              return { ...h, val, sector: st?.sector || 'Other' };
            });

            // Group by sector
            const sectorValue: { [sec: string]: number } = {};
            values.forEach(v => {
              sectorValue[v.sector] = (sectorValue[v.sector] || 0) + v.val;
            });

            const concentrations = Object.keys(sectorValue).map(sec => {
              const pct = (sectorValue[sec] / totalValue) * 100;
              return `- **${sec}:** ${pct.toFixed(1)}% of portfolio`;
            });

            // Calculate overall beta
            let weightedBetaSum = 0;
            values.forEach(v => {
              const st = stocksMap.find(s => s.symbol === v.symbol);
              const beta = st ? (st.beta !== undefined ? st.beta : 1.0) : 1.0;
              weightedBetaSum += beta * (v.val / totalValue);
            });

            const riskSummary = weightedBetaSum > 1.3 ? 'Aggressive / High Beta growth' : weightedBetaSum < 0.8 ? 'Conservative / Low Volatility defensive' : 'Balanced Market index tracker';

            response = `### Portfolio Risk Assessment:\n` +
              `${concentrations.join('\n')}\n\n` +
              `- **Portfolio Weighted Beta:** ${weightedBetaSum.toFixed(2)} (${riskSummary})\n` +
              `- **Concentration Warning:** ${weightedBetaSum > 1.4 ? '⚠️ Your portfolio volatility is significantly higher than the S&P 500 average. Consider hedging with lower beta defensive sectors like Consumer Staples.' : '✅ Your portfolio maintains a balanced volatility profile relative to index performance.'}`;
          }
        }
        // 6. Analyze /portfolio command
        else if (cleanQuery.startsWith('/portfolio')) {
          const holdings = portfolioState.holdings;
          if (holdings.length === 0) {
            response = 'You do not own any stocks yet. Try `/buy AAPL 10` to get started.';
          } else {
            let totalCost = 0;
            let currentVal = 0;
            const details = holdings.map(h => {
              const st = marketState.stocks.find(s => s.symbol === h.symbol);
              const price = st ? st.price : h.avgBuyPrice;
              totalCost += h.quantity * h.avgBuyPrice;
              currentVal += h.quantity * price;
              return `- **${h.symbol}**: ${h.quantity} shares @ avg $${h.avgBuyPrice.toFixed(2)} (Value: $${(h.quantity * price).toFixed(2)})`;
            });

            const pnl = currentVal - totalCost;
            const pct = totalCost === 0 ? 0 : (pnl / totalCost) * 100;

            response = `### Portfolio Valuation Summary:\n` +
              `- **Total Assets Market Value:** $${currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
              `- **Total Cost Basis:** $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n` +
              `- **Unrealized Gain/Loss:** **${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnl >= 0 ? '+' : ''}${pct.toFixed(2)}%)**\n` +
              `- **Realized Gains (History):** $${portfolioState.realizedPnL.toFixed(2)}\n\n` +
              `**Current holdings:**\n` +
              `${details.join('\n')}`;
          }
        }
        // 7. Context-Aware Follow Up queries
        else if (cleanQuery.includes('which') && (cleanQuery.includes('safer') || cleanQuery.includes('volatile') || cleanQuery.includes('risk') || cleanQuery.includes('beta')) && get().lastComparedSymbols.length > 0) {
          const lastCompared = get().lastComparedSymbols;
          const stocksMeta = lastCompared.map(sym => marketState.stocks.find(s => s.symbol === sym)).filter(Boolean) as any[];

          if (stocksMeta.length < 2) {
            response = 'I see you are asking about safety, but I need at least two stocks in our comparison history. Try `/compare AAPL KO` first.';
          } else {
            // Sort by beta (lowest beta is safest)
            const sortedByBeta = [...stocksMeta].sort((a, b) => (a.beta || 1.0) - (b.beta || 1.0));
            const safest = sortedByBeta[0];
            const riskiest = sortedByBeta[sortedByBeta.length - 1];

            response = `Evaluating safety from comparison history **[${lastCompared.join(', ')}]**:\n` +
              `- **Safest:** **${safest.symbol}** (${safest.name}) with a Beta of **${safest.beta || 1.0}**.\n` +
              `- **Highest Volatility:** **${riskiest.symbol}** (${riskiest.name}) with a Beta of **${riskiest.beta || 1.0}**.\n\n` +
              `*Lower Beta indicates lower price swings relative to the overall market, making ${safest.symbol} more defensive.*`;
          }
        }
        else if (cleanQuery.includes('which') && (cleanQuery.includes('cheaper') || cleanQuery.includes('value') || cleanQuery.includes('undervalued') || cleanQuery.includes('pe')) && get().lastComparedSymbols.length > 0) {
          const lastCompared = get().lastComparedSymbols;
          const stocksMeta = lastCompared.map(sym => marketState.stocks.find(s => s.symbol === sym)).filter(Boolean) as any[];

          if (stocksMeta.length < 2) {
            response = 'I need at least two compared symbols in history to evaluate P/E ratios. Use `/compare AAPL MSFT` first.';
          } else {
            // Sort by PE (lowest PE is cheaper value)
            const validPeStocks = stocksMeta.filter(s => s.peRatio > 0).sort((a, b) => a.peRatio - b.peRatio);
            if (validPeStocks.length === 0) {
              response = 'None of the compared stocks have a valid P/E ratio listed.';
            } else {
              const cheapest = validPeStocks[0];
              const priciest = validPeStocks[validPeStocks.length - 1];
              response = `Evaluating earnings valuations for **[${lastCompared.join(', ')}]**:\n` +
                `- **Cheapest Value (lowest P/E):** **${cheapest.symbol}** with P/E of **${cheapest.peRatio}**.\n` +
                `- **Highest Valuation (highest P/E):** **${priciest.symbol}** with P/E of **${priciest.peRatio}**.\n\n` +
                `*Low P/E implies cheaper pricing per dollar of earnings, though high growth tech stocks often command higher premiums.*`;
            }
          }
        }
        else if (cleanQuery.includes('buy') || cleanQuery.includes('sell') || cleanQuery.includes('trade')) {
          response = 'To place a trade, use the explicit format `/buy TICKER QTY` or `/sell TICKER QTY` (e.g. `/buy AAPL 15`).';
        }
        else {
          // General finance response
          response = `I understand you are asking about: "${userMessage}". As your AI Copilot, I can process actions directly. You can use standard commands:\n` +
            `- **Compare:** \`/compare AAPL MSFT\`\n` +
            `- **Analyze:** \`/analyze NVDA\`\n` +
            `- **Risk Profile:** \`/risk\`\n` +
            `- **Valuation:** \`/portfolio\`\n\n` +
            `Type what you need, and I will parse it dynamically against our core databases!`;
        }

        // Simulating net delay for reply
        return new Promise((resolve) => {
          setTimeout(() => {
            get().addMessage('assistant', response);
            resolve(response);
          }, 600);
        });
      }
    }),
    {
      name: 'stockpulse-assistant-storage',
      partialize: (state) => ({
        messages: state.messages,
        lastComparedSymbols: state.lastComparedSymbols,
        lastAnalyzedSymbol: state.lastAnalyzedSymbol,
        lastPortfolioSummary: state.lastPortfolioSummary
      })
    }
  )
);
