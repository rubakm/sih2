'use client';

import React from 'react';
import { EngineOutput } from '@/lib/engine';
import { FileText, TrendingDown } from 'lucide-react';

interface ContractViewProps {
  comparison: EngineOutput['contractComparison'];
  coaDiscountPct: number;
  periodDiscountPct: number;
  onChangeCoaDiscount: (val: number) => void;
  onChangePeriodDiscount: (val: number) => void;
  horizonMonths: number;
}

export default function ContractView({
  comparison,
  coaDiscountPct,
  periodDiscountPct,
  onChangeCoaDiscount,
  onChangePeriodDiscount,
  horizonMonths,
}: ContractViewProps) {
  const cards = [
    {
      title: 'All Spot Market',
      badge: 'Unhedged',
      badgeStyle: 'chip-status-red',
      costPerTonne: comparison.spot.costPerTonne,
      totalCost: comparison.spot.totalCost,
      breakdown: '100% Spot voyage fixing',
      savings: 0,
      isWinner: false,
    },
    {
      title: 'Rule-of-Thumb',
      badge: '60 / 25 / 15',
      badgeStyle: 'chip-assumed',
      costPerTonne: comparison.ruleOfThumb.costPerTonne,
      totalCost: comparison.ruleOfThumb.totalCost,
      breakdown: '60% COA / 25% Period / 15% Spot',
      savings: comparison.ruleOfThumb.savingsVsSpot,
      isWinner: false,
    },
    {
      title: 'LODESTAR Optimal',
      badge: 'Risk Optimized',
      badgeStyle: 'chip-status-green',
      costPerTonne: comparison.lodestarPick.costPerTonne,
      totalCost: comparison.lodestarPick.totalCost,
      breakdown: `${Math.round(comparison.lodestarPick.shareCoa * 100)}% COA / ${Math.round(
        comparison.lodestarPick.sharePeriod * 100
      )}% Period / ${Math.round(comparison.lodestarPick.shareSpot * 100)}% Spot`,
      savings: comparison.lodestarPick.savingsVsSpot,
      isWinner: true,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header and ASSUMED discount inputs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#0A84FF]" />
          <div>
            <span className="text-xs font-semibold tracking-tight text-white uppercase">
              Charter Contract Structure Analysis
            </span>
            <p className="text-[11px] text-[#86868B]">
              Illustrative cost impact evaluated across {horizonMonths}-month commitment window
            </p>
          </div>
        </div>

        {/* Editable assumed discounts */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-[#86868B]">COA Disc:</span>
            <input
              type="number"
              min={0}
              max={15}
              step={0.5}
              value={coaDiscountPct}
              onChange={(e) => onChangeCoaDiscount(parseFloat(e.target.value) || 0)}
              className="w-10 bg-transparent text-white font-mono text-xs font-semibold focus:outline-none text-right"
            />
            <span className="text-[10px] text-[#86868B]">%</span>
            <span className="chip-assumed ml-1">ASSUMED</span>
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-[#86868B]">Period Disc:</span>
            <input
              type="number"
              min={0}
              max={15}
              step={0.5}
              value={periodDiscountPct}
              onChange={(e) => onChangePeriodDiscount(parseFloat(e.target.value) || 0)}
              className="w-10 bg-transparent text-white font-mono text-xs font-semibold focus:outline-none text-right"
            />
            <span className="text-[10px] text-[#86868B]">%</span>
            <span className="chip-assumed ml-1">ASSUMED</span>
          </div>
        </div>
      </div>

      {/* Contract comparison 3-card grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {cards.map((c, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              c.isWinner
                ? 'bg-[#0A84FF]/10 border-[#0A84FF]/40 shadow-lg'
                : 'bg-white/[0.02] border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-white">{c.title}</span>
              <span className={c.badgeStyle}>{c.badge}</span>
            </div>

            <div className="my-2">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-semibold tracking-tight text-white font-mono">
                  ${c.costPerTonne.toFixed(2)}
                </span>
                <span className="text-xs text-[#86868B]">/ t</span>
              </div>
              <p className="text-[11px] text-[#86868B] font-mono mt-0.5">
                Total: ${(c.totalCost / 1000000).toFixed(2)}M
              </p>
            </div>

            <p className="text-[11px] text-[#86868B] border-t border-white/5 pt-2 mt-2">
              {c.breakdown}
            </p>

            {c.savings > 0 && (
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-[#30D158] font-mono">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Save ${(c.savings / 1000).toFixed(0)}k vs Spot</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
