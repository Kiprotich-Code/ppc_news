import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { deleteFile } from '@/lib/upload';
import path from 'path';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const video = await prisma.video.findUnique({
      where: { id: params.id },
      include: {
        watches: {
          select: {
            reward: true,
            watchedAt: true,
            level: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { watchedAt: 'desc' }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Calculate analytics
    const analytics = {
      ...video,
      watchCount: video.watches.length,
      totalEarnings: video.watches.reduce((sum, watch) => sum + watch.reward, 0),
      averageLevel: video.watches.length > 0
        ? Math.round(video.watches.reduce((sum, watch) => sum + watch.level, 0) / video.watches.length)
        : 0
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { isActive, title, description } = await request.json();

    const updateData: any = {};
    if (isActive !== undefined) updateData.isActive = isActive;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const video = await prisma.video.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get video details before deletion
    const video = await prisma.video.findUnique({
      where: { id: params.id },
      select: {
        videoUrl: true,
        thumbnailUrl: true,
        watches: {
          select: { id: true }
        }
      }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Delete associated watch records
    await prisma.videoWatch.deleteMany({
      where: { videoId: params.id }
    });

    // Delete video record
    await prisma.video.delete({
      where: { id: params.id }
    });

    // Delete physical files
    if (video.videoUrl) {
      const videoPath = path.join(process.cwd(), 'public', video.videoUrl);
      await deleteFile(videoPath);
    }

    if (video.thumbnailUrl) {
      const thumbnailPath = path.join(process.cwd(), 'public', video.thumbnailUrl);
      await deleteFile(thumbnailPath);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
  }
}