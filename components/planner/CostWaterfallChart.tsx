'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface CostWaterfallProps {
  waterfall: {
    freight: number;
    bunker: number;
    port: number;
    rail: number;
    demurrage: number;
    lightering?: number;
  };
  landedCost: number;
}

export default function CostWaterfallChart({ waterfall, landedCost }: CostWaterfallProps) {
  const data = [
    { name: 'Charter Freight', value: waterfall.freight, fill: '#0A84FF', unit: '$/t' },
    { name: 'Bunker Fuel', value: waterfall.bunker, fill: '#30D158', unit: '$/t' },
    { name: 'Port Dues', value: waterfall.port, fill: '#5E5CE6', unit: '$/t' },
    { name: 'Inland Rail', value: waterfall.rail, fill: '#BF5AF2', unit: '$/t' },
    { name: 'Exp. Demurrage', value: waterfall.demurrage, fill: '#FF9F0A', unit: '$/t' },
    ...(waterfall.lightering && waterfall.lightering > 0
      ? [{ name: 'Lightering', value: waterfall.lightering, fill: '#FFD60A', unit: '$/t' }]
      : []),
    { name: 'Landed Total', value: Number(landedCost.toFixed(2)), fill: '#FFFFFF', unit: '$/t', isTotal: true },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 20 }}>
          <XAxis
            dataKey="name"
            stroke="#86868B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          />
          <YAxis
            stroke="#86868B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
            unit=" $/t"
          />
          <Tooltip
            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-[#0A0E14] border border-white/20 p-2.5 rounded-xl shadow-2xl text-xs font-mono">
                    <p className="text-[#86868B]">{item.name}</p>
                    <p className="text-white font-semibold mt-0.5">
                      ${item.value.toFixed(2)} <span className="text-[#86868B] font-normal">/ tonne</span>
                    </p>
                    <p className="text-[10px] text-white/50 mt-1">
                      {item.isTotal ? 'Net landed cost' : `${((item.value / landedCost) * 100).toFixed(1)}% of total`}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                opacity={entry.isTotal ? 0.95 : 0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
