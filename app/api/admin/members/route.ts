import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: List members and details
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

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
          auditLogs: true,
          profile: true,
        },
      });
      return NextResponse.json({ user });
    }
    // List all members (basic info with profile details)
    const users = await prisma.user.findMany({
      include: {
        profile: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Admin members API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Suspend or flag account
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action } = body;
    if (!id || !action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 });
    }
    let updateData: any = {};
    if (action === 'suspend') updateData.role = 'SUSPENDED';
    if (action === 'flag') {
      // Update profile tags if flagging should affect profile
      await prisma.profile.update({
        where: { userId: id },
        data: { tags: 'FLAGGED' },
      });
    }
    if (!Object.keys(updateData).length && action !== 'flag') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });
    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}