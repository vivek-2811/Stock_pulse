import React, { useEffect, useState, useRef } from 'react';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SectorRankInfo {
  label: string;
  dailyPerf: number;
}

interface LeadershipChangeProps {
  rankedSectors: SectorRankInfo[];
}

interface ChangeEvent {
  id: string;
  sectorLabel: string;
  fromRank: number;
  toRank: number;
  timestamp: string;
  direction: 'up' | 'down';
}

export const LeadershipChanges: React.FC<LeadershipChangeProps> = ({ rankedSectors }) => {
  const [events, setEvents] = useState<ChangeEvent[]>([]);
  const prevRanksRef = useRef<string[]>([]);

  useEffect(() => {
    if (rankedSectors.length === 0) return;

    const currentRanks = rankedSectors.map(s => s.label);
    const prevRanks = prevRanksRef.current;

    if (prevRanks.length > 0) {
      const newEvents: ChangeEvent[] = [];

      currentRanks.forEach((label, currentIdx) => {
        const prevIdx = prevRanks.indexOf(label);
        
        // Check if rank has changed
        if (prevIdx !== -1 && prevIdx !== currentIdx) {
          const fromRank = prevIdx + 1;
          const toRank = currentIdx + 1;
          const direction = toRank < fromRank ? 'up' : 'down';
          
          newEvents.push({
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            sectorLabel: label,
            fromRank,
            toRank,
            direction,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
          });
        }
      });

      if (newEvents.length > 0) {
        setEvents(prev => {
          // Prepend new events and limit to last 4
          const combined = [...newEvents, ...prev];
          return combined.slice(0, 4);
        });
      }
    }

    prevRanksRef.current = currentRanks;
  }, [rankedSectors]);

  return (
    <div className="bg-[#10141a]/60 border border-border-glass rounded-2xl p-4.5 h-[190px] flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center pb-2 border-b border-border-glass/40 mb-3">
          <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-app-green animate-spin-slow" /> Sector Leadership Shifts
          </h4>
          <span className="text-[9px] font-mono font-bold text-text-muted">
            LIVE MONITORING
          </span>
        </div>

        {/* Rolling transition events list */}
        <div className="space-y-2 max-h-[110px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {events.map((evt) => (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -10, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="flex items-center justify-between text-[11px] py-1.5 px-2 bg-white/2 border border-white/5 rounded-lg font-sans"
              >
                <div className="flex items-center gap-2">
                  {evt.direction === 'up' ? (
                    <div className="w-4 h-4 rounded bg-app-green/10 flex items-center justify-center border border-app-green/20">
                      <ArrowUp className="w-3 h-3 text-app-green" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded bg-app-red/10 flex items-center justify-center border border-app-red/20">
                      <ArrowDown className="w-3 h-3 text-app-red" />
                    </div>
                  )}
                  <span className="font-bold text-white">
                    {evt.sectorLabel}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-text-muted text-[10px] font-medium font-mono">
                    #{evt.fromRank} → <span className={evt.direction === 'up' ? 'text-app-green font-bold' : 'text-app-red font-bold'}>#{evt.toRank}</span>
                  </span>
                  <span className="text-[9px] text-text-muted font-mono">{evt.timestamp}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {events.length === 0 && (
            <div className="py-7 text-center text-[10px] text-text-muted italic">
              Waiting for leadership shifts...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default LeadershipChanges;
