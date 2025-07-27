import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      include: {
        author: {
          select: { name: true, email: true }
        },
        views: true,
        earnings: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    type ArticleWithExtras = typeof articles[number];

    const formattedArticles = articles.map((article: ArticleWithExtras) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      images: article.images ? JSON.parse(article.images) : [],
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      author: article.author,
      views: article.views.length,
      earnings: article.earnings.reduce((sum: any, earning: { amount: any; }) => sum + earning.amount, 0)
    }));

    return NextResponse.json({ articles: formattedArticles });
  } catch (error) {
    console.error("Admin article retrieval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 