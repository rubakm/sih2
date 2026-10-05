import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const ports = await prisma.port.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(ports);
  } catch (error) {
    console.error('Error fetching ports:', error);
    return NextResponse.json({ error: 'Failed to fetch ports' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, maxDraft, maxLoa, maxBeam, dischargeRate, waitPriorDays, source, confidence, lastVerified, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Port ID is required' }, { status: 400 });
    }

    const updated = await prisma.port.update({
      where: { id },
      data: {
        maxDraft: Number(maxDraft),
        maxLoa: Number(maxLoa),
        maxBeam: Number(maxBeam),
        dischargeRate: Number(dischargeRate),
        waitPriorDays: Number(waitPriorDays),
        source: String(source),
        confidence: String(confidence),
        lastVerified: String(lastVerified),
        notes: String(notes),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating port:', error);
    return NextResponse.json({ error: 'Failed to update port' }, { status: 500 });
  }
}
