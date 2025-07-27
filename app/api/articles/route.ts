import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Define types for the formatted article response
interface FormattedArticle {
  id: string;
  title: string;
  content: string;
  status: string;
  images: any[]; // Adjust based on JSON.parse result, e.g., string[] or object[]
  featuredImage: string | null;
  createdAt: string;
  publishedAt: string | null;
  views: number;
  earnings: number;
}

// GET /api/articles - fetch all articles for authorized users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const articles = await prisma.article.findMany({
      where: {
        // Fetch articles based on user role
        ...(session.user.role !== "ADMIN" ? { authorId: session.user.id } : {}),
        status: session.user.role === "ADMIN" ? undefined : "APPROVED",
      },
      include: {
        views: true,
        earnings: true,
      },
    });

    const formattedArticles: FormattedArticle[] = articles.map((article: typeof articles[number]) => ({
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      images: article.images ? JSON.parse(article.images) : [], // Handle string | null
      featuredImage: article.featuredImage,
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() ?? null,
      views: article.views.length,
      earnings: article.earnings.reduce((sum: any, earning: { amount: any; }) => sum + earning.amount, 0),
    }));

    return NextResponse.json({ articles: formattedArticles });
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}