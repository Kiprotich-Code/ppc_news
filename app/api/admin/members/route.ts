import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET: List members and details
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('id');
  if (userId) {
    // Get full details for one user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        articles: true,
        withdrawals: true,
        earnings: true,
        auditLogs: true, // Add this line to include auditLogs
      },
    });
    return NextResponse.json({ user });
  }
  // List all members (basic info)
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      createdAt: true,
      profileImage: true,
      phone: true,
      address: true,
      withdrawalAccount: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ users });
}

// POST: Suspend or flag account
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, action } = body;
  if (!id || !action) {
    return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
  }
  let updateData: any = {};
  if (action === 'suspend') updateData.role = 'SUSPENDED';
  if (action === 'flag') updateData.tags = 'FLAGGED';
  if (!Object.keys(updateData).length) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });
  return NextResponse.json({ user: updated });
}
