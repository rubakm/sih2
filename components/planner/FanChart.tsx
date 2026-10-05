'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';

interface FanChartProps {
  currentTce: number;
  fanSeries: Array<{ days: number; p10: number; p50: number; p90: number }>;
  signal: 'Fix now' | 'Wait' | 'Neutral';
  reason: string;
}

export default function FanChart({ currentTce, fanSeries, signal, reason }: FanChartProps) {
  // Structure chart data starting from Day 0 (Current TCE)
  const chartData = [
    {
      days: 0,
      label: 'Today',
      p10: currentTce,
      p50: currentTce,
      p90: currentTce,
      range: [currentTce, currentTce],
    },
    ...fanSeries.map((s) => ({
      days: s.days,
      label: `+${s.days}d`,
      p10: s.p10,
      p50: s.p50,
      p90: s.p90,
      range: [s.p10, s.p90],
    })),
  ];

  const signalColors = {
    'Fix now': { text: '#30D158', bg: 'rgba(48, 209, 88, 0.12)', border: 'rgba(48, 209, 88, 0.3)' },
    'Wait': { text: '#FF453A', bg: 'rgba(255, 69, 58, 0.12)', border: 'rgba(255, 69, 58, 0.3)' },
    'Neutral': { text: '#FF9F0A', bg: 'rgba(255, 159, 10, 0.12)', border: 'rgba(255, 159, 10, 0.3)' },
  };

  const currentCfg = signalColors[signal] || signalColors['Neutral'];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold tracking-tight border flex items-center gap-1.5"
            style={{
              backgroundColor: currentCfg.bg,
              borderColor: currentCfg.border,
              color: currentCfg.text,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentCfg.text }} />
            {signal.toUpperCase()}
          </span>
          <span className="chip-synthetic">SYNTHETIC SERIES</span>
        </div>
        <span className="text-xs text-[#86868B] font-mono">
          Spot TCE: <strong className="text-white">${currentTce.toLocaleString()}</strong> / day
        </span>
      </div>

      <p className="text-xs text-[#86868B] leading-relaxed">{reason}</p>

      {/* Fan Chart Visualizer */}
      <div className="w-full h-56 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="fanBandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0A84FF" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0A84FF" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              stroke="#86868B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="#86868B"
              fontSize={10}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-[#0A0E14] border border-white/20 p-3 rounded-xl shadow-2xl text-xs font-mono space-y-1">
                      <p className="text-[#86868B] font-sans font-medium">{d.label} Forecast Horizon</p>
                      <p className="text-[#30D158]">P90 High: ${d.p90.toLocaleString()}/day</p>
                      <p className="text-[#0A84FF] font-semibold">P50 Mean: ${d.p50.toLocaleString()}/day</p>
                      <p className="text-[#FF9F0A]">P10 Low: ${d.p10.toLocaleString()}/day</p>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Upper Fan Boundary P90 */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="transparent"
              fill="url(#fanBandGradient)"
            />

            {/* Median Forecast Line P50 */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#0A84FF"
              strokeWidth={2}
              dot={{ fill: '#0A84FF', r: 3 }}
            />

            {/* Lower Fan Boundary P10 */}
            <Line
              type="monotone"
              dataKey="p10"
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="3 3"
              strokeWidth={1}
              dot={false}
            />

            {/* Current Spot point */}
            <ReferenceDot x="Today" y={currentTce} r={4} fill="#FFFFFF" stroke="#0A84FF" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#86868B] border-t border-white/5 pt-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-[#0A84FF]" /> P50 Expected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2 bg-[#0A84FF]/20 rounded-xs" /> P10–P90 Band
          </span>
        </div>
        <span className="italic text-[10px]">Synthetic series. Replace with real data via CSV.</span>
      </div>
    </div>
  );
}
