import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { canUserWatchVideoToday, incrementUserWatchCount, getUserCurrentLevel } from '@/lib/user-levels';
import { getLevelEarnings } from '@/lib/levels';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Check if user can watch video today
    const canWatch = await canUserWatchVideoToday(session.user.id);
    if (!canWatch) {
      return NextResponse.json({ error: 'Daily video limit reached' }, { status: 400 });
    }

    // Check if user has already watched this video today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingWatch = await prisma.videoWatch.findFirst({
      where: {
        userId: session.user.id,
        videoId,
        watchedAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingWatch) {
      return NextResponse.json({ error: 'Video already watched today' }, { status: 400 });
    }

    // Get user's current level and calculate reward
    const userLevel = await getUserCurrentLevel(session.user.id);
    const reward = getLevelEarnings(userLevel);

    // Record the video watch
    const videoWatch = await prisma.videoWatch.create({
      data: {
        userId: session.user.id,
        videoId,
        reward,
        level: userLevel,
      },
    });

    // Increment user's watch count for today
    await incrementUserWatchCount(session.user.id);

    // Add reward to user's wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: session.user.id },
    });

    if (wallet) {
      await prisma.wallet.update({
        where: { userId: session.user.id },
        data: {
          balance: wallet.balance + reward,
          earnings: wallet.earnings + reward,
        },
      });
    }

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        amount: reward,
        type: 'VIDEO_REWARD',
        description: `Reward for watching video (Level ${userLevel})`,
        status: 'COMPLETED',
      },
    });

    return NextResponse.json({
      success: true,
      reward,
      level: userLevel,
      watchId: videoWatch.id,
    });
  } catch (error) {
    console.error('Error processing video watch:', error);
    return NextResponse.json({ error: 'Failed to process video watch' }, { status: 500 });
  }
}