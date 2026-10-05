'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import RouteStrip from '@/components/planner/RouteStrip';
import CostWaterfallChart from '@/components/planner/CostWaterfallChart';
import FanChart from '@/components/planner/FanChart';
import ContractView from '@/components/planner/ContractView';
import ScenarioControls, { ScenarioState } from '@/components/planner/ScenarioControls';
import {
  runCharterPlanner,
  VesselData,
  PortData,
  OriginData,
  EngineInputs,
  EngineOutput,
  RouteOptionResult,
  PORT_OFFSETS_NM,
} from '@/lib/engine';
import {
  Play,
  Bookmark,
  CheckCircle,
  HelpCircle,
  Scale,
  DollarSign,
  Clock,
  Compass,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlannerPage() {
  // DB entities
  const [ports, setPorts] = useState<PortData[]>([]);
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [origins, setOrigins] = useState<OriginData[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);

  // Form Inputs
  const [cargoKt, setCargoKt] = useState<number>(150);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('Hay Point (AU)');
  const [horizonMonths, setHorizonMonths] = useState<number>(3);
  const [monthlyRequirementKt, setMonthlyRequirementKt] = useState<number>(50);
  const [riskAppetite, setRiskAppetite] = useState<number>(40);
  const [demurrageRatePerDay, setDemurrageRatePerDay] = useState<number>(25000);
  const [dischargeRateTonnesPerDay, setDischargeRateTonnesPerDay] = useState<number>(30000);
  const [laytimeDays, setLaytimeDays] = useState<number>(4);
  const [bunkerPricePerTonne, setBunkerPricePerTonne] = useState<number>(600);
  const [railCostPerTonne, setRailCostPerTonne] = useState<number>(8.0);
  const [portCostPerTonne, setPortCostPerTonne] = useState<number>(1.2);
  const [coaDiscountPct, setCoaDiscountPct] = useState<number>(4);
  const [periodDiscountPct, setPeriodDiscountPct] = useState<number>(2);

  // Scenario Stress-test State
  const defaultScenarios: ScenarioState = {
    freightShockPct: 0,
    vesselDelayDays: 0,
    congestionMultiplier: 1.0,
    bunkerShockPct: 0,
    paradipDraftOverride: 16.5,
  };
  const [scenarios, setScenarios] = useState<ScenarioState>(defaultScenarios);

  // Selected result in list (defaults to recommended #0)
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);

  // Save Plan state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Demo playback state
  const [demoStep, setDemoStep] = useState<number | null>(null);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  // Fetch data from DB
  const loadDatabaseData = useCallback(async () => {
    setIsLoadingDb(true);
    try {
      const [portsRes, vesselsRes, originsRes] = await Promise.all([
        fetch('/api/ports'),
        fetch('/api/vessels'),
        fetch('/api/origins'),
      ]);

      const [portsData, vesselsData, originsData] = await Promise.all([
        portsRes.json(),
        vesselsRes.json(),
        originsRes.json(),
      ]);

      if (Array.isArray(portsData)) setPorts(portsData);
      if (Array.isArray(vesselsData)) setVessels(vesselsData);
      if (Array.isArray(originsData)) setOrigins(originsData);
    } catch (e) {
      console.error('Failed to load database values:', e);
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Active Origin
  const activeOrigin = useMemo(() => {
    return (
      origins.find((o) => o.name === selectedOrigin) || {
        name: selectedOrigin,
        distanceToParadipNm: 5900,
        loadDraftCap: 17.5,
      }
    );
  }, [origins, selectedOrigin]);

  // BASE Planner Engine Execution (without scenarios)
  const baseInputs: EngineInputs = useMemo(
    () => ({
      cargoKt,
      originName: activeOrigin.name,
      horizonMonths,
      monthlyRequirementKt,
      riskAppetite,
      demurrageRatePerDay,
      dischargeRateTonnesPerDay,
      laytimeDays,
      bunkerPricePerTonne,
      railCostPerTonne,
      portCostPerTonne,
      coaDiscountPct,
      periodDiscountPct,
      freightShockPct: 0,
      vesselDelayDays: 0,
      congestionMultiplier: 1.0,
      bunkerShockPct: 0,
      paradipDraftOverride: 16.5,
    }),
    [
      cargoKt,
      activeOrigin,
      horizonMonths,
      monthlyRequirementKt,
      riskAppetite,
      demurrageRatePerDay,
      dischargeRateTonnesPerDay,
      laytimeDays,
      bunkerPricePerTonne,
      railCostPerTonne,
      portCostPerTonne,
      coaDiscountPct,
      periodDiscountPct,
    ]
  );

  const baseOutput: EngineOutput | null = useMemo(() => {
    if (!ports.length || !vessels.length) return null;
    return runCharterPlanner(baseInputs, vessels, ports, activeOrigin);
  }, [baseInputs, ports, vessels, activeOrigin]);

  // CURRENT Scenario Planner Engine Execution
  const currentInputs: EngineInputs = useMemo(
    () => ({
      ...baseInputs,
      freightShockPct: scenarios.freightShockPct,
      vesselDelayDays: scenarios.vesselDelayDays,
      congestionMultiplier: scenarios.congestionMultiplier,
      bunkerShockPct: scenarios.bunkerShockPct,
      paradipDraftOverride: scenarios.paradipDraftOverride,
    }),
    [baseInputs, scenarios]
  );

  const currentOutput: EngineOutput | null = useMemo(() => {
    if (!ports.length || !vessels.length) return null;
    return runCharterPlanner(currentInputs, vessels, ports, activeOrigin);
  }, [currentInputs, ports, vessels, activeOrigin]);

  // Active view result (either selected by user or top recommended)
  const activeResult: RouteOptionResult | null = useMemo(() => {
    if (!currentOutput || !currentOutput.rankedResults.length) return null;
    return (
      currentOutput.rankedResults[selectedResultIndex] ||
      currentOutput.recommended ||
      currentOutput.rankedResults[0]
    );
  }, [currentOutput, selectedResultIndex]);

  // Save Plan to DB
  const handleSavePlan = async () => {
    if (!currentOutput || !currentOutput.recommended) return;
    setIsSaving(true);
    try {
      const title = `${cargoKt}kt ${activeOrigin.name.split(' ')[0]} to ${
        currentOutput.recommended.portName
      } (${currentOutput.recommended.vesselName})`;

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          inputsJson: currentInputs,
          resultJson: currentOutput.recommended,
        }),
      });

      if (res.ok) {
        setSaveSuccessMessage('Plan saved to database');
        setTimeout(() => setSaveSuccessMessage(null), 3500);
      }
    } catch (e) {
      console.error('Error saving plan:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Automated Demo Tour
  const runDemoTour = () => {
    setDemoStep(1);
    setDemoBanner('Step 1/3: Loading baseline cargo from Hay Point (150 kt, 3 months)...');
    setCargoKt(150);
    setSelectedOrigin('Hay Point (AU)');
    setHorizonMonths(3);
    setMonthlyRequirementKt(50);
    setRiskAppetite(40);
    setScenarios(defaultScenarios);
    setSelectedResultIndex(0);

    setTimeout(() => {
      setDemoStep(2);
      setDemoBanner('Step 2/3: Applying shock "Paradip congestion 2.0x" (expected waiting doubles)...');
      setScenarios((prev) => ({ ...prev, congestionMultiplier: 2.0 }));

      setTimeout(() => {
        setDemoStep(3);
        setDemoBanner(
          'Step 3/3: Unlocking "Paradip draft 18.0 m" (allows full Capesize payload with zero draft penalty)...'
        );
        setScenarios((prev) => ({ ...prev, paradipDraftOverride: 18.0 }));

        setTimeout(() => {
          setDemoStep(null);
          setDemoBanner('Demo complete! You can now adjust any inputs or save this scenario.');
          setTimeout(() => setDemoBanner(null), 5000);
        }, 4000);
      }, 4000);
    }, 3500);
  };

  const activeDistance = activeOrigin
    ? activeOrigin.distanceToParadipNm + (PORT_OFFSETS_NM[activeResult?.portName || 'Paradip'] ?? 0)
    : 5900;

  return (
    <div className="min-h-screen bg-[#0A0E14] text-[#F5F5F7] pb-24 selection:bg-[#0A84FF] selection:text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 flex flex-col gap-6">
        {/* Top Control Header with Demo button & Save Plan */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest text-[#0A84FF] font-semibold">
                SIH26006 Decision Engine
              </span>
              <span className="chip-assumed">OFFLINE COMPUTE</span>
              {isLoadingDb && (
                <span className="text-xs text-[#86868B] flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full border border-white/20 border-t-[#0A84FF] animate-spin" />
                  <span>Loading registry...</span>
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1">
              Coking Coal Charter Planner
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] mt-0.5">
              Least-cost vessel class, discharge port, and contract hedging recommendation for India’s East Coast
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Demo Button */}
            <button
              onClick={runDemoTour}
              disabled={demoStep !== null}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/15 shadow-sm transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5 text-[#0A84FF] fill-[#0A84FF]" />
              <span>{demoStep ? 'Running Demo...' : 'Load demo'}</span>
            </button>

            {/* Save Plan Button */}
            <button
              onClick={handleSavePlan}
              disabled={isSaving || !currentOutput}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-[#0A84FF] hover:bg-[#0071E3] text-white shadow-lg transition-all duration-200"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save plan'}</span>
            </button>
          </div>
        </div>

        {/* Demo Tour Announcement Banner */}
        <AnimatePresence>
          {demoBanner && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full bg-[#0A84FF]/15 border border-[#0A84FF]/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-xl"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#0A84FF] animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-white">{demoBanner}</span>
              </div>
              <button
                onClick={() => setDemoBanner(null)}
                className="text-xs text-[#86868B] hover:text-white"
              >
                Dismiss
              </button>
            </motion.div>
          )}

          {saveSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full bg-[#30D158]/15 border border-[#30D158]/30 rounded-xl px-4 py-3 flex items-center gap-2 text-xs font-medium text-[#30D158]"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{saveSuccessMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. ROUTE STRIP COMPONENT */}
        <RouteStrip
          origin={activeOrigin.name}
          destination={activeResult?.portName || 'Paradip'}
          result={activeResult}
          distanceNm={activeDistance}
        />

        {/* 2. CORE INTERFACE GRID: Inputs (Left) & Results (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Input Configuration Parameters */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#0A84FF]" />
                  <h2 className="text-xs font-semibold tracking-tight text-white uppercase">
                    Cargo & Voyage Parameters
                  </h2>
                </div>
                <span className="chip-assumed">INPUTS</span>
              </div>

              <div className="flex flex-col gap-4">
                {/* Cargo Requirement */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <label className="text-[#86868B]">Cargo Volume</label>
                    <span className="font-mono font-semibold text-white">{cargoKt} kt</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[50, 80, 150, 180].map((val) => (
                      <button
                        key={val}
                        onClick={() => setCargoKt(val)}
                        className={`py-1 text-xs rounded-lg font-mono transition-all ${
                          cargoKt === val
                            ? 'bg-[#0A84FF] text-white shadow-sm'
                            : 'bg-white/5 text-[#86868B] hover:text-white'
                        }`}
                      >
                        {val} kt
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={250}
                    step={10}
                    value={cargoKt}
                    onChange={(e) => setCargoKt(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Origin Port */}
                <div>
                  <label className="text-xs text-[#86868B] block mb-1.5">Loading Port (Origin)</label>
                  <select
                    value={selectedOrigin}
                    onChange={(e) => setSelectedOrigin(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0A84FF]"
                  >
                    {origins.map((o) => (
                      <option key={o.name} value={o.name} className="bg-[#0A0E14] text-white">
                        {o.name} ({o.distanceToParadipNm.toLocaleString()} nm, max {o.loadDraftCap}m draft)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contract Horizon & Monthly Requirement */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#86868B] block mb-1">Contract Horizon</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={horizonMonths}
                        onChange={(e) => setHorizonMonths(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-transparent font-mono text-xs text-white focus:outline-none"
                      />
                      <span className="text-[11px] text-[#86868B]">months</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#86868B] block mb-1">Monthly Req.</label>
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
                      <input
                        type="number"
                        min={10}
                        max={300}
                        step={10}
                        value={monthlyRequirementKt}
                        onChange={(e) => setMonthlyRequirementKt(parseInt(e.target.value) || 50)}
                        className="w-full bg-transparent font-mono text-xs text-white focus:outline-none"
                      />
                      <span className="text-[11px] text-[#86868B]">kt</span>
                    </div>
                  </div>
                </div>

                {/* Risk Appetite Slider */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label className="text-[#86868B] flex items-center gap-1">
                      <span>Demurrage Risk Appetite</span>
                      <span className="chip-assumed">P50 vs P90</span>
                    </label>
                    <span className="font-mono text-xs text-white">
                      {riskAppetite}% ({riskAppetite < 35 ? 'Aggressive' : riskAppetite > 65 ? 'Conservative' : 'Balanced'})
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={riskAppetite}
                    onChange={(e) => setRiskAppetite(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-[#86868B] font-mono mt-1">
                    <span>0 (Expected P50)</span>
                    <span>50 (Blended)</span>
                    <span>100 (Full P90)</span>
                  </div>
                </div>

                {/* Advanced Maritime Parameters Collapsible / Grid */}
                <div className="border-t border-white/5 pt-3 flex flex-col gap-2.5">
                  <span className="text-[11px] font-semibold text-white/80 uppercase tracking-tight">
                    Terminal & Financial Defaults
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[#86868B] block">Demurrage ($/day)</span>
                      <input
                        type="number"
                        step={1000}
                        value={demurrageRatePerDay}
                        onChange={(e) => setDemurrageRatePerDay(parseInt(e.target.value) || 25000)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] block">Discharge Rate (t/day)</span>
                      <input
                        type="number"
                        step={2000}
                        value={dischargeRateTonnesPerDay}
                        onChange={(e) => setDischargeRateTonnesPerDay(parseInt(e.target.value) || 30000)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] block">Laytime (days)</span>
                      <input
                        type="number"
                        step={0.5}
                        value={laytimeDays}
                        onChange={(e) => setLaytimeDays(parseFloat(e.target.value) || 4)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] block">VLSFO Bunker ($/t)</span>
                      <input
                        type="number"
                        step={10}
                        value={bunkerPricePerTonne}
                        onChange={(e) => setBunkerPricePerTonne(parseInt(e.target.value) || 600)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] block">Rail to Plant ($/t)</span>
                      <input
                        type="number"
                        step={0.5}
                        value={railCostPerTonne}
                        onChange={(e) => setRailCostPerTonne(parseFloat(e.target.value) || 8.0)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86868B] block">Port Dues ($/t)</span>
                      <input
                        type="number"
                        step={0.1}
                        value={portCostPerTonne}
                        onChange={(e) => setPortCostPerTonne(parseFloat(e.target.value) || 1.2)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 font-mono text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Recommendation Output, Rankings, Waterfall & Timing */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* HERO RECOMMENDATION CARD */}
            {currentOutput && currentOutput.recommended ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] backdrop-blur-2xl border border-white/15 p-6 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#0A84FF]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="chip-status-green">OPTIMAL FIX</span>
                    <span className="text-xs text-[#86868B] font-mono">
                      {currentOutput.recommended.voyagesNeeded}{' '}
                      {currentOutput.recommended.voyagesNeeded === 1 ? 'voyage' : 'voyages'} required
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[#86868B]">
                    <span>Expected Demurrage:</span>
                    <strong className="text-[#FF9F0A]">
                      ${currentOutput.recommended.blendedDemurragePerTonne.toFixed(2)}/t
                    </strong>
                  </div>
                </div>

                <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white leading-snug">
                  {currentOutput.heroSentence}
                </h2>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
                  <div>
                    <span className="text-[11px] text-[#86868B] block">Landed Cost</span>
                    <span className="text-2xl font-semibold tracking-tight text-white font-mono">
                      ${currentOutput.recommended.landedCostPerTonne.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#86868B] block">/ tonne</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#86868B] block">Payload Utilization</span>
                    <span className="text-2xl font-semibold tracking-tight text-white font-mono">
                      {currentOutput.recommended.loadFactorPct}%
                    </span>
                    <span className="text-[10px] text-[#86868B] block">
                      {(currentOutput.recommended.payloadTonnes / 1000).toFixed(1)} kt per voyage
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#86868B] block">Total Voyage Time</span>
                    <span className="text-2xl font-semibold tracking-tight text-white font-mono">
                      {currentOutput.recommended.voyageDays.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[#86868B] block">days round-trip</span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#86868B] block">Horizon Outlay</span>
                    <span className="text-2xl font-semibold tracking-tight text-white font-mono">
                      ${(currentOutput.recommended.totalCostForHorizon / 1000000).toFixed(2)}M
                    </span>
                    <span className="text-[10px] text-[#86868B] block">{horizonMonths} month spend</span>
                  </div>
                </div>

                {/* Plain-Language Why / Binding Constraint */}
                <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2.5">
                  <HelpCircle className="w-4 h-4 text-[#0A84FF] mt-0.5 shrink-0" />
                  <div className="text-xs text-[#86868B]">
                    <strong className="text-white font-medium">Binding Constraint Analysis: </strong>
                    {currentOutput.recommended.bindingConstraint}. Vessel class maximizes economies of scale
                    over the {activeDistance.toLocaleString()} nm sea route while keeping berthing demurrage
                    contained.
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* RANKED ALTERNATIVES TABLE */}
            {currentOutput && (
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-[#0A84FF]" />
                    <h3 className="text-xs font-semibold tracking-tight text-white uppercase">
                      Ranked Vessel & Port Combinations
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#86868B]">
                    Click row to inspect waterfall & trajectory
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-white/5 text-[#86868B]">
                        <th className="py-2 px-2 font-normal">Rank</th>
                        <th className="py-2 px-2 font-normal">Vessel Class</th>
                        <th className="py-2 px-2 font-normal">Discharge Port</th>
                        <th className="py-2 px-2 font-normal text-right">Landed $/t</th>
                        <th className="py-2 px-2 font-normal text-right">Payload</th>
                        <th className="py-2 px-2 font-normal text-right">Voyage d</th>
                        <th className="py-2 px-2 font-normal text-right">Demurrage</th>
                        <th className="py-2 px-2 font-normal">Binding Constraint</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {currentOutput.rankedResults.map((res, idx) => {
                        const isSelected = selectedResultIndex === idx;
                        return (
                          <tr
                            key={`${res.vesselName}-${res.portName}`}
                            onClick={() => setSelectedResultIndex(idx)}
                            className={`cursor-pointer transition-colors duration-150 ${
                              isSelected ? 'bg-white/10' : 'hover:bg-white/[0.03]'
                            } ${!res.isFeasible ? 'opacity-40' : ''}`}
                          >
                            <td className="py-2.5 px-2">
                              {res.isFeasible ? (
                                <span
                                  className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-semibold ${
                                    idx === 0
                                      ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/40'
                                      : 'bg-white/5 text-[#86868B]'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                              ) : (
                                <span className="text-[#FF453A] text-[10px]">EXCL</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 font-medium text-white">{res.vesselName}</td>
                            <td className="py-2.5 px-2 text-[#86868B]">{res.portName}</td>
                            <td className="py-2.5 px-2 text-right font-semibold text-white">
                              {res.isFeasible ? `$${res.landedCostPerTonne.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right text-[#86868B]">
                              {res.isFeasible ? `${(res.payloadTonnes / 1000).toFixed(0)}kt (${res.loadFactorPct}%)` : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right text-[#86868B]">
                              {res.isFeasible ? `${res.voyageDays.toFixed(1)}d` : '—'}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              {res.isFeasible ? (
                                <span
                                  className={
                                    res.blendedDemurragePerTonne > 3
                                      ? 'text-[#FF453A]'
                                      : res.blendedDemurragePerTonne > 1.5
                                      ? 'text-[#FF9F0A]'
                                      : 'text-[#30D158]'
                                  }
                                >
                                  ${res.blendedDemurragePerTonne.toFixed(2)}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-[11px] text-[#86868B] truncate max-w-xs font-sans">
                              {res.bindingConstraint}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COST WATERFALL & FIX NOW VS WAIT GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cost Waterfall */}
              {activeResult && activeResult.isFeasible && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#0A84FF]" />
                        <h3 className="text-xs font-semibold tracking-tight text-white uppercase">
                          Cost Waterfall Breakdown
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-[#86868B]">
                        {activeResult.vesselName} @ {activeResult.portName}
                      </span>
                    </div>
                    <CostWaterfallChart
                      waterfall={activeResult.waterfall}
                      landedCost={activeResult.landedCostPerTonne}
                    />
                  </div>
                </div>
              )}

              {/* Fix Now vs Wait Fan Chart */}
              {currentOutput && (
                <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-[#0A84FF]" />
                    <h3 className="text-xs font-semibold tracking-tight text-white uppercase">
                      Charter Fixing Timing Signal
                    </h3>
                  </div>
                  <FanChart
                    currentTce={currentOutput.timingSignal.currentTce}
                    fanSeries={currentOutput.timingSignal.fanSeries}
                    signal={currentOutput.timingSignal.signal}
                    reason={currentOutput.timingSignal.reason}
                  />
                </div>
              )}
            </div>

            {/* CONTRACT ALLOCATION COMPARISON */}
            {currentOutput && (
              <div className="rounded-2xl bg-white/[0.03] backdrop-blur-2xl border border-white/10 p-5 shadow-xl">
                <ContractView
                  comparison={currentOutput.contractComparison}
                  coaDiscountPct={coaDiscountPct}
                  periodDiscountPct={periodDiscountPct}
                  onChangeCoaDiscount={setCoaDiscountPct}
                  onChangePeriodDiscount={setPeriodDiscountPct}
                  horizonMonths={horizonMonths}
                />
              </div>
            )}

            {/* SCENARIO CONTROLS WITH LIVE ANIMATED DIFF */}
            <ScenarioControls
              scenarios={scenarios}
              onChangeScenario={(upd) => setScenarios((prev) => ({ ...prev, ...upd }))}
              onReset={() => setScenarios(defaultScenarios)}
              baseRecommended={baseOutput?.recommended || null}
              currentRecommended={currentOutput?.recommended || null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
