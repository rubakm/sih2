import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LODESTAR database...');

  // 1. Vessels
  await prisma.vessel.deleteMany();
  const vessels = [
    {
      name: 'Handysize',
      dwt: 35000,
      loa: 180,
      beam: 28,
      designDraft: 10.0,
      burnPerDay: 22,
    },
    {
      name: 'Supramax',
      dwt: 58000,
      loa: 190,
      beam: 32,
      designDraft: 12.8,
      burnPerDay: 28,
    },
    {
      name: 'Panamax',
      dwt: 82000,
      loa: 229,
      beam: 32.3,
      designDraft: 14.4,
      burnPerDay: 32,
    },
    {
      name: 'Capesize',
      dwt: 180000,
      loa: 292,
      beam: 45,
      designDraft: 18.2,
      burnPerDay: 55,
    },
  ];

  for (const v of vessels) {
    await prisma.vessel.create({ data: v });
  }

  // 2. Discharge Ports
  await prisma.port.deleteMany();
  const ports = [
    {
      name: 'Paradip',
      maxDraft: 16.5,
      maxLoa: 300,
      maxBeam: 48,
      dischargeRate: 30000,
      waitPriorDays: 1.9,
      source: 'Paradip Port Authority Tariff & Berthing Guidelines 2024',
      confidence: 'high',
      lastVerified: '2024-08-15',
      notes: 'Deep draft mechanized coal berths; tidal assistance for Cape draft up to 18m planned.',
    },
    {
      name: 'Visakhapatnam',
      maxDraft: 18.0,
      maxLoa: 300,
      maxBeam: 50,
      dischargeRate: 32000,
      waitPriorDays: 2.7,
      source: 'VPA Outer Harbour Navigation Gazette',
      confidence: 'high',
      lastVerified: '2024-07-20',
      notes: 'Outer harbour handles fully laden Capesizes up to 200k DWT.',
    },
    {
      name: 'Gangavaram',
      maxDraft: 18.0,
      maxLoa: 300,
      maxBeam: 50,
      dischargeRate: 35000,
      waitPriorDays: 1.5,
      source: 'Adani Gangavaram Port Terminal Handbook',
      confidence: 'high',
      lastVerified: '2024-09-01',
      notes: 'Deepest multi-purpose private port in vicinity of steel belt.',
    },
    {
      name: 'Dhamra',
      maxDraft: 17.5,
      maxLoa: 290,
      maxBeam: 47,
      dischargeRate: 32000,
      waitPriorDays: 1.3,
      source: 'DPCL Operations Circular 2023-24',
      confidence: 'med',
      lastVerified: '2024-06-10',
      notes: 'Conflict detected: 17.5m operating vs 18.0m advertised chart depth in secondary pilot notices.',
    },
    {
      name: 'Gopalpur',
      maxDraft: 12.0,
      maxLoa: 235,
      maxBeam: 36,
      dischargeRate: 18000,
      waitPriorDays: 1.0,
      source: 'Gopalpur Port Marine Manual',
      confidence: 'med',
      lastVerified: '2024-05-12',
      notes: 'Draft restricted; limited to geared/gearless Panamax partially laden and Handymax.',
    },
    {
      name: 'Haldia',
      maxDraft: 8.5,
      maxLoa: 225,
      maxBeam: 32,
      dischargeRate: 15000,
      waitPriorDays: 2.3,
      source: 'SMP Kolkata Tidal Window Bulletin',
      confidence: 'low',
      lastVerified: '2024-04-01',
      notes: 'Riverine port with severe Hooghly bars. Verify with daily port notice before fixing.',
    },
    {
      name: 'Sagar-Sandheads Anchorage',
      maxDraft: 16.0,
      maxLoa: 300,
      maxBeam: 48,
      dischargeRate: 12000,
      waitPriorDays: 2.0,
      source: 'Kolkata Port Trust Anchorage Rules',
      confidence: 'med',
      lastVerified: '2024-03-15',
      notes: 'Lightering node; daughter barges transship to Haldia. User-defined lightering cost applies.',
    },
  ];

  for (const p of ports) {
    await prisma.port.create({ data: p });
  }

  // 3. Origins
  await prisma.origin.deleteMany();
  const origins = [
    {
      name: 'Hay Point (AU)',
      distanceToParadipNm: 5900,
      loadDraftCap: 17.5,
    },
    {
      name: 'Balikpapan (ID)',
      distanceToParadipNm: 2900,
      loadDraftCap: 17.5,
    },
    {
      name: 'Richards Bay (ZA)',
      distanceToParadipNm: 5300,
      loadDraftCap: 17.5,
    },
    {
      name: 'Hampton Roads via Cape (US)',
      distanceToParadipNm: 12400,
      loadDraftCap: 17.5,
    },
    {
      name: 'Vostochny (RU)',
      distanceToParadipNm: 6000,
      loadDraftCap: 17.5,
    },
  ];

  for (const o of origins) {
    await prisma.origin.create({ data: o });
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
