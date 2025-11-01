import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Admin: Boost articles (toggle/set level/expiry)
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { articleId, isBoosted, boostLevel, boostExpiry } = body;

    if (!articleId) {
      return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
    }

    // Check if article exists
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (typeof isBoosted === 'boolean') updateData.isBoosted = isBoosted;
    if (boostLevel !== undefined) updateData.boostLevel = boostLevel;
    if (boostExpiry) updateData.boostExpiry = new Date(boostExpiry);

    // Update article
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: updateData,
    });

    return NextResponse.json({ article: updated });
  } catch (error) {
    console.error('Article boost error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}