/**
 * LODESTAR Charter Decision Engine
 * Pure mathematical functions for coking coal import logistics to India East Coast.
 */

export interface VesselData {
  id?: string;
  name: string;
  dwt: number;
  loa: number;
  beam: number;
  designDraft: number;
  burnPerDay: number;
}

export interface PortData {
  id?: string;
  name: string;
  maxDraft: number;
  maxLoa: number;
  maxBeam: number;
  dischargeRate: number;
  waitPriorDays: number;
  source: string;
  confidence: 'high' | 'med' | 'low' | string;
  lastVerified: string;
  notes: string;
}

export interface OriginData {
  id?: string;
  name: string;
  distanceToParadipNm: number;
  loadDraftCap: number;
}

export interface EngineInputs {
  cargoKt: number; // e.g. 150 kt
  originName: string;
  horizonMonths: number; // 1 to 12
  monthlyRequirementKt: number; // kt/month
  riskAppetite: number; // 0 to 100 (0=risk neutral, 100=risk averse)
  demurrageRatePerDay: number; // default $25,000
  dischargeRateTonnesPerDay?: number; // default 30,000
  laytimeDays: number; // default 4
  bunkerPricePerTonne: number; // default $600
  railCostPerTonne: number; // default $8
  portCostPerTonne: number; // default $1.2
  lighteringCostPerTonne?: number; // default $6 for transshipment
  coaDiscountPct?: number; // default 4 (%)
  periodDiscountPct?: number; // default 2 (%)
  // Scenario overrides:
  freightShockPct?: number; // -30 to +30 (%)
  vesselDelayDays?: number; // 0 to 7 days
  congestionMultiplier?: number; // 1 to 3x
  bunkerShockPct?: number; // -30 to +30 (%)
  paradipDraftOverride?: number; // 16.5 or 18.0
}

export interface RouteOptionResult {
  vesselName: string;
  portName: string;
  isFeasible: boolean;
  infeasibilityReason?: string;
  bindingConstraint: string;
  payloadTonnes: number;
  nominalPayloadTonnes: number;
  loadFactorPct: number; // payload / nominalPayload * 100
  seaDays: number;
  portDays: number;
  voyageDays: number;
  distanceNm: number;
  tceRate: number;
  bunkerCostPerTonne: number;
  freightCostPerTonne: number; // TCE component
  portCostPerTonne: number;
  railCostPerTonne: number;
  lighteringCostPerTonne: number;
  expectedDemurragePerTonne: number;
  p90DemurragePerTonne: number;
  blendedDemurragePerTonne: number;
  baseCostPerTonne: number; // freight + bunker + port + rail + lightering
  landedCostPerTonne: number; // base + blendedDemurrage
  voyagesNeeded: number;
  totalCostForRequirement: number;
  totalCostForHorizon: number;
  waterfall: {
    freight: number;
    bunker: number;
    port: number;
    rail: number;
    demurrage: number;
    lightering: number;
  };
}

export interface EngineOutput {
  rankedResults: RouteOptionResult[];
  recommended: RouteOptionResult;
  heroSentence: string;
  alternatives: RouteOptionResult[];
  contractComparison: {
    spot: { shareCoa: number; sharePeriod: number; shareSpot: number; totalCost: number; costPerTonne: number };
    ruleOfThumb: { shareCoa: number; sharePeriod: number; shareSpot: number; totalCost: number; costPerTonne: number; savingsVsSpot: number };
    lodestarPick: { shareCoa: number; sharePeriod: number; shareSpot: number; totalCost: number; costPerTonne: number; savingsVsSpot: number };
  };
  timingSignal: {
    signal: 'Fix now' | 'Wait' | 'Neutral';
    reason: string;
    currentTce: number;
    forecastP10_30d: number;
    forecastP50_30d: number;
    forecastP90_30d: number;
    fanSeries: Array<{ days: number; p10: number; p50: number; p90: number }>;
  };
}

// Distance offsets from Paradip (in nautical miles)
export const PORT_OFFSETS_NM: Record<string, number> = {
  'Paradip': 0,
  'Visakhapatnam': -250,
  'Gangavaram': -250,
  'Gopalpur': -150,
  'Dhamra': 30,
  'Haldia': 120,
  'Sagar-Sandheads Anchorage': 100,
};

// Synthetic baseline TCE rates ($/day)
export const BASE_TCE_RATES: Record<string, number> = {
  'Handysize': 11000,
  'Supramax': 13500,
  'Panamax': 16500,
  'Capesize': 26000,
};

// Rail cost differentials to inland steel plants ($/t)
export const PORT_RAIL_COSTS: Record<string, number> = {
  'Paradip': 8.0,
  'Dhamra': 8.5,
  'Gopalpur': 9.5,
  'Haldia': 9.0,
  'Visakhapatnam': 10.0,
  'Gangavaram': 10.0,
  'Sagar-Sandheads Anchorage': 9.0,
};

/**
 * 1. Feasibility check
 * Exclude only if vessel LOA or beam exceeds port limit.
 */
export function checkFeasibility(vessel: VesselData, port: PortData): { isFeasible: boolean; reason?: string } {
  if (vessel.loa > port.maxLoa) {
    return {
      isFeasible: false,
      reason: `Vessel LOA (${vessel.loa}m) exceeds port limit (${port.maxLoa}m)`,
    };
  }
  if (vessel.beam > port.maxBeam) {
    return {
      isFeasible: false,
      reason: `Vessel beam (${vessel.beam}m) exceeds port limit (${port.maxBeam}m)`,
    };
  }
  return { isFeasible: true };
}

/**
 * 2. Draft-limited Payload computation
 * Payload = min(vessel payload, draft-limited payload)
 * vessel payload = 0.95 * dwt
 * light_draft = 0.3 * design_draft
 * draft_limited_payload = vessel_payload * (effectiveDraft - light_draft) / (design_draft - light_draft)
 */
export function calculatePayload(
  vessel: VesselData,
  portDraft: number,
  originDraftCap: number
): { payload: number; nominalPayload: number; loadFactorPct: number; bindingConstraint: string } {
  const nominalPayload = 0.95 * vessel.dwt;
  const lightDraft = 0.3 * vessel.designDraft;
  const effectiveDraft = Math.min(portDraft, originDraftCap);

  let draftLimitedPayload = nominalPayload;
  let bindingConstraint = 'Full draft capacity utilized';

  if (effectiveDraft < vessel.designDraft) {
    if (effectiveDraft <= lightDraft) {
      draftLimitedPayload = 0;
      bindingConstraint = `Draft restricted below light draft (${lightDraft.toFixed(1)}m)`;
    } else {
      draftLimitedPayload = nominalPayload * ((effectiveDraft - lightDraft) / (vessel.designDraft - lightDraft));
      if (portDraft < originDraftCap) {
        const pct = Math.round((draftLimitedPayload / nominalPayload) * 100);
        bindingConstraint = `Port draft (${portDraft.toFixed(1)}m) limits ${vessel.name} to ${pct}% payload`;
      } else {
        const pct = Math.round((draftLimitedPayload / nominalPayload) * 100);
        bindingConstraint = `Origin draft cap (${originDraftCap.toFixed(1)}m) limits ${vessel.name} to ${pct}% payload`;
      }
    }
  }

  const finalPayload = Math.max(0, Math.min(nominalPayload, draftLimitedPayload));
  const loadFactorPct = nominalPayload > 0 ? (finalPayload / nominalPayload) * 100 : 0;

  return {
    payload: finalPayload,
    nominalPayload,
    loadFactorPct,
    bindingConstraint,
  };
}

/**
 * Deterministic pseudo-random generator (Mulberry32) for reproducible Monte Carlo draws
 */
export function createRng(seed: number = 42) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 5. Monte Carlo Expected and P90 Demurrage calculation
 * 2,000 draws with lognormal waiting time centered on port's prior (x congestionMultiplier)
 */
export function calculateDemurrageMonteCarlo(
  expectedWaitingDays: number,
  opsDays: number,
  laytimeDays: number,
  demurrageRatePerDay: number,
  payloadTonnes: number,
  riskAppetite: number,
  drawsCount: number = 2000,
  seed: number = 1337
): { expectedDemurragePerTonne: number; p90DemurragePerTonne: number; blendedDemurragePerTonne: number } {
  if (payloadTonnes <= 0) {
    return { expectedDemurragePerTonne: 0, p90DemurragePerTonne: 0, blendedDemurragePerTonne: 0 };
  }

  const rng = createRng(seed);
  const m = Math.max(0.2, expectedWaitingDays);
  const cv = 0.55; // typical maritime port arrival wait CV
  const sigma2 = Math.log(1 + cv * cv);
  const sigma = Math.sqrt(sigma2);
  const mu = Math.log(m) - sigma2 / 2;

  const demurrageCostsPerTonne: number[] = new Array(drawsCount);
  let totalCost = 0;

  for (let i = 0; i < drawsCount; i++) {
    // Box-Muller transform for normal variate
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const waitDays = Math.exp(mu + sigma * z);
    const demurrageDays = Math.max(0, waitDays + opsDays - laytimeDays);
    const costTon = (demurrageDays * demurrageRatePerDay) / payloadTonnes;

    demurrageCostsPerTonne[i] = costTon;
    totalCost += costTon;
  }

  demurrageCostsPerTonne.sort((a, b) => a - b);
  const expectedDemurragePerTonne = totalCost / drawsCount;
  const p90Index = Math.floor(drawsCount * 0.9);
  const p90DemurragePerTonne = demurrageCostsPerTonne[p90Index];

  // Risk slider blends expected cost and P90 cost
  const riskWeight = Math.max(0, Math.min(100, riskAppetite)) / 100;
  const blendedDemurragePerTonne =
    expectedDemurragePerTonne + riskWeight * (p90DemurragePerTonne - expectedDemurragePerTonne);

  return {
    expectedDemurragePerTonne,
    p90DemurragePerTonne,
    blendedDemurragePerTonne,
  };
}

/**
 * 8. Fix Now vs Wait Forecast & Timing Signal
 * Bootstraps synthetic TCE series with mean-reversion
 */
export function computeTimingSignal(
  vesselName: string,
  freightShockPct: number = 0
): EngineOutput['timingSignal'] {
  const baseTce = BASE_TCE_RATES[vesselName] || 20000;
  const currentTce = baseTce * (1 + freightShockPct / 100);

  // Synthetic 180-day series generation (seeded)
  const rng = createRng(999);
  const daysHorizon = [14, 30, 60];
  const numSims = 1000;

  // Mean reversion parameter kappa and volatility sigma
  const kappa = 0.03; // daily mean reversion rate
  const sigma = 0.022; // daily volatility
  const longTermMean = baseTce;

  const fanSeries = daysHorizon.map((targetDay) => {
    const endTces: number[] = new Array(numSims);

    for (let s = 0; s < numSims; s++) {
      let tce = currentTce;
      for (let d = 0; d < targetDay; d++) {
        const u1 = Math.max(1e-7, rng());
        const u2 = rng();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // Ornstein-Uhlenbeck style discretization
        const drift = kappa * (longTermMean - tce);
        const shock = sigma * tce * z;
        tce = Math.max(4000, tce + drift + shock);
      }
      endTces[s] = tce;
    }

    endTces.sort((a, b) => a - b);
    return {
      days: targetDay,
      p10: Math.round(endTces[Math.floor(numSims * 0.1)]),
      p50: Math.round(endTces[Math.floor(numSims * 0.5)]),
      p90: Math.round(endTces[Math.floor(numSims * 0.9)]),
    };
  });

  const day30 = fanSeries.find((f) => f.days === 30) || fanSeries[1];
  const bandWidth = day30.p90 - day30.p10;
  const threshold = 0.03 * bandWidth;

  let signal: 'Fix now' | 'Wait' | 'Neutral' = 'Neutral';
  let reason = '';

  if (currentTce >= day30.p50 + threshold) {
    signal = 'Fix now';
    reason = `Current TCE ($${Math.round(currentTce).toLocaleString()}/day) sits above 30-day forecast p50 ($${Math.round(
      day30.p50
    ).toLocaleString()}/day) by >3% of band width; market tightening favors securing tonnage immediately.`;
  } else if (currentTce <= day30.p50 - threshold) {
    signal = 'Wait';
    reason = `Current TCE ($${Math.round(currentTce).toLocaleString()}/day) is below 30-day forward mean ($${Math.round(
      day30.p50
    ).toLocaleString()}/day); spot softness suggests waiting for favorable charter fixing window.`;
  } else {
    signal = 'Neutral';
    reason = `Current TCE is balanced within the forward 30-day confidence band ($${Math.round(
      day30.p10
    ).toLocaleString()} - $${Math.round(day30.p90).toLocaleString()}/day).`;
  }

  return {
    signal,
    reason,
    currentTce: Math.round(currentTce),
    forecastP10_30d: day30.p10,
    forecastP50_30d: day30.p50,
    forecastP90_30d: day30.p90,
    fanSeries,
  };
}

/**
 * 7. Contract Allocation Strategy Comparison
 */
export function calculateContractComparison(
  bestResult: RouteOptionResult,
  inputs: EngineInputs
): EngineOutput['contractComparison'] {
  const horizonCargo = inputs.monthlyRequirementKt * inputs.horizonMonths * 1000;
  const baseLanded = bestResult.landedCostPerTonne;

  const coaDiscount = (inputs.coaDiscountPct ?? 4) / 100;
  const periodDiscount = (inputs.periodDiscountPct ?? 2) / 100;

  // 1. All Spot
  const spotRate = baseLanded;
  const spotTotalCost = spotRate * horizonCargo;

  // 2. Rule of thumb: 60% COA / 25% Period / 15% Spot
  const rotCoaCost = baseLanded * (1 - coaDiscount);
  const rotPeriodCost = baseLanded * (1 - periodDiscount);
  const rotBlendedRate = 0.6 * rotCoaCost + 0.25 * rotPeriodCost + 0.15 * spotRate;
  const rotTotalCost = rotBlendedRate * horizonCargo;

  // 3. LODESTAR Pick: risk-weighted dynamic allocation
  // Higher risk appetite (conservative) -> lock in 75% COA, 20% Period, 5% Spot
  // Lower risk appetite -> 40% COA, 30% Period, 30% Spot
  const riskWeight = (inputs.riskAppetite ?? 50) / 100;
  const pickCoa = 0.4 + 0.35 * riskWeight;
  const pickPeriod = 0.3 - 0.1 * riskWeight;
  const pickSpot = 1 - pickCoa - pickPeriod;
  const pickBlendedRate = pickCoa * rotCoaCost + pickPeriod * rotPeriodCost + pickSpot * spotRate;
  const pickTotalCost = pickBlendedRate * horizonCargo;

  return {
    spot: {
      shareCoa: 0,
      sharePeriod: 0,
      shareSpot: 1,
      costPerTonne: Number(spotRate.toFixed(2)),
      totalCost: Math.round(spotTotalCost),
    },
    ruleOfThumb: {
      shareCoa: 0.6,
      sharePeriod: 0.25,
      shareSpot: 0.15,
      costPerTonne: Number(rotBlendedRate.toFixed(2)),
      totalCost: Math.round(rotTotalCost),
      savingsVsSpot: Math.round(spotTotalCost - rotTotalCost),
    },
    lodestarPick: {
      shareCoa: Number(pickCoa.toFixed(2)),
      sharePeriod: Number(pickPeriod.toFixed(2)),
      shareSpot: Number(pickSpot.toFixed(2)),
      costPerTonne: Number(pickBlendedRate.toFixed(2)),
      totalCost: Math.round(pickTotalCost),
      savingsVsSpot: Math.round(spotTotalCost - pickTotalCost),
    },
  };
}

/**
 * Main Planner Computation Engine
 * Runs for every (Vessel x Port) combination given inputs, vessels, ports, origin.
 */
export function runCharterPlanner(
  inputs: EngineInputs,
  vessels: VesselData[],
  ports: PortData[],
  origin: OriginData
): EngineOutput {
  const speedKn = 13.0; // standard bulk carrier eco-speed
  const cargoTonnes = inputs.cargoKt * 1000;
  const bunkerPrice = inputs.bunkerPricePerTonne * (1 + (inputs.bunkerShockPct ?? 0) / 100);
  const vesselDelay = inputs.vesselDelayDays ?? 0;
  const congestionMult = inputs.congestionMultiplier ?? 1.0;
  const defaultPortCost = inputs.portCostPerTonne ?? 1.2;
  const defaultRailCost = inputs.railCostPerTonne ?? 8.0;
  const lighteringFee = inputs.lighteringCostPerTonne ?? 6.0;

  const results: RouteOptionResult[] = [];

  for (const vessel of vessels) {
    for (const port of ports) {
      // Check LOA and Beam Feasibility
      const feasibility = checkFeasibility(vessel, port);

      // Handle Paradip draft scenario override if active
      let portDraft = port.maxDraft;
      if (port.name.toLowerCase().includes('paradip') && inputs.paradipDraftOverride) {
        portDraft = inputs.paradipDraftOverride;
      }

      // Payload calculation
      const { payload, nominalPayload, loadFactorPct, bindingConstraint } = calculatePayload(
        vessel,
        portDraft,
        origin.loadDraftCap
      );

      // If LOA/Beam infeasible or payload is 0
      if (!feasibility.isFeasible || payload <= 0) {
        results.push({
          vesselName: vessel.name,
          portName: port.name,
          isFeasible: false,
          infeasibilityReason: feasibility.reason || 'Zero payload due to severe draft limits',
          bindingConstraint: feasibility.reason || bindingConstraint,
          payloadTonnes: 0,
          nominalPayloadTonnes: nominalPayload,
          loadFactorPct: 0,
          seaDays: 0,
          portDays: 0,
          voyageDays: 0,
          distanceNm: 0,
          tceRate: 0,
          bunkerCostPerTonne: 0,
          freightCostPerTonne: 0,
          portCostPerTonne: 0,
          railCostPerTonne: 0,
          lighteringCostPerTonne: 0,
          expectedDemurragePerTonne: 0,
          p90DemurragePerTonne: 0,
          blendedDemurragePerTonne: 0,
          baseCostPerTonne: Infinity,
          landedCostPerTonne: Infinity,
          voyagesNeeded: 0,
          totalCostForRequirement: Infinity,
          totalCostForHorizon: Infinity,
          waterfall: { freight: 0, bunker: 0, port: 0, rail: 0, demurrage: 0, lightering: 0 },
        });
        continue;
      }

      // Distance
      const portOffset = PORT_OFFSETS_NM[port.name] ?? 0;
      const distanceNm = origin.distanceToParadipNm + portOffset;
      const seaDays = distanceNm / (speedKn * 24);

      // Port Days: Expected waiting (with congestion multiplier) + Cargo Ops days
      const dischargeRate = inputs.dischargeRateTonnesPerDay ?? port.dischargeRate ?? 30000;
      const opsDays = payload / dischargeRate;
      const expectedWaiting = port.waitPriorDays * congestionMult;
      const portDays = expectedWaiting + opsDays;
      const voyageDays = seaDays + portDays + vesselDelay;

      // TCE rate with freight shock
      const baseTce = BASE_TCE_RATES[vessel.name] || 20000;
      const tceRate = baseTce * (1 + (inputs.freightShockPct ?? 0) / 100);

      // Bunker cost = burn_t_per_day * bunker_price * sea_days
      const totalBunkerCost = vessel.burnPerDay * bunkerPrice * seaDays;
      const bunkerCostPerTonne = totalBunkerCost / payload;

      // Charter freight TCE per tonne = (TCE * voyageDays) / payload
      const freightCostPerTonne = (tceRate * voyageDays) / payload;

      // Port costs
      const portCostPerTonne = defaultPortCost;

      // Rail costs
      const railCostPerTonne = PORT_RAIL_COSTS[port.name] ?? defaultRailCost;

      // Transshipment / Lightering
      const isLightering = port.name.toLowerCase().includes('sagar') || port.name.toLowerCase().includes('sandheads');
      const lighteringCostPerTonne = isLightering ? lighteringFee : 0;

      // Demurrage (Monte Carlo 2,000 draws)
      const { expectedDemurragePerTonne, p90DemurragePerTonne, blendedDemurragePerTonne } =
        calculateDemurrageMonteCarlo(
          expectedWaiting,
          opsDays,
          inputs.laytimeDays,
          inputs.demurrageRatePerDay,
          payload,
          inputs.riskAppetite
        );

      const baseCostPerTonne =
        freightCostPerTonne +
        bunkerCostPerTonne +
        portCostPerTonne +
        railCostPerTonne +
        lighteringCostPerTonne;

      const landedCostPerTonne = baseCostPerTonne + blendedDemurragePerTonne;

      // Number of voyages needed for requirement
      const voyagesNeeded = Math.ceil(cargoTonnes / payload);
      const totalCostForRequirement = landedCostPerTonne * cargoTonnes;
      const totalCostForHorizon =
        landedCostPerTonne * (inputs.monthlyRequirementKt * 1000 * inputs.horizonMonths);

      results.push({
        vesselName: vessel.name,
        portName: port.name,
        isFeasible: true,
        bindingConstraint,
        payloadTonnes: Math.round(payload),
        nominalPayloadTonnes: Math.round(nominalPayload),
        loadFactorPct: Number(loadFactorPct.toFixed(1)),
        seaDays: Number(seaDays.toFixed(2)),
        portDays: Number(portDays.toFixed(2)),
        voyageDays: Number(voyageDays.toFixed(2)),
        distanceNm,
        tceRate,
        bunkerCostPerTonne: Number(bunkerCostPerTonne.toFixed(2)),
        freightCostPerTonne: Number(freightCostPerTonne.toFixed(2)),
        portCostPerTonne: Number(portCostPerTonne.toFixed(2)),
        railCostPerTonne: Number(railCostPerTonne.toFixed(2)),
        lighteringCostPerTonne: Number(lighteringCostPerTonne.toFixed(2)),
        expectedDemurragePerTonne: Number(expectedDemurragePerTonne.toFixed(2)),
        p90DemurragePerTonne: Number(p90DemurragePerTonne.toFixed(2)),
        blendedDemurragePerTonne: Number(blendedDemurragePerTonne.toFixed(2)),
        baseCostPerTonne: Number(baseCostPerTonne.toFixed(2)),
        landedCostPerTonne: Number(landedCostPerTonne.toFixed(2)),
        voyagesNeeded,
        totalCostForRequirement: Math.round(totalCostForRequirement),
        totalCostForHorizon: Math.round(totalCostForHorizon),
        waterfall: {
          freight: Number(freightCostPerTonne.toFixed(2)),
          bunker: Number(bunkerCostPerTonne.toFixed(2)),
          port: Number(portCostPerTonne.toFixed(2)),
          rail: Number(railCostPerTonne.toFixed(2)),
          demurrage: Number(blendedDemurragePerTonne.toFixed(2)),
          lightering: Number(lighteringCostPerTonne.toFixed(2)),
        },
      });
    }
  }

  // Rank by risk-adjusted landed $/t (feasible only first)
  results.sort((a, b) => {
    if (a.isFeasible && !b.isFeasible) return -1;
    if (!a.isFeasible && b.isFeasible) return 1;
    return a.landedCostPerTonne - b.landedCostPerTonne;
  });

  const recommended = results[0];
  const alternatives = results.filter((r) => r.isFeasible).slice(1, 4);

  // Hero sentence
  const heroSentence = recommended
    ? `Fix ${recommended.vesselName} discharging at ${recommended.portName} for lowest landed cost of $${recommended.landedCostPerTonne.toFixed(
        2
      )}/t (${recommended.voyagesNeeded} ${
        recommended.voyagesNeeded === 1 ? 'voyage' : 'voyages'
      }, ${recommended.loadFactorPct}% load factor).`
    : 'No feasible vessel/port combination found for given parameters.';

  // Contract analysis
  const contractComparison = calculateContractComparison(recommended, inputs);

  // Timing signal
  const timingSignal = computeTimingSignal(recommended.vesselName, inputs.freightShockPct);

  return {
    rankedResults: results,
    recommended,
    heroSentence,
    alternatives,
    contractComparison,
    timingSignal,
  };
}
