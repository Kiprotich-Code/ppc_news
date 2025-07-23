import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: List withdrawal requests (optionally filter by status)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const allowedStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'FLAGGED']; // adjust to your enum values
  const where = status && allowedStatuses.includes(status)
    ? { status: status as any }
    : {};
  const withdrawals = await prisma.withdrawal.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ withdrawals });
}

// POST: Approve/reject/flag withdrawal
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, action, note } = body;
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }
  let statusUpdate;
  if (action === 'approve') statusUpdate = 'APPROVED';
  else if (action === 'reject') statusUpdate = 'REJECTED';
  else if (action === 'flag') statusUpdate = undefined;
  else if (action === 'paid') statusUpdate = 'PAID';
  else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const updateData: any = {};
  if (statusUpdate) updateData.status = statusUpdate;
  if (action === 'flag') updateData.flagged = true;
  if (action === 'paid') updateData.paidAt = new Date();
  if (note) updateData.note = note;

  const updated = await prisma.withdrawal.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ withdrawal: updated });
}
