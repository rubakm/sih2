import {
  checkFeasibility,
  calculatePayload,
  calculateDemurrageMonteCarlo,
  runCharterPlanner,
  VesselData,
  PortData,
  OriginData,
  EngineInputs,
} from './engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

function runTests() {
  console.log('Running LODESTAR Charter Decision Engine Tests...\n');

  // Test 1: Feasibility Exclusion
  const testVessel: VesselData = {
    name: 'Capesize',
    dwt: 180000,
    loa: 292,
    beam: 45,
    designDraft: 18.2,
    burnPerDay: 55,
  };

  const smallPort: PortData = {
    name: 'Gopalpur',
    maxDraft: 12.0,
    maxLoa: 235,
    maxBeam: 36,
    dischargeRate: 18000,
    waitPriorDays: 1.0,
    source: 'Test',
    confidence: 'med',
    lastVerified: '2024-01-01',
    notes: 'Test',
  };

  const largePort: PortData = {
    name: 'Paradip',
    maxDraft: 16.5,
    maxLoa: 300,
    maxBeam: 48,
    dischargeRate: 30000,
    waitPriorDays: 1.9,
    source: 'Test',
    confidence: 'high',
    lastVerified: '2024-01-01',
    notes: 'Test',
  };

  const feasSmall = checkFeasibility(testVessel, smallPort);
  assert(!feasSmall.isFeasible, 'Capesize correctly excluded at Gopalpur due to LOA/beam exceeding limit');

  const feasLarge = checkFeasibility(testVessel, largePort);
  assert(feasLarge.isFeasible, 'Capesize correctly feasible at Paradip (LOA 292 <= 300, Beam 45 <= 48)');

  // Test 2: Draft-Limited Payload Calculation
  // Nominal payload = 0.95 * 180,000 = 171,000 t
  // Light draft = 0.3 * 18.2 = 5.46 m
  // Design draft = 18.2 m
  // Port draft = 16.5 m (Paradip), Origin draft cap = 17.5 m -> effective draft = 16.5 m
  // Expected ratio = (16.5 - 5.46) / (18.2 - 5.46) = 11.04 / 12.74 ≈ 0.86656
  // Expected payload = 171,000 * 0.86656 ≈ 148,182 t
  const payloadResult = calculatePayload(testVessel, 16.5, 17.5);
  assert(payloadResult.nominalPayload === 171000, 'Nominal payload is 95% of DWT (171,000 t)');
  const expectedPayload = 171000 * ((16.5 - 0.3 * 18.2) / (18.2 - 0.3 * 18.2));
  assert(
    Math.abs(payloadResult.payload - expectedPayload) < 1,
    `Draft-limited payload formula correct: got ${payloadResult.payload.toFixed(0)}, expected ${expectedPayload.toFixed(0)}`
  );
  assert(
    payloadResult.loadFactorPct > 85 && payloadResult.loadFactorPct < 88,
    `Load factor is approx 86.7% (got ${payloadResult.loadFactorPct.toFixed(1)}%)`
  );

  // Test full draft (when effective draft >= design draft)
  const fullPayloadResult = calculatePayload(testVessel, 18.5, 18.5);
  assert(
    fullPayloadResult.payload === 171000,
    'When draft is sufficient (18.5m >= 18.2m), payload is 100% nominal payload'
  );

  // Test 3: Monte Carlo Demurrage
  const mcResult = calculateDemurrageMonteCarlo(
    1.9, // expected wait days
    4.0, // ops days
    4.0, // laytime days
    25000, // demurrage $/day
    150000, // payload tonnes
    50 // risk appetite
  );
  assert(mcResult.expectedDemurragePerTonne >= 0, 'Monte Carlo produces non-negative expected demurrage');
  assert(mcResult.p90DemurragePerTonne >= mcResult.expectedDemurragePerTonne, 'P90 demurrage >= Expected demurrage');
  assert(
    mcResult.blendedDemurragePerTonne >= mcResult.expectedDemurragePerTonne &&
      mcResult.blendedDemurragePerTonne <= mcResult.p90DemurragePerTonne,
    'Blended demurrage sits between expected and P90'
  );

  // Test 4: Overall Ranking and Engine Execution
  const vessels: VesselData[] = [
    { name: 'Handysize', dwt: 35000, loa: 180, beam: 28, designDraft: 10.0, burnPerDay: 22 },
    { name: 'Panamax', dwt: 82000, loa: 229, beam: 32.3, designDraft: 14.4, burnPerDay: 32 },
    testVessel,
  ];

  const ports: PortData[] = [largePort, smallPort];

  const origin: OriginData = {
    name: 'Hay Point (AU)',
    distanceToParadipNm: 5900,
    loadDraftCap: 17.5,
  };

  const inputs: EngineInputs = {
    cargoKt: 150,
    originName: 'Hay Point (AU)',
    horizonMonths: 3,
    monthlyRequirementKt: 50,
    riskAppetite: 30,
    demurrageRatePerDay: 25000,
    laytimeDays: 4,
    bunkerPricePerTonne: 600,
    railCostPerTonne: 8,
    portCostPerTonne: 1.2,
  };

  const engineOutput = runCharterPlanner(inputs, vessels, ports, origin);
  assert(engineOutput.rankedResults.length === 6, 'All 6 vessel x port combinations evaluated');
  assert(engineOutput.recommended !== undefined, 'Recommended option identified');
  assert(engineOutput.recommended.isFeasible === true, 'Recommended option is feasible');
  assert(
    engineOutput.rankedResults[0].landedCostPerTonne <= engineOutput.rankedResults[1].landedCostPerTonne,
    'Results properly ranked in ascending order of landed cost'
  );

  console.log('\nAll unit tests passed successfully!\n');
}

runTests();
