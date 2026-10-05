import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, inputsJson, resultJson } = body;

    if (!title || !inputsJson || !resultJson) {
      return NextResponse.json({ error: 'Title, inputs, and results are required' }, { status: 400 });
    }

    const plan = await prisma.plan.create({
      data: {
        title,
        inputsJson: typeof inputsJson === 'string' ? inputsJson : JSON.stringify(inputsJson),
        resultJson: typeof resultJson === 'string' ? resultJson : JSON.stringify(resultJson),
      },
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    console.error('Error saving plan:', error);
    return NextResponse.json({ error: 'Failed to save plan' }, { status: 500 });
  }
}
