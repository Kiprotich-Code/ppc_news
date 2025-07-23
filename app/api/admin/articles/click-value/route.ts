import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// Admin: Set click value for article
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleId, clickValue } = body;
  if (!articleId || typeof clickValue !== 'number') {
    return NextResponse.json({ error: 'Missing articleId or clickValue' }, { status: 400 });
  }
  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { clickValue },
  });
  return NextResponse.json({ article: updated });
}
