import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { getUserLevelStats } from '@/lib/user-levels';
import { EARNING_LEVELS, getNextLevel } from '@/lib/levels';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const levelStats = await getUserLevelStats(session.user.id);
    const nextLevel = getNextLevel(levelStats.currentLevel);

    return NextResponse.json({
      ...levelStats,
      nextLevel,
      allLevels: EARNING_LEVELS,
    });
  } catch (error) {
    console.error('Error fetching user level:', error);
    return NextResponse.json({ error: 'Failed to fetch user level' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetLevel } = await request.json();

    if (!targetLevel || targetLevel < 2 || targetLevel > 5) {
      return NextResponse.json({ error: 'Invalid target level' }, { status: 400 });
    }

    const currentLevel = await getUserLevelStats(session.user.id);

    if (targetLevel <= currentLevel.currentLevel) {
      return NextResponse.json({ error: 'Cannot downgrade level' }, { status: 400 });
    }

    const levelData = EARNING_LEVELS.find(l => l.level === targetLevel);
    if (!levelData) {
      return NextResponse.json({ error: 'Level not found' }, { status: 400 });
    }

    // Check if user has enough balance for activation fee
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (!wallet || wallet.balance < levelData.activationFee) {
      return NextResponse.json({ error: 'Insufficient balance for activation fee' }, { status: 400 });
    }

    // Deduct activation fee and upgrade level
    await prisma.wallet.update({
      where: { userId: session.user.id },
      data: {
        balance: wallet.balance - levelData.activationFee,
      },
    });

    // Update user level
    await prisma.userLevel.update({
      where: { userId: session.user.id },
      data: { level: targetLevel },
    });

    // Create transaction record for activation fee
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: -levelData.activationFee,
        type: 'LEVEL_UPGRADE',
        description: `Activation fee for Level ${targetLevel}`,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      newLevel: targetLevel,
      activationFee: levelData.activationFee,
    });
  } catch (error) {
    console.error('Error upgrading user level:', error);
    return NextResponse.json({ error: 'Failed to upgrade level' }, { status: 500 });
  }
}