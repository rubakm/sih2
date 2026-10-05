'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, RotateCcw, ArrowRight, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { RouteOptionResult } from '@/lib/engine';

export interface ScenarioState {
  freightShockPct: number;
  vesselDelayDays: number;
  congestionMultiplier: number;
  bunkerShockPct: number;
  paradipDraftOverride: number;
}

interface ScenarioControlsProps {
  scenarios: ScenarioState;
  onChangeScenario: (updates: Partial<ScenarioState>) => void;
  onReset: () => void;
  baseRecommended: RouteOptionResult | null;
  currentRecommended: RouteOptionResult | null;
}

export default function ScenarioControls({
  scenarios,
  onChangeScenario,
  onReset,
  baseRecommended,
  currentRecommended,
}: ScenarioControlsProps) {
  const isModified =
    scenarios.freightShockPct !== 0 ||
    scenarios.vesselDelayDays !== 0 ||
    scenarios.congestionMultiplier !== 1.0 ||
    scenarios.bunkerShockPct !== 0 ||
    scenarios.paradipDraftOverride !== 16.5;

  const costDelta =
    baseRecommended && currentRecommended
      ? currentRecommended.landedCostPerTonne - baseRecommended.landedCostPerTonne
      : 0;

  const recommendationChanged =
    baseRecommended &&
    currentRecommended &&
    (baseRecommended.vesselName !== currentRecommended.vesselName ||
      baseRecommended.portName !== currentRecommended.portName);

  return (
    <div className="w-full rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#0A84FF]" />
          <h3 className="text-xs font-semibold tracking-tight text-white uppercase">
            Stress-Test & Scenario Simulation
          </h3>
          <span className="chip-assumed">LIVE DYNAMIC SHOCKS</span>
        </div>

        {isModified && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-[#86868B] hover:text-white transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Shocks</span>
          </button>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Freight Market Shock */}
        <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#86868B]">TCE Freight Shock</span>
            <span
              className={`text-xs font-mono font-medium ${
                scenarios.freightShockPct > 0
                  ? 'text-[#FF453A]'
                  : scenarios.freightShockPct < 0
                  ? 'text-[#30D158]'
                  : 'text-white'
              }`}
            >
              {scenarios.freightShockPct > 0 ? `+${scenarios.freightShockPct}%` : `${scenarios.freightShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={5}
            value={scenarios.freightShockPct}
            onChange={(e) => onChangeScenario({ freightShockPct: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-[#86868B] font-mono">
            <span>-30%</span>
            <span>0</span>
            <span>+30%</span>
          </div>
        </div>

        {/* 2. Vessel Delay */}
        <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#86868B]">Vessel Sea Delay</span>
            <span className="text-xs font-mono font-medium text-white">
              +{scenarios.vesselDelayDays} days
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={7}
            step={1}
            value={scenarios.vesselDelayDays}
            onChange={(e) => onChangeScenario({ vesselDelayDays: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-[#86868B] font-mono">
            <span>0 d</span>
            <span>3 d</span>
            <span>7 d</span>
          </div>
        </div>

        {/* 3. Port Congestion */}
        <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#86868B]">Port Congestion</span>
            <span
              className={`text-xs font-mono font-medium ${
                scenarios.congestionMultiplier > 1 ? 'text-[#FF9F0A]' : 'text-white'
              }`}
            >
              {scenarios.congestionMultiplier.toFixed(1)}x wait
            </span>
          </div>
          <input
            type="range"
            min={1.0}
            max={3.0}
            step={0.2}
            value={scenarios.congestionMultiplier}
            onChange={(e) => onChangeScenario({ congestionMultiplier: parseFloat(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-[#86868B] font-mono">
            <span>1.0x</span>
            <span>2.0x</span>
            <span>3.0x</span>
          </div>
        </div>

        {/* 4. Bunker Price Shock */}
        <div className="flex flex-col gap-1.5 bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#86868B]">Bunker Fuel Shock</span>
            <span
              className={`text-xs font-mono font-medium ${
                scenarios.bunkerShockPct > 0
                  ? 'text-[#FF453A]'
                  : scenarios.bunkerShockPct < 0
                  ? 'text-[#30D158]'
                  : 'text-white'
              }`}
            >
              {scenarios.bunkerShockPct > 0 ? `+${scenarios.bunkerShockPct}%` : `${scenarios.bunkerShockPct}%`}
            </span>
          </div>
          <input
            type="range"
            min={-30}
            max={30}
            step={5}
            value={scenarios.bunkerShockPct}
            onChange={(e) => onChangeScenario({ bunkerShockPct: parseInt(e.target.value) })}
            className="w-full"
          />
          <div className="flex justify-between text-[9px] text-[#86868B] font-mono">
            <span>-30%</span>
            <span>0</span>
            <span>+30%</span>
          </div>
        </div>

        {/* 5. Paradip Draft Toggle */}
        <div className="flex flex-col justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-[#86868B]">Paradip Draft</span>
            <span className="text-xs font-mono font-semibold text-[#0A84FF]">
              {scenarios.paradipDraftOverride.toFixed(1)} m
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <button
              onClick={() => onChangeScenario({ paradipDraftOverride: 16.5 })}
              className={`py-1 text-[11px] rounded-lg font-mono font-medium transition-all ${
                scenarios.paradipDraftOverride === 16.5
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-[#86868B] hover:text-white'
              }`}
            >
              16.5m (Std)
            </button>
            <button
              onClick={() => onChangeScenario({ paradipDraftOverride: 18.0 })}
              className={`py-1 text-[11px] rounded-lg font-mono font-medium transition-all ${
                scenarios.paradipDraftOverride === 18.0
                  ? 'bg-[#0A84FF] text-white shadow-md'
                  : 'bg-white/5 text-[#86868B] hover:text-white'
              }`}
            >
              18.0m (Deep)
            </button>
          </div>
        </div>
      </div>

      {/* Live Recompute Diff Banner */}
      <AnimatePresence mode="wait">
        {isModified && baseRecommended && currentRecommended && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0A84FF]/5 rounded-xl p-3 border border-[#0A84FF]/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Scenario Impact on Optimal Fix</p>
                <div className="flex items-center gap-2 text-xs text-[#86868B] mt-0.5">
                  <span className="line-through text-[#86868B]">
                    {baseRecommended.vesselName} @ {baseRecommended.portName} (${baseRecommended.landedCostPerTonne.toFixed(2)}/t)
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#0A84FF]" />
                  <span className="font-semibold text-white">
                    {currentRecommended.vesselName} @ {currentRecommended.portName} (${currentRecommended.landedCostPerTonne.toFixed(2)}/t)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {recommendationChanged && (
                <span className="chip-status-amber">PORT / VESSEL SHIFT</span>
              )}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-[#86868B]">Cost Delta:</span>
                <span
                  className={`font-semibold flex items-center ${
                    costDelta > 0 ? 'text-[#FF453A]' : costDelta < 0 ? 'text-[#30D158]' : 'text-white'
                  }`}
                >
                  {costDelta > 0 ? (
                    <>
                      <TrendingUp className="w-3 h-3 mr-0.5" /> +${costDelta.toFixed(2)}/t
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3 mr-0.5" /> -${Math.abs(costDelta).toFixed(2)}/t
                    </>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
