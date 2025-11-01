import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Admin: Boost articles (toggle/set level/expiry)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleId, isBoosted, boostLevel, boostExpiry } = body;
  if (!articleId) {
    return NextResponse.json({ error: 'Missing articleId' }, { status: 400 });
  }
  const updateData: any = {};
  if (typeof isBoosted === 'boolean') updateData.isBoosted = isBoosted;
  if (boostLevel) updateData.boostLevel = boostLevel;
  if (boostExpiry) updateData.boostExpiry = new Date(boostExpiry);
  const updated = await prisma.article.update({
    where: { id: articleId },
    data: updateData,
  });
  return NextResponse.json({ article: updated });
}
