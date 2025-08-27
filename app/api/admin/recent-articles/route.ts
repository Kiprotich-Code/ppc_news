import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the last 10 published articles with author info
    const recentArticles = await prisma.article.findMany({
      where: { 
        publishedStatus: "PUBLISHED",
        status: "APPROVED"
      },
      orderBy: { publishedAt: "desc" },
      take: 10,
      include: {
        author: { 
          select: { 
            name: true,
            username: true,
            profile: {
              select: {
                profileImage: true
              }
            }
          } 
        },
        views: true
      },
    });

    const formatted = recentArticles.map((article) => ({
      id: article.id,
      title: article.title,
      category: article.category,
      publishedAt: article.publishedAt,
      authorName: article.author?.name || "Unknown Author",
      authorUsername: article.author?.username || "unknown",
      authorImage: article.author?.profile?.profileImage || null,
      viewCount: article.views.length,
      featuredImage: article.featuredImage
    }));

    return NextResponse.json({ articles: formatted });
  } catch (error) {
    console.error("Error fetching test articles:", error);
    return NextResponse.json({ error: "Failed to load articles" }, { status: 500 });
  }
}
