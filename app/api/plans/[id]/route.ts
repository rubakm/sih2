import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const plan = await prisma.plan.findUnique({
      where: { id: params.id },
    });
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 400 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: 'Failed to fetch plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.plan.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: 'Failed to delete plan' }, { status: 500 });
  }
}
