import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const article = await prisma.article.findUnique({
      where: { id, publishedStatus: "PUBLISHED" },
      include: {
        author: { select: { name: true } },
        views: true,
      },
    });
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        content: article.content, // (assume HTML for now)
        publishedAt: article.publishedAt,
        authorName: article.author?.name || "Unknown",
        views: article.views.length,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load article" }, { status: 500 });
  }
}
