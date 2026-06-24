import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalysisBlock } from '../../store/useCopilotStore';
import { InsightCard } from './InsightCard';
import { ConfidenceBadge } from './ConfidenceBadge';

interface Props {
  block: AnalysisBlock;
  defaultExpanded?: boolean;
  index?: number;
}

// Minimal markdown: bold, code, line breaks, markdown tables
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Table detection (contains |)
    if (line.includes('|') && lines[i + 1]?.match(/^\|[\s-|]+\|$/)) {
      const headers = line.split('|').map((c) => c.trim()).filter(Boolean);
      i += 2; // skip separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        rows.push(lines[i].split('|').map((c) => c.trim()).filter(Boolean));
        i++;
      }
      nodes.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-lg border border-border-glass">
          <table className="w-full text-xs">
            <thead className="bg-white/4">
              <tr>{headers.map((h, j) => <th key={j} className="px-3 py-2 text-left font-bold text-text-muted">{renderInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri} className="border-t border-border-glass/40 hover:bg-white/[0.02] transition-colors">
                  {row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-text-secondary">{renderInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    // Empty line → spacer
    if (line.trim() === '') {
      nodes.push(<div key={`sp-${i}`} className="h-2" />);
    } else {
      nodes.push(
        <p key={`p-${i}`} className="text-xs text-text-secondary leading-relaxed">
          {renderInline(line)}
        </p>
      );
    }
    i++;
  }
  return nodes;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="text-app-green font-mono text-[10px] bg-app-green/8 px-1 rounded">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export const AnalysisSection: React.FC<Props> = ({ block, defaultExpanded = true, index = 0 }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="border border-border-glass rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white">{block.title}</span>
          {block.confidence && <ConfidenceBadge level={block.confidence} />}
        </div>
        <div className={`text-text-muted transition-transform duration-200 ${expanded ? '' : 'group-hover:text-white'}`}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3 border-t border-border-glass/50">
              <div className="space-y-1">
                {renderMarkdown(block.content)}
              </div>
              {block.insights && block.insights.length > 0 && (
                <div className="grid grid-cols-1 gap-2 mt-3">
                  {block.insights.map((ins, i) => (
                    <InsightCard key={i} insight={ins} index={i} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
