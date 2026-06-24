import React, { useEffect, useState } from 'react';
import { Clock, Star, Play, AlertCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  type: 'info' | 'success' | 'alert' | 'danger';
}

interface MarketTimelineProps {
  liveEvents?: TimelineEvent[];
}

export const MarketTimeline: React.FC<MarketTimelineProps> = ({ liveEvents = [] }) => {
  const [events, setEvents] = useState<TimelineEvent[]>(() => {
    // Seed timeline events for session history
    return [
      {
        id: 'evt-1',
        time: '09:30',
        title: 'Market Session Open',
        description: 'NYSE/NASDAQ cash session initialized. Opening bell rings with high volume prints.',
        type: 'info'
      },
      {
        id: 'evt-2',
        time: '09:45',
        title: 'Institutional Accumulation Detected',
        description: 'Large block order flows sweep Technology and Consumer cyclicals.',
        type: 'success'
      },
      {
        id: 'evt-3',
        time: '10:12',
        title: 'Technology Becomes Strongest Sector',
        description: 'Tech relative strength outpaces all other sectors, driven by NVDA and MSFT momentum.',
        type: 'success'
      },
      {
        id: 'evt-4',
        time: '11:25',
        title: 'Fear & Greed Index Crosses 70',
        description: 'Sentiment indicator registers Greed (71), indicating bullish retail tailwinds.',
        type: 'alert'
      },
      {
        id: 'evt-5',
        time: '12:05',
        title: 'Market Regime Switches to Risk-On',
        description: 'Breadth expansion and cyclical leadership trigger Risk-On regime validation.',
        type: 'success'
      }
    ];
  });

  // Keep live-updates synced
  useEffect(() => {
    if (liveEvents.length === 0) return;
    
    setEvents(prev => {
      // Find events not already in state
      const uniqueNew = liveEvents.filter(le => !prev.some(p => p.id === le.id));
      if (uniqueNew.length === 0) return prev;
      
      // Append new events at the end or top
      // Typically, chronological events flow downward, so we append to the bottom or reverse them.
      // Let's keep them newest on top or newest at bottom. Let's do newest on top (reversed chron) so it is easy to read!
      return [...uniqueNew, ...prev];
    });
  }, [liveEvents]);

  // Icon selector
  const getEventIcon = (type: 'info' | 'success' | 'alert' | 'danger') => {
    switch (type) {
      case 'success':
        return <TrendingUp className="w-3.5 h-3.5 text-app-green" />;
      case 'danger':
        return <TrendingDown className="w-3.5 h-3.5 text-app-red" />;
      case 'alert':
        return <AlertCircle className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />;
      default:
        return <Info className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const getBorderColor = (type: 'info' | 'success' | 'alert' | 'danger') => {
    switch (type) {
      case 'success': return 'border-app-green/35';
      case 'danger': return 'border-app-red/35';
      case 'alert': return 'border-yellow-500/35';
      default: return 'border-blue-400/35';
    }
  };

  return (
    <div className="glass-card p-5 border border-border-glass bg-[#10141a]/40 h-[300px] flex flex-col justify-between card-hover-lift">
      <div>
        <div className="flex justify-between items-center pb-2 border-b border-border-glass/40 mb-4">
          <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-app-green" /> Market Session Timeline
          </h3>
          <span className="text-[9px] font-mono text-app-green font-bold animate-pulse">
            ● RECORDING LIVE
          </span>
        </div>

        {/* Scrollable vertical timeline */}
        <div className="relative pl-6 space-y-4 max-h-[210px] overflow-y-auto pr-2 scrollbar-thin">
          
          {/* Vertical axis line */}
          <div className="absolute left-[11px] top-1.5 bottom-1.5 w-0.5 bg-border-glass/40" />

          <AnimatePresence initial={false}>
            {events.map((evt, idx) => (
              <motion.div
                key={evt.id}
                initial={idx === 0 && evt.id.startsWith('live') ? { opacity: 0, y: -10 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="relative flex gap-3 text-xs"
              >
                {/* Timeline node dot */}
                <div className={`absolute -left-[20px] top-0.5 w-3.5 h-3.5 rounded-full bg-[#0A0E14] border-2 flex items-center justify-center z-10 ${getBorderColor(evt.type)}`}>
                  <div className="w-1 h-1 rounded-full bg-white" />
                </div>

                {/* Event Time */}
                <span className="font-mono font-extrabold text-text-muted text-[10px] w-8 mt-0.5 flex-shrink-0">
                  {evt.time}
                </span>

                {/* Event Details */}
                <div className="flex-1 bg-white/2 border border-white/5 rounded-xl p-2.5 flex items-start gap-2.5">
                  <div className="mt-0.5 flex-shrink-0">
                    {getEventIcon(evt.type)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white leading-normal">
                      {evt.title}
                    </h4>
                    <p className="text-[10px] text-text-muted mt-0.5 leading-normal font-sans">
                      {evt.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
};
export default MarketTimeline;
