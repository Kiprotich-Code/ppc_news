import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { saveUploadedFile, validateVideoFile, validateImageFile, getVideoDuration } from '@/lib/upload';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET() {
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

    // Fetch videos with analytics
    const videos = await prisma.video.findMany({
      include: {
        watches: {
          select: {
            reward: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate analytics for each video
    const videosWithAnalytics = videos.map(video => ({
      ...video,
      watchCount: video.watches.length,
      totalEarnings: video.watches.reduce((sum, watch) => sum + watch.reward, 0)
    }));

    return NextResponse.json(videosWithAnalytics);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const videoFile = formData.get('video') as File;
    const thumbnailFile = formData.get('thumbnail') as File;

    // Validate required fields
    if (!title || !videoFile) {
      return NextResponse.json({ error: 'Title and video file are required' }, { status: 400 });
    }

    // Validate video file
    const videoValidation = validateVideoFile(videoFile);
    if (!videoValidation.valid) {
      return NextResponse.json({ error: videoValidation.error }, { status: 400 });
    }

    // Validate thumbnail if provided
    if (thumbnailFile) {
      const thumbnailValidation = validateImageFile(thumbnailFile);
      if (!thumbnailValidation.valid) {
        return NextResponse.json({ error: thumbnailValidation.error }, { status: 400 });
      }
    }

    // Get video duration
    let duration: number;
    try {
      // For server-side, we'll use a default duration and let client update it
      // In a production app, you'd use ffmpeg or similar to extract duration
      duration = 30; // Default fallback
    } catch (error) {
      console.warn('Could not extract video duration, using default:', error);
      duration = 30;
    }

    // Save video file
    const videoUpload = await saveUploadedFile(videoFile, 'videos');

    // Save thumbnail if provided
    let thumbnailUrl: string | undefined;
    if (thumbnailFile) {
      const thumbnailUpload = await saveUploadedFile(thumbnailFile, 'thumbnails');
      thumbnailUrl = thumbnailUpload.url;
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description: description || null,
        videoUrl: videoUpload.url,
        thumbnailUrl,
        duration,
        uploadedBy: session.user.id,
      },
    });

    return NextResponse.json(video, { status: 201 });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
}