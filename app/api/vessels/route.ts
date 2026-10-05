import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const vessels = await prisma.vessel.findMany({
      orderBy: { dwt: 'asc' },
    });
    return NextResponse.json(vessels);
  } catch (error) {
    console.error('Error fetching vessels:', error);
    return NextResponse.json({ error: 'Failed to fetch vessels' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, dwt, loa, beam, designDraft, burnPerDay } = body;

    if (!id) {
      return NextResponse.json({ error: 'Vessel ID is required' }, { status: 400 });
    }

    const updated = await prisma.vessel.update({
      where: { id },
      data: {
        dwt: Number(dwt),
        loa: Number(loa),
        beam: Number(beam),
        designDraft: Number(designDraft),
        burnPerDay: Number(burnPerDay),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating vessel:', error);
    return NextResponse.json({ error: 'Failed to update vessel' }, { status: 500 });
  }
}
