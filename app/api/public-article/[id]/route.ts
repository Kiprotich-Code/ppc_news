import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Define the params type explicitly
interface RouteParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<RouteParams> }
) {
  try {
    // Resolve the params promise
    const params = await context.params;
    const { id } = params;

    const article = await prisma.article.findUnique({
      where: { id, publishedStatus: "PUBLISHED" },
      include: {
        author: { select: { name: true } },
        views: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

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
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Failed to load article" }, { status: 500 });
  }
}