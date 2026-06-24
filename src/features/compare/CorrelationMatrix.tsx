import React, { useMemo } from 'react';
import type { CandlestickData } from '../../services/mockDataEngine';

interface Props {
  symbols: string[];
  historyData?: { [key: string]: CandlestickData[] };
}

function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 1.0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 1.0;
  return Number((num / Math.sqrt(denX * denY)).toFixed(2));
}

export const CorrelationMatrix: React.FC<Props> = ({ symbols, historyData }) => {
  const matrix = useMemo(() => {
    const data: { [key: string]: number[] } = {};
    symbols.forEach(sym => {
      const history = historyData?.[sym] || [];
      // Use closing prices
      data[sym] = history.map(d => d.close);
    });

    const mat: { [key: string]: { [key: string]: number } } = {};
    symbols.forEach(s1 => {
      mat[s1] = {};
      symbols.forEach(s2 => {
        if (s1 === s2) {
          mat[s1][s2] = 1.0;
        } else {
          const prices1 = data[s1] || [];
          const prices2 = data[s2] || [];
          mat[s1][s2] = calculatePearsonCorrelation(prices1, prices2);
        }
      });
    });

    return mat;
  }, [symbols, historyData]);

  // Color mapping based on coefficient
  const getCellColor = (r: number) => {
    if (r >= 0.9) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (r >= 0.7) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/15';
    if (r >= 0.4) return 'bg-yellow-500/10 text-yellow-300 border-yellow-500/15';
    if (r >= 0) return 'bg-white/[0.02] text-white/80 border-white/5';
    return 'bg-red-500/15 text-red-400 border-red-500/25';
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-border-glass bg-white/[0.01]">
      <div className="pb-2 border-b border-border-glass/40 mb-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Correlation Matrix (1-Month History)</h3>
        <p className="text-[9px] text-text-muted mt-0.5">Pearson correlation coefficients between compared assets.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-[9px] text-text-muted font-bold font-mono">TICKER</th>
              {symbols.map(sym => (
                <th key={sym} className="p-2 text-[10px] font-mono font-bold text-white uppercase">{sym}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass/30">
            {symbols.map(s1 => (
              <tr key={s1}>
                <td className="p-2 text-left text-[10px] font-mono font-bold text-white uppercase">{s1}</td>
                {symbols.map(s2 => {
                  const r = matrix[s1]?.[s2] ?? 1.0;
                  return (
                    <td key={s2} className="p-2">
                      <div className={`py-1.5 rounded-lg border font-mono font-bold text-[11px] ${getCellColor(r)}`}>
                        {r >= 0 ? '+' : ''}{r.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default CorrelationMatrix;
