import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const origins = await prisma.origin.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(origins);
  } catch (error) {
    console.error('Error fetching origins:', error);
    return NextResponse.json({ error: 'Failed to fetch origins' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, distanceToParadipNm, loadDraftCap } = body;

    if (!id) {
      return NextResponse.json({ error: 'Origin ID is required' }, { status: 400 });
    }

    const updated = await prisma.origin.update({
      where: { id },
      data: {
        distanceToParadipNm: Number(distanceToParadipNm),
        loadDraftCap: Number(loadDraftCap),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating origin:', error);
    return NextResponse.json({ error: 'Failed to update origin' }, { status: 500 });
  }
}
