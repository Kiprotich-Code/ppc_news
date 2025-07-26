import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET /api/articles/[id] - fetch single article
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const articleId = context.params.id;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        views: true,
        earnings: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Check if user is the author or admin
    if (article.authorId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formattedArticle = {
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      images: article.images ? JSON.parse(article.images as string) : [],
      featuredImage: article.featuredImage,
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      views: article.views.length,
      earnings: article.earnings.reduce((sum, earning) => sum + earning.amount, 0),
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/articles/[id]/view - increment view count and earnings if eligible
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const articleId = context.params.id;

    // Find the article and author
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    if (article.status !== "APPROVED") {
      return NextResponse.json({ error: "Article not approved" }, { status: 403 });
    }

    // Ignore views by author or admin
    if (session?.user?.id === article.authorId || session?.user?.role === "ADMIN") {
      return NextResponse.json({ message: "View not counted" }, { status: 200 });
    }

    // Get CPC from settings or use default
    let cpc = 0.05;
    const settings = await prisma.settings.findUnique({ where: { key: "CPC" } });
    if (settings && settings.value) {
      const parsed = parseFloat(settings.value);
      if (!isNaN(parsed)) cpc = parsed;
    }

    // Create view record and earning record atomically
    await prisma.$transaction([
      prisma.view.create({
        data: {
          articleId: articleId,
          userId: session?.user?.id || null,
          ipAddress: request.headers.get("x-forwarded-for") || null,
          userAgent: request.headers.get("user-agent") || null,
        },
      }),
      prisma.earning.create({
        data: {
          articleId: articleId,
          userId: article.authorId,
          amount: cpc,
          rate: cpc,
        },
      }),
    ]);

    return NextResponse.json({ message: "View counted", cpc }, { status: 200 });
  } catch (error) {
    console.error("Error incrementing article view/earnings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}