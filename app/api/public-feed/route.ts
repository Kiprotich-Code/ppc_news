import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const articles = await prisma.article.findMany({
      where: { 
        publishedStatus: "PUBLISHED",
        status: "APPROVED"
      },
      orderBy: { publishedAt: "desc" },
      include: {
        author: { select: { name: true } },
        views: true,
      },
    });
    const formatted = articles.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      category: a.category,
      status: a.status,
      publishedStatus: a.publishedStatus,
      publishedAt: a.publishedAt,
      featuredImage: a.featuredImage,
      authorName: a.author?.name || "Unknown",
      views: a.views.length,
    }));
    return NextResponse.json({ articles: formatted });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load articles" }, { status: 500 });
  }
}
