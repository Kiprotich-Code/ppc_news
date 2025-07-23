import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
// Admin: Moderate articles (approve/reject with note)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleId, status, note } = body;
  if (!articleId || !status) {
    return NextResponse.json({ error: 'Missing articleId or status' }, { status: 400 });
  }
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }
  const updated = await prisma.article.update({
    where: { id: articleId },
    data: {
      status,
      moderationNote: note || null,
      publishedAt: status === 'APPROVED' ? new Date() : null,
    },
  });
  return NextResponse.json({ article: updated });
}
