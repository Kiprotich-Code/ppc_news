import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get articles published in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentArticles = await prisma.article.findMany({
      where: { 
        publishedStatus: "PUBLISHED",
        status: "APPROVED",
        publishedAt: {
          gte: twentyFourHoursAgo
        }
      },
      orderBy: { publishedAt: "desc" },
      take: 5, // Limit to 5 most recent
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
        }
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
      articleId: article.id
    }));

    return NextResponse.json({ articles: formatted });
  } catch (error) {
    console.error("Error fetching recent articles:", error);
    return NextResponse.json({ error: "Failed to load recent articles" }, { status: 500 });
  }
}
