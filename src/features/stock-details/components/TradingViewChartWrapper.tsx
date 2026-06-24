import React, { useEffect, useRef, useState } from 'react';
import { 
  createChart, 
  ColorType, 
  CandlestickSeries, 
  AreaSeries, 
  LineSeries, 
  HistogramSeries,
  createSeriesMarkers
} from 'lightweight-charts';
import { 
  calculateSMA, 
  calculateEMA, 
  calculateBollingerBands, 
  calculateRSI, 
  calculateMACD 
} from '../../../utils/indicators';
import type { CandlestickData } from '../../../services/mockDataEngine';
import { useMarketStore } from '../../../store/useMarketStore';
import { 
  MousePointer, 
  TrendingUp, 
  Minus, 
  Eraser, 
  Trash2 
} from 'lucide-react';

export interface ChartNote {
  id: string;
  time: number;
  price: number;
  text: string;
}

interface ChartProps {
  data: CandlestickData[];
  type: 'line' | 'candlestick' | 'area';
  showVolume: boolean;
  timeframe: string;
  indicators: {
    sma: boolean;
    ema: boolean;
    bbands: boolean;
    rsi: boolean;
    macd: boolean;
  };
  compareSymbol?: string | null;
  compareData?: CandlestickData[];
  benchmarkSymbol?: string | null;
  benchmarkData?: CandlestickData[];
  relativeMode?: boolean;
  activeLayoutId?: string;
  notes?: ChartNote[];
  onNotesChanged?: (notes: ChartNote[]) => void;
  onDrawingsChanged?: (trends: Trendline[], horizs: HorizontalLevel[]) => void;
}

interface Trendline {
  id: string;
  start: { time: number; price: number };
  end: { time: number; price: number };
}

interface HorizontalLevel {
  id: string;
  price: number;
  label: string;
}

interface CorporateEvent {
  timeIndexOffset: number;
  type: 'E' | 'D' | 'P' | 'M' | 'R';
  color: string;
  title: string;
  details: string;
}

const CORPORATE_EVENTS: Record<string, CorporateEvent[]> = {
  AAPL: [
    { timeIndexOffset: 0.15, type: 'E', color: '#3B82F6', title: 'Q1 Earnings Release', details: 'Beat EPS by $0.15, revenue +6% YoY' },
    { timeIndexOffset: 0.30, type: 'M', color: '#F97316', title: 'FOMC Rate Decision', details: 'Fed holds interest rates steady at 5.25%. Direct impact on liquidity.' },
    { timeIndexOffset: 0.45, type: 'D', color: '#10B981', title: 'Dividend Distribution', details: '$0.25 per share payout' },
    { timeIndexOffset: 0.60, type: 'R', color: '#A855F7', title: 'ETF Index Rebalance', details: 'Quarterly rebalancing triggers high reweighting volume.' },
    { timeIndexOffset: 0.75, type: 'P', color: '#EC4899', title: 'WWDC Keynote Launch', details: 'Unveiled Apple Intelligence AI features' },
    { timeIndexOffset: 0.90, type: 'E', color: '#3B82F6', title: 'Q2 Earnings Release', details: 'Met analyst estimates, solid cash flow' },
  ],
  MSFT: [
    { timeIndexOffset: 0.15, type: 'E', color: '#3B82F6', title: 'Q1 Earnings Release', details: 'Cloud revenue beat expectations +23%' },
    { timeIndexOffset: 0.30, type: 'M', color: '#F97316', title: 'FOMC Rate Decision', details: 'Fed holds interest rates steady at 5.25%. Direct impact on liquidity.' },
    { timeIndexOffset: 0.50, type: 'D', color: '#10B981', title: 'Dividend Distribution', details: '$0.75 per share payout' },
    { timeIndexOffset: 0.65, type: 'R', color: '#A855F7', title: 'ETF Index Rebalance', details: 'Quarterly rebalancing triggers high reweighting volume.' },
    { timeIndexOffset: 0.78, type: 'P', color: '#EC4899', title: 'Microsoft Build Keynote', details: 'Announced Copilot+ PCs with AI chips' },
    { timeIndexOffset: 0.92, type: 'E', color: '#3B82F6', title: 'Q2 Earnings Release', details: 'Beat EPS by $0.08, AI demand strong' },
  ],
  NVDA: [
    { timeIndexOffset: 0.15, type: 'E', color: '#3B82F6', title: 'Q1 Earnings Release', details: 'Revenue tripled YoY, huge AI GPU demand' },
    { timeIndexOffset: 0.30, type: 'M', color: '#F97316', title: 'FOMC Rate Decision', details: 'Fed holds interest rates steady at 5.25%. Direct impact on liquidity.' },
    { timeIndexOffset: 0.52, type: 'D', color: '#10B981', title: 'Dividend Distribution', details: '$0.04 per share payout' },
    { timeIndexOffset: 0.68, type: 'R', color: '#A855F7', title: 'ETF Index Rebalance', details: 'Quarterly rebalancing triggers high reweighting volume.' },
    { timeIndexOffset: 0.80, type: 'P', color: '#EC4899', title: 'GTC Keynote Release', details: 'Blackwell architecture B200 GPU launched' },
    { timeIndexOffset: 0.94, type: 'E', color: '#3B82F6', title: 'Q2 Earnings Release', details: 'Beat revenue estimates by $2.5B' },
  ]
};

const getEventsForSymbol = (sym: string, dataLength: number, data: CandlestickData[]) => {
  if (dataLength < 20) return [];
  const events = CORPORATE_EVENTS[sym] || [
    { timeIndexOffset: 0.15, type: 'E' as const, color: '#3B82F6', title: 'Earnings Report', details: `Quarterly earnings release for ${sym}` },
    { timeIndexOffset: 0.35, type: 'M' as const, color: '#F97316', title: 'FOMC Rate Decision', details: 'Federal Reserve rate announcement.' },
    { timeIndexOffset: 0.55, type: 'D' as const, color: '#10B981', title: 'Dividend Payout', details: `Regular cash dividend distributed by ${sym}` },
    { timeIndexOffset: 0.70, type: 'R' as const, color: '#A855F7', title: 'ETF Rebalance', details: `Index weight adjustment for ${sym}` },
    { timeIndexOffset: 0.88, type: 'P' as const, color: '#EC4899', title: 'Product Launch', details: `New product expansion announced by ${sym}` }
  ];

  return events.map(ev => {
    const dataIdx = Math.floor(dataLength * ev.timeIndexOffset);
    const item = data[dataIdx];
    return {
      ...ev,
      time: item ? item.time : 0
    };
  }).filter(ev => ev.time > 0);
};

// Global visual style configurations
const textColor = '#8A8F98';
const gridColor = 'rgba(255, 255, 255, 0.04)';

export const TradingViewChartWrapper: React.FC<ChartProps> = ({ 
  data, 
  type, 
  showVolume, 
  timeframe,
  indicators,
  compareSymbol,
  compareData,
  benchmarkSymbol,
  benchmarkData,
  relativeMode = false,
  activeLayoutId = 'default',
  notes = [],
  onNotesChanged,
  onDrawingsChanged
}) => {
  // Container refs
  const chartOuterRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const macdContainerRef = useRef<HTMLDivElement>(null);

  // Active symbol (taken from parent route symbol)
  const symbol = useMarketStore(state => state.stocks[0]?.symbol || 'AAPL');

  // Component states
  const [tool, setTool] = useState<'cursor' | 'trendline' | 'horizontal' | 'eraser'>('cursor');
  const [trendlines, setTrendlines] = useState<Trendline[]>([]);
  const [horizontals, setHorizontals] = useState<HorizontalLevel[]>([]);
  const [isFading, setIsFading] = useState(false);
  const [renderTrigger, setRenderTrigger] = useState(0);

  // Live price pulse indicators
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [livePriceColor, setLivePriceColor] = useState<string>('#00FF94');
  const [livePricePulse, setLivePricePulse] = useState(false);

  // Tooltip details
  const [hoverData, setHoverData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
    x: number;
    y: number;
    event?: {
      type: string;
      title: string;
      details: string;
    };
  } | null>(null);

  // Drawing mouse track state
  const [drawingStart, setDrawingStart] = useState<{ time: number; price: number } | null>(null);
  const [currentLineEnd, setCurrentLineEnd] = useState<{ time: number; price: number } | null>(null);

  // Chart instance refs (Persistent)
  const chartRef = useRef<any>(null);
  const mainSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const compareSeriesRef = useRef<any>(null);
  const benchmarkSeriesRef = useRef<any>(null);
  const indicatorSeriesRefs = useRef<Record<string, any>>({});
  const activePriceLinesRef = useRef<any[]>([]);

  // Sub-charts refs
  const rsiChartRef = useRef<any>(null);
  const rsiSeriesRef = useRef<any>(null);
  const macdChartRef = useRef<any>(null);
  const macdSeriesRefs = useRef<Record<string, any>>({});

  // Helper flags
  const firstLoadSymbolRef = useRef<string | null>(null);

  // Save/Load drawings helper
  const saveDrawings = (sym: string, trends: Trendline[], horizs: HorizontalLevel[]) => {
    localStorage.setItem(`stockpulse_drawings_${sym}`, JSON.stringify({ trendlines: trends, horizontals: horizs }));
  };

  // Load drawings when symbol or layout changes
  useEffect(() => {
    if (!symbol) return;
    const saved = localStorage.getItem(`stockpulse_drawings_${symbol}`);
    if (saved) {
      const { trendlines: savedTrends, horizontals: savedHoriz } = JSON.parse(saved);
      setTrendlines(savedTrends || []);
      setHorizontals(savedHoriz || []);
    } else {
      setTrendlines([]);
      setHorizontals([]);
    }
  }, [symbol, activeLayoutId]);

  // =========================================================
  // 1. Initialize Main and Sub-Charts (Once on Mount)
  // =========================================================
  useEffect(() => {
    if (!mainContainerRef.current) return;

    const width = mainContainerRef.current.clientWidth || 600;

    // Instantiate Main Chart
    const mainChart = createChart(mainContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(255, 255, 255, 0.15)', width: 1, style: 3 },
        horzLine: { color: 'rgba(255, 255, 255, 0.15)', width: 1, style: 3 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      rightPriceScale: { 
        borderVisible: false,
        alignLabels: true
      },
      leftPriceScale: {
        borderVisible: false,
        visible: false
      },
      width,
      height: 280,
    });

    chartRef.current = mainChart;

    // Force SVG overlay updates on scale scroll or pan
    mainChart.timeScale().subscribeVisibleTimeRangeChange(() => {
      setRenderTrigger(prev => prev + 1);
      // Sync sub-charts
      const mainVisibleRange = mainChart.timeScale().getVisibleRange();
      if (mainVisibleRange) {
        try {
          if (rsiChartRef.current) rsiChartRef.current.timeScale().setVisibleRange(mainVisibleRange);
        } catch (e) {
          console.warn('RSI setVisibleRange failed:', e);
        }
        try {
          if (macdChartRef.current) macdChartRef.current.timeScale().setVisibleRange(mainVisibleRange);
        } catch (e) {
          console.warn('MACD setVisibleRange failed:', e);
        }
      }
    });

    // Custom hovering tooltips handler
    mainChart.subscribeCrosshairMove((param) => {
      if (
        !param.point ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > 280
      ) {
        setHoverData(null);
        return;
      }

      if (mainSeriesRef.current) {
        const dataPoint = param.seriesData.get(mainSeriesRef.current) as any;
        if (dataPoint) {
          let timeStr = '';
          if (typeof param.time === 'number') {
            timeStr = new Date(param.time * 1000).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
          } else {
            timeStr = String(param.time);
          }

          // Check if hovering over corporate event
          const activeEvents = getEventsForSymbol(symbol, data.length, data);
          const hoveredEvent = activeEvents.find(ev => ev.time === param.time);

          // Get values
          const openVal = dataPoint.open ?? dataPoint.value ?? 0;
          const highVal = dataPoint.high ?? dataPoint.value ?? 0;
          const lowVal = dataPoint.low ?? dataPoint.value ?? 0;
          const closeVal = dataPoint.close ?? dataPoint.value ?? 0;

          setHoverData({
            time: timeStr,
            open: openVal,
            high: highVal,
            low: lowVal,
            close: closeVal,
            volume: dataPoint.volume,
            x: param.point.x,
            y: param.point.y,
            event: hoveredEvent ? {
              type: hoveredEvent.type,
              title: hoveredEvent.title,
              details: hoveredEvent.details
            } : undefined
          });
        } else {
          setHoverData(null);
        }
      }
    });

    const handleResize = () => {
      const w = mainContainerRef.current?.clientWidth || 600;
      if (chartRef.current) chartRef.current.applyOptions({ width: w });
      if (rsiChartRef.current && rsiContainerRef.current) rsiChartRef.current.applyOptions({ width: w });
      if (macdChartRef.current && macdContainerRef.current) macdChartRef.current.applyOptions({ width: w });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (rsiChartRef.current) {
        rsiChartRef.current.remove();
        rsiChartRef.current = null;
      }
      if (macdChartRef.current) {
        macdChartRef.current.remove();
        macdChartRef.current = null;
      }

      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      compareSeriesRef.current = null;
      benchmarkSeriesRef.current = null;
      indicatorSeriesRefs.current = {};
      activePriceLinesRef.current = [];
      rsiSeriesRef.current = null;
      macdSeriesRefs.current = {};
    };
  }, [symbol, data]);

  // =========================================================
  // 2. Data Update & Series Configuration Lifecycle
  // =========================================================
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !mainContainerRef.current || data.length === 0) return;

    // Filter and clean incoming data to prevent lightweight-charts null crashes
    const cleanedData = (data || []).filter(d => 
      d && 
      d.time !== null && d.time !== undefined && 
      d.open !== null && d.open !== undefined &&
      d.high !== null && d.high !== undefined &&
      d.low !== null && d.low !== undefined &&
      d.close !== null && d.close !== undefined
    );
    if (cleanedData.length === 0) return;

    const cleanedCompareData = (compareData || []).filter(d => 
      d && d.time !== null && d.time !== undefined && d.close !== null && d.close !== undefined
    );

    const cleanedBenchmarkData = (benchmarkData || []).filter(d => 
      d && d.time !== null && d.time !== undefined && d.close !== null && d.close !== undefined
    );

    setIsFading(true);
    const fadeTimer = setTimeout(() => setIsFading(false), 150);

    // Baseline for relative mode normalization
    const firstClose = cleanedData[0]?.open || cleanedData[0]?.close || 1;

    // Price scale formats
    const relativePriceFormat = {
      type: 'custom',
      formatter: (price: number) => `${price >= 0 ? '+' : ''}${price.toFixed(2)}%`
    };

    const priceFormatOptions = relativeMode ? relativePriceFormat : {
      type: 'price',
      precision: 2,
      minMove: 0.01
    };

    // Configure scales
    const hasOverlay = (compareSymbol || benchmarkSymbol) && !relativeMode;
    chart.priceScale('left').applyOptions({
      visible: hasOverlay,
      borderVisible: false,
    });

    // 2.1 Recreate Main Price Series if Type Changed
    if (mainSeriesRef.current) {
      chart.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }

    if (type === 'candlestick') {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: '#00FF94',
        downColor: '#FF3B5C',
        borderVisible: false,
        wickUpColor: '#00FF94',
        wickDownColor: '#FF3B5C',
        priceFormat: priceFormatOptions as any
      });
      if (relativeMode) {
        mainSeriesRef.current.setData(cleanedData.map(d => ({
          time: d.time as any,
          open: ((d.open - firstClose) / firstClose) * 100,
          high: ((d.high - firstClose) / firstClose) * 100,
          low: ((d.low - firstClose) / firstClose) * 100,
          close: ((d.close - firstClose) / firstClose) * 100
        })));
      } else {
        mainSeriesRef.current.setData(cleanedData.map(d => ({ ...d, time: d.time as any })));
      }
    } else if (type === 'area') {
      mainSeriesRef.current = chart.addSeries(AreaSeries, {
        topColor: 'rgba(0, 255, 148, 0.22)',
        bottomColor: 'rgba(0, 255, 148, 0)',
        lineColor: '#00FF94',
        lineWidth: 2,
        priceFormat: priceFormatOptions as any
      });
      if (relativeMode) {
        mainSeriesRef.current.setData(cleanedData.map(d => ({
          time: d.time as any,
          value: ((d.close - firstClose) / firstClose) * 100
        })));
      } else {
        mainSeriesRef.current.setData(cleanedData.map(d => ({ time: d.time as any, value: d.close })));
      }
    } else {
      mainSeriesRef.current = chart.addSeries(LineSeries, {
        color: '#00FF94',
        lineWidth: 2,
        priceFormat: priceFormatOptions as any
      });
      if (relativeMode) {
        mainSeriesRef.current.setData(cleanedData.map(d => ({
          time: d.time as any,
          value: ((d.close - firstClose) / firstClose) * 100
        })));
      } else {
        mainSeriesRef.current.setData(cleanedData.map(d => ({ time: d.time as any, value: d.close })));
      }
    }

    // 2.2 Volume Series Handling
    if (volumeSeriesRef.current) {
      chart.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }

    if (showVolume) {
      volumeSeriesRef.current = chart.addSeries(HistogramSeries, {
        color: 'rgba(255, 255, 255, 0.08)',
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      chart.priceScale('volume').applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
      });
      volumeSeriesRef.current.setData(cleanedData.map(d => ({
        time: d.time as any,
        value: d.volume || 1000,
        color: d.close >= d.open ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 59, 92, 0.15)'
      })));
    }

    // 2.2b Compare Overlay Series
    if (compareSeriesRef.current) {
      chart.removeSeries(compareSeriesRef.current);
      compareSeriesRef.current = null;
    }

    if (compareSymbol && cleanedCompareData && cleanedCompareData.length > 0) {
      if (relativeMode) {
        const firstCompClose = cleanedCompareData[0]?.open || cleanedCompareData[0]?.close || 1;
        const normalizedCompare = cleanedCompareData.map(d => ({
          time: d.time as any,
          value: ((d.close - firstCompClose) / firstCompClose) * 100
        }));
        compareSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#FF3B5C',
          lineWidth: 2,
          priceFormat: relativePriceFormat as any,
          title: compareSymbol
        });
        compareSeriesRef.current.setData(normalizedCompare);
      } else {
        compareSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#FF3B5C',
          lineWidth: 2,
          priceScaleId: 'left',
          title: compareSymbol
        });
        compareSeriesRef.current.setData(cleanedCompareData.map(d => ({ time: d.time as any, value: d.close })));
      }
    }

    // 2.2c Benchmark Index Overlay Series
    if (benchmarkSeriesRef.current) {
      chart.removeSeries(benchmarkSeriesRef.current);
      benchmarkSeriesRef.current = null;
    }

    if (benchmarkSymbol && cleanedBenchmarkData && cleanedBenchmarkData.length > 0) {
      if (relativeMode) {
        const firstBenchClose = cleanedBenchmarkData[0]?.open || cleanedBenchmarkData[0]?.close || 1;
        const normalizedBenchmark = cleanedBenchmarkData.map(d => ({
          time: d.time as any,
          value: ((d.close - firstBenchClose) / firstBenchClose) * 100
        }));
        benchmarkSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#A855F7',
          lineWidth: 2,
          priceFormat: relativePriceFormat as any,
          title: benchmarkSymbol
        });
        benchmarkSeriesRef.current.setData(normalizedBenchmark);
      } else {
        benchmarkSeriesRef.current = chart.addSeries(LineSeries, {
          color: '#A855F7',
          lineWidth: 2,
          priceScaleId: 'left',
          title: benchmarkSymbol
        });
        benchmarkSeriesRef.current.setData(cleanedBenchmarkData.map(d => ({ time: d.time as any, value: d.close })));
      }
    }

    // 2.3 Deteminisitic Corporate Event Markers
    const activeEvents = getEventsForSymbol(symbol, cleanedData.length, cleanedData);
    const markers = activeEvents.map(ev => ({
      time: ev.time as any,
      position: ev.type === 'D' ? ('aboveBar' as const) : ('belowBar' as const),
      color: ev.color,
      shape: 'circle' as const,
      text: ev.type,
      size: 1.2
    }));
    createSeriesMarkers(mainSeriesRef.current, markers);

    // 2.4 Indicators rendering
    const closePrices = cleanedData.map(d => d.close);

    const syncLineSeries = (key: string, enabled: boolean, options: any, seriesData: any[]) => {
      if (indicatorSeriesRefs.current[key]) {
        chart.removeSeries(indicatorSeriesRefs.current[key]);
        delete indicatorSeriesRefs.current[key];
      }
      if (enabled && !relativeMode) { // disable overlays in relative mode
        indicatorSeriesRefs.current[key] = chart.addSeries(LineSeries, options);
        indicatorSeriesRefs.current[key].setData(seriesData);
      }
    };

    // SMA
    const smaVals = calculateSMA(closePrices, 20);
    const smaData = cleanedData.map((d, idx) => ({ time: d.time as any, value: smaVals[idx] })).filter((d: any) => d.value !== null && d.value !== undefined);
    syncLineSeries('sma', indicators.sma, { color: '#F59E0B', lineWidth: 1, title: 'SMA (20)' }, smaData);

    // EMA
    const emaVals = calculateEMA(closePrices, 12);
    const emaData = cleanedData.map((d, idx) => ({ time: d.time as any, value: emaVals[idx] })).filter((d: any) => d.value !== null && d.value !== undefined);
    syncLineSeries('ema', indicators.ema, { color: '#3B82F6', lineWidth: 1, title: 'EMA (12)' }, emaData);

    // Bollinger Bands
    const bb = calculateBollingerBands(closePrices, 20);
    const bbUpper = cleanedData.map((d, idx) => ({ time: d.time as any, value: bb.upper[idx] })).filter((d: any) => d.value !== null && d.value !== undefined);
    const bbMid = cleanedData.map((d, idx) => ({ time: d.time as any, value: bb.middle[idx] })).filter((d: any) => d.value !== null && d.value !== undefined);
    const bbLower = cleanedData.map((d, idx) => ({ time: d.time as any, value: bb.lower[idx] })).filter((d: any) => d.value !== null && d.value !== undefined);
    syncLineSeries('bb_upper', indicators.bbands, { color: 'rgba(99, 102, 241, 0.4)', lineWidth: 1, title: 'BB Upper' }, bbUpper);
    syncLineSeries('bb_mid', indicators.bbands, { color: 'rgba(99, 102, 241, 0.2)', lineWidth: 1, title: 'BB Mid' }, bbMid);
    syncLineSeries('bb_lower', indicators.bbands, { color: 'rgba(99, 102, 241, 0.4)', lineWidth: 1, title: 'BB Lower' }, bbLower);

    // 2.5 Sub-charts Panels rendering (RSI & MACD)
    // RSI Sub-chart
    if (rsiChartRef.current) {
      rsiChartRef.current.remove();
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
    }
    if (indicators.rsi && rsiContainerRef.current && !relativeMode) {
      const w = mainContainerRef.current.clientWidth || 600;
      const rsiChart = createChart(rsiContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor, fontFamily: 'Inter, sans-serif' },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        rightPriceScale: { borderVisible: false },
        timeScale: { visible: false },
        width: w,
        height: 90,
      });
      rsiChartRef.current = rsiChart;

      const rsiVals = calculateRSI(closePrices, 14);
      const rsiSeries = rsiChart.addSeries(LineSeries, { color: '#C084FC', lineWidth: 1, title: 'RSI (14)' });
      rsiSeriesRef.current = rsiSeries;
      rsiSeries.setData(cleanedData.map((d, idx) => ({ time: d.time as any, value: rsiVals[idx] })).filter((d: any) => d.value !== null && d.value !== undefined));

      const limit1 = rsiChart.addSeries(LineSeries, { color: 'rgba(255, 255, 255, 0.08)', lineWidth: 1 });
      limit1.setData(cleanedData.map(d => ({ time: d.time as any, value: 70 })));
      const limit2 = rsiChart.addSeries(LineSeries, { color: 'rgba(255, 255, 255, 0.08)', lineWidth: 1 });
      limit2.setData(cleanedData.map(d => ({ time: d.time as any, value: 30 })));

      try {
        const mainVisible = chart.timeScale().getVisibleRange();
        if (mainVisible) rsiChart.timeScale().setVisibleRange(mainVisible);
      } catch (e) {
        console.warn('RSI init setVisibleRange failed:', e);
      }
    }

    // MACD Sub-chart
    if (macdChartRef.current) {
      macdChartRef.current.remove();
      macdChartRef.current = null;
      macdSeriesRefs.current = {};
    }
    if (indicators.macd && macdContainerRef.current && !relativeMode) {
      const w = mainContainerRef.current.clientWidth || 600;
      const macdChart = createChart(macdContainerRef.current, {
        layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor, fontFamily: 'Inter, sans-serif' },
        grid: { vertLines: { color: gridColor }, horzLines: { color: gridColor } },
        rightPriceScale: { borderVisible: false },
        timeScale: { visible: false },
        width: w,
        height: 110,
      });
      macdChartRef.current = macdChart;

      const macdVals = calculateMACD(closePrices);
      const macdSeries = macdChart.addSeries(LineSeries, { color: '#2563EB', lineWidth: 1, title: 'MACD' });
      const signalSeries = macdChart.addSeries(LineSeries, { color: '#E11D48', lineWidth: 1, title: 'Signal' });
      const histSeries = macdChart.addSeries(HistogramSeries, { priceScaleId: 'histScale' });
      macdChart.priceScale('histScale').applyOptions({ scaleMargins: { top: 0.1, bottom: 0.1 } });

      macdSeries.setData(cleanedData.map((d, idx) => ({ time: d.time as any, value: macdVals.macd[idx] })).filter((d: any) => d.value !== null && d.value !== undefined));
      signalSeries.setData(cleanedData.map((d, idx) => ({ time: d.time as any, value: macdVals.signal[idx] })).filter((d: any) => d.value !== null && d.value !== undefined));
      histSeries.setData(
        cleanedData.map((d, idx) => {
          const val = macdVals.histogram[idx];
          return {
            time: d.time as any,
            value: val || 0,
            color: (val || 0) >= 0 ? 'rgba(0, 255, 148, 0.35)' : 'rgba(255, 59, 92, 0.35)'
          };
        }).filter((d: any) => d.value !== null && d.value !== undefined)
      );

      macdSeriesRefs.current = { macdSeries, signalSeries, histSeries };
      try {
        const mainVisible = chart.timeScale().getVisibleRange();
        if (mainVisible) macdChart.timeScale().setVisibleRange(mainVisible);
      } catch (e) {
        console.warn('MACD init setVisibleRange failed:', e);
      }
    }

    if (firstLoadSymbolRef.current !== symbol) {
      firstLoadSymbolRef.current = symbol;
      chart.timeScale().fitContent();
    }

    setRenderTrigger(prev => prev + 1);

    return () => clearTimeout(fadeTimer);
  }, [data, type, showVolume, indicators, symbol, compareSymbol, compareData, benchmarkSymbol, benchmarkData, relativeMode]);

  // =========================================================
  // 3. Render Custom Horizontal Price Lines (Native)
  // =========================================================
  useEffect(() => {
    const mainSeries = mainSeriesRef.current;
    if (!mainSeries || relativeMode) return;

    activePriceLinesRef.current.forEach(line => {
      try {
        mainSeries.removePriceLine(line);
      } catch (e) {
        console.warn(e);
      }
    });
    activePriceLinesRef.current = [];

    horizontals.forEach(h => {
      try {
        const line = mainSeries.createPriceLine({
          price: h.price,
          color: '#00FF94',
          lineWidth: 1,
          lineStyle: 2,
          axisLabelVisible: true,
          title: `Support $${h.price.toFixed(2)}`
        });
        if (line) {
          activePriceLinesRef.current.push(line);
        }
      } catch (e) {
        console.warn(e);
      }
    });
  }, [horizontals, type, relativeMode]);

  // =========================================================
  // 4. Live Updates Feed Tick Subscription
  // =========================================================
  useEffect(() => {
    const cleaned = (data || []).filter(d => 
      d && 
      d.time !== null && d.time !== undefined && 
      d.close !== null && d.close !== undefined &&
      d.open !== null && d.open !== undefined
    );
    if (!chartRef.current || !mainSeriesRef.current || cleaned.length === 0 || relativeMode) return;

    const unsubscribe = useMarketStore.subscribe((state) => {
      const activeStock = state.stocks.find(s => s.symbol === symbol);
      if (!activeStock) return;

      const currentPrice = activeStock.price;
      const lastItem = cleaned[cleaned.length - 1];
      if (!lastItem) return;

      const updatedCandle = {
        time: lastItem.time as any,
        open: lastItem.open,
        high: Math.max(lastItem.high, currentPrice),
        low: Math.min(lastItem.low, currentPrice),
        close: currentPrice,
        volume: lastItem.volume
      };

      setLivePrice(prev => {
        if (prev !== currentPrice) {
          setLivePriceColor(currentPrice >= (prev || currentPrice) ? '#00FF94' : '#FF3B5C');
          setLivePricePulse(true);
          const t = setTimeout(() => setLivePricePulse(false), 500);
          return currentPrice;
        }
        return prev;
      });

      try {
        if (type === 'candlestick') {
          mainSeriesRef.current?.update(updatedCandle);
        } else {
          mainSeriesRef.current?.update({ time: lastItem.time as any, value: currentPrice });
        }
      } catch (e) {
        console.warn('mainSeries live update failed:', e);
      }

      try {
        if (showVolume && volumeSeriesRef.current) {
          volumeSeriesRef.current.update({
            time: lastItem.time as any,
            value: activeStock.volume ? activeStock.volume % 600000 : 12000,
            color: currentPrice >= lastItem.open ? 'rgba(0, 255, 148, 0.15)' : 'rgba(255, 59, 92, 0.15)'
          });
        }
      } catch (e) {
        console.warn('volumeSeries live update failed:', e);
      }
    });

    return unsubscribe;
  }, [symbol, data, type, showVolume, relativeMode]);

  // =========================================================
  // 5. SVG Interactive Clicks / Drawings Coordinate Conversion
  // =========================================================
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (tool === 'cursor' || tool === 'eraser' || !mainContainerRef.current || !chartRef.current || !mainSeriesRef.current) return;

    const rect = mainContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = mainSeriesRef.current.coordinateToPrice(y);

    if (time === null || price === null) return;

    if (tool === 'trendline') {
      setDrawingStart({ time: time as number, price });
      setCurrentLineEnd({ time: time as number, price });
    } else if (tool === 'horizontal') {
      const newHorizontal = {
        id: Math.random().toString(),
        price,
        label: 'Level'
      };
      const updated = [...horizontals, newHorizontal];
      setHorizontals(updated);
      saveDrawings(symbol, trendlines, updated);
      if (onDrawingsChanged) onDrawingsChanged(trendlines, updated);
      setTool('cursor');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!drawingStart || !mainContainerRef.current || !chartRef.current || !mainSeriesRef.current) return;

    const rect = mainContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = mainSeriesRef.current.coordinateToPrice(y);

    if (time !== null && price !== null) {
      setCurrentLineEnd({ time: time as number, price });
    }
  };

  const handleMouseUp = () => {
    if (!drawingStart || !currentLineEnd) return;

    const newTrendline = {
      id: Math.random().toString(),
      start: drawingStart,
      end: currentLineEnd
    };
    const updated = [...trendlines, newTrendline];
    setTrendlines(updated);
    saveDrawings(symbol, updated, horizontals);
    if (onDrawingsChanged) onDrawingsChanged(updated, horizontals);

    setDrawingStart(null);
    setCurrentLineEnd(null);
    setTool('cursor');
  };

  const handleTrendlineClick = (e: React.MouseEvent, id: string) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      const updated = trendlines.filter(t => t.id !== id);
      setTrendlines(updated);
      saveDrawings(symbol, updated, horizontals);
      if (onDrawingsChanged) onDrawingsChanged(updated, horizontals);
    }
  };

  const handleNoteClick = (e: React.MouseEvent, id: string) => {
    if (tool === 'eraser') {
      e.stopPropagation();
      const updated = (notes || []).filter(n => n.id !== id);
      if (onNotesChanged) onNotesChanged(updated);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainContainerRef.current || !chartRef.current || !mainSeriesRef.current) return;

    const rect = mainContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const time = chartRef.current.timeScale().coordinateToTime(x);
    const price = mainSeriesRef.current.coordinateToPrice(y);

    if (time === null || price === null) return;

    const text = prompt("Enter chart note:");
    if (text && text.trim()) {
      const newNote = {
        id: Math.random().toString(),
        time: time as number,
        price,
        text: text.trim()
      };
      const updated = [...(notes || []), newNote];
      if (onNotesChanged) onNotesChanged(updated);
    }
  };

  const handleClearAll = () => {
    setTrendlines([]);
    setHorizontals([]);
    saveDrawings(symbol, [], []);
    if (onDrawingsChanged) onDrawingsChanged([], []);
    if (onNotesChanged) onNotesChanged([]);
  };

  // Convert logical coordinates of notes to current viewport pixels
  const renderedNotes = (notes || []).map(note => {
    if (!chartRef.current || !mainSeriesRef.current) return null;
    const x = chartRef.current.timeScale().timeToCoordinate(note.time as any);
    const y = mainSeriesRef.current.priceToCoordinate(note.price);
    
    if (x === null || y === null) return null;
    return { ...note, x, y };
  }).filter(Boolean) as Array<{ id: string; time: number; price: number; text: string; x: number; y: number }>;

  // Convert logical drawing coordinates to current viewport pixels
  const renderedTrendlines = trendlines.map(t => {
    if (!chartRef.current || !mainSeriesRef.current) return null;
    const x1 = chartRef.current.timeScale().timeToCoordinate(t.start.time as any);
    const y1 = mainSeriesRef.current.priceToCoordinate(t.start.price);
    const x2 = chartRef.current.timeScale().timeToCoordinate(t.end.time as any);
    const y2 = mainSeriesRef.current.priceToCoordinate(t.end.price);
    
    if (x1 === null || y1 === null || x2 === null || y2 === null) return null;
    return { id: t.id, x1, y1, x2, y2 };
  }).filter(Boolean) as Array<{ id: string; x1: number; y1: number; x2: number; y2: number }>;

  // Temp line while dragging
  let tempLineCoords = null;
  if (drawingStart && currentLineEnd && chartRef.current && mainSeriesRef.current) {
    const x1 = chartRef.current.timeScale().timeToCoordinate(drawingStart.time as any);
    const y1 = mainSeriesRef.current.priceToCoordinate(drawingStart.price);
    const x2 = chartRef.current.timeScale().timeToCoordinate(currentLineEnd.time as any);
    const y2 = mainSeriesRef.current.priceToCoordinate(currentLineEnd.price);
    if (x1 !== null && y1 !== null && x2 !== null && y2 !== null) {
      tempLineCoords = { x1, y1, x2, y2 };
    }
  }

  // Get live price Y coord for background flashing
  const livePriceY = (livePrice && mainSeriesRef.current && !relativeMode) 
    ? mainSeriesRef.current.priceToCoordinate(livePrice) 
    : null;

  return (
    <div ref={chartOuterRef} className="space-y-4 w-full relative">
      {/* Floating Toolbar on top left */}
      <div className="absolute top-2 left-2 z-40 flex items-center gap-1.5 p-1 bg-zinc-950/70 border border-zinc-800/80 backdrop-blur-md rounded-xl shadow-lg">
        <button
          onClick={() => setTool('cursor')}
          title="Pan Chart Cursor"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${tool === 'cursor' ? 'bg-app-green text-black' : 'text-text-muted hover:text-white'}`}
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTool('trendline')}
          title="Draw Trendline"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${tool === 'trendline' ? 'bg-app-green text-black' : 'text-text-muted hover:text-white'}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
        </button>
        <button
          disabled={relativeMode}
          onClick={() => setTool('horizontal')}
          title={relativeMode ? "Horizontal levels disabled in relative mode" : "Place Horizontal Level"}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 ${tool === 'horizontal' ? 'bg-app-green text-black' : 'text-text-muted hover:text-white'}`}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          title="Eraser Tool"
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${tool === 'eraser' ? 'bg-app-green text-black font-bold' : 'text-text-muted hover:text-white'}`}
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>
        {(trendlines.length > 0 || horizontals.length > 0 || notes.length > 0) && (
          <button
            onClick={handleClearAll}
            title="Clear All Drawings & Notes"
            className="p-1.5 rounded-lg text-text-muted hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Plot Container */}
      <div 
        onDoubleClick={handleDoubleClick}
        className={`relative w-full rounded-2xl bg-zinc-950/20 border border-zinc-900 backdrop-blur-sm overflow-hidden transition-opacity duration-150 ${isFading ? 'opacity-30' : 'opacity-100'}`}
      >
        {/* Canvas container */}
        <div ref={mainContainerRef} className="w-full min-h-[280px]" />

        {/* SVG Drawing & Annotations Overlay */}
        <svg
          className={`absolute inset-0 w-full h-full ${tool === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto cursor-crosshair'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Active drawing trendlines */}
          {renderedTrendlines.map(t => (
            <g key={t.id}>
              {tool === 'eraser' && (
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke="rgba(239, 68, 68, 0.15)"
                  strokeWidth="12"
                  className="cursor-pointer pointer-events-auto"
                  onClick={(e) => handleTrendlineClick(e, t.id)}
                />
              )}
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={tool === 'eraser' ? '#EF4444' : '#00FF94'}
                strokeWidth="1.8"
                className={`transition-colors pointer-events-none`}
              />
              <circle cx={t.x1} cy={t.y1} r="2.5" fill={tool === 'eraser' ? '#EF4444' : '#00FF94'} />
              <circle cx={t.x2} cy={t.y2} r="2.5" fill={tool === 'eraser' ? '#EF4444' : '#00FF94'} />
            </g>
          ))}

          {/* Rendered Chart Text Notes */}
          {renderedNotes.map(n => {
            const rectWidth = n.text.length * 6 + 12;
            return (
              <g key={n.id} className="cursor-pointer" onClick={(e) => handleNoteClick(e, n.id)}>
                <title>{tool === 'eraser' ? 'Click to delete note' : n.text}</title>
                <circle cx={n.x} cy={n.y} r="3" fill={tool === 'eraser' ? '#EF4444' : '#00FF94'} />
                <rect 
                  x={n.x + 6} 
                  y={n.y - 12} 
                  width={rectWidth} 
                  height="18" 
                  rx="4" 
                  fill="rgba(24, 24, 27, 0.9)" 
                  stroke={tool === 'eraser' ? '#EF4444' : '#27272a'} 
                  strokeWidth="1" 
                  className="pointer-events-auto"
                />
                <text 
                  x={n.x + 12} 
                  y={n.y} 
                  fill={tool === 'eraser' ? '#EF4444' : '#ffffff'} 
                  fontSize="9" 
                  fontFamily="Inter, sans-serif" 
                  className="pointer-events-none"
                >
                  {n.text}
                </text>
              </g>
            );
          })}

          {/* Current line being drawn */}
          {tempLineCoords && (
            <g>
              <line
                x1={tempLineCoords.x1}
                y1={tempLineCoords.y1}
                x2={tempLineCoords.x2}
                y2={tempLineCoords.y2}
                stroke="#00FF94"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle cx={tempLineCoords.x1} cy={tempLineCoords.y1} r="2.5" fill="#00FF94" />
              <circle cx={tempLineCoords.x2} cy={tempLineCoords.y2} r="2.5" fill="#00FF94" />
            </g>
          )}

          {/* Live price horizontal glowing pulse */}
          {livePriceY !== null && (
            <g>
              {livePricePulse && (
                <line
                  x1={0}
                  y1={livePriceY}
                  x2="95%"
                  y2={livePriceY}
                  stroke={livePriceColor}
                  strokeWidth="8"
                  className="opacity-15 pointer-events-none transition-all duration-300"
                />
              )}
              <line
                x1={0}
                y1={livePriceY}
                x2="95%"
                y2={livePriceY}
                stroke={livePriceColor}
                strokeWidth="1"
                strokeDasharray="3 3"
                className="opacity-40 pointer-events-none"
              />
              <circle
                cx="94.5%"
                cy={livePriceY}
                r={livePricePulse ? "7" : "3.5"}
                fill={livePriceColor}
                className={`pointer-events-none transition-all duration-300 ${livePricePulse ? 'opacity-90 animate-pulse' : 'opacity-60'}`}
              />
            </g>
          )}
        </svg>

        {/* Clean floating Cursor Tooltip */}
        {hoverData && (
          <div 
            className="absolute bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-xl p-2.5 text-[9px] text-[#8A8F98] space-y-1 z-35 pointer-events-none shadow-2xl transition-all duration-75"
            style={{ 
              left: `${hoverData.x + 15}px`, 
              top: `${hoverData.y + 15}px` 
            }}
          >
            <div className="font-bold text-white mb-0.5 border-b border-zinc-800/40 pb-0.5">{hoverData.time}</div>
            <div className="grid grid-cols-2 gap-x-2.5 font-mono">
              <div>Open: <span className="text-white">{relativeMode ? '' : '$'}{hoverData.open.toFixed(2)}{relativeMode ? '%' : ''}</span></div>
              <div>High: <span className="text-app-green">{relativeMode ? '' : '$'}{hoverData.high.toFixed(2)}{relativeMode ? '%' : ''}</span></div>
              <div>Low: <span className="text-app-red">{relativeMode ? '' : '$'}{hoverData.low.toFixed(2)}{relativeMode ? '%' : ''}</span></div>
              <div>Close: <span className="text-white">{relativeMode ? '' : '$'}{hoverData.close.toFixed(2)}{relativeMode ? '%' : ''}</span></div>
              {hoverData.volume !== undefined && !relativeMode && (
                <div className="col-span-2 border-t border-zinc-800/40 mt-0.5 pt-0.5">Volume: <span className="text-white">{hoverData.volume.toLocaleString()}</span></div>
              )}
            </div>

            {/* Render corporate event info */}
            {hoverData.event && (
              <div className="border-t border-zinc-800/40 mt-1.5 pt-1.5 space-y-0.5 text-left max-w-[130px]">
                <div className="flex items-center gap-1 font-bold text-white">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: hoverData.event.type === 'E' ? '#3B82F6' : hoverData.event.type === 'D' ? '#10B981' : '#EC4899' }} />
                  <span>[{hoverData.event.type}] {hoverData.event.title}</span>
                </div>
                <div className="text-[8px] leading-tight text-text-muted">{hoverData.event.details}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RSI panel */}
      {indicators.rsi && !relativeMode && (
        <div className="bg-surface-lowest/20 backdrop-blur-sm p-2.5 rounded-xl border border-zinc-900">
          <div className="text-[9px] uppercase font-bold text-text-muted mb-1 px-1 flex justify-between">
            <span>RSI Oscillator (14)</span>
            <span>Overbought: 70 • Oversold: 30</span>
          </div>
          <div ref={rsiContainerRef} className="w-full min-h-[90px]" />
        </div>
      )}

      {/* MACD panel */}
      {indicators.macd && !relativeMode && (
        <div className="bg-surface-lowest/20 backdrop-blur-sm p-2.5 rounded-xl border border-zinc-900">
          <div className="text-[9px] uppercase font-bold text-[#8A8F98] mb-1 px-1">MACD Convergence (12, 26, 9)</div>
          <div ref={macdContainerRef} className="w-full min-h-[110px]" />
        </div>
      )}
    </div>
  );
};
export default TradingViewChartWrapper;
