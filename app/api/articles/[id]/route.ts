import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateHTML } from "@tiptap/html/server"; // Use server version
import defaultExtensions from "@tiptap/starter-kit";

interface FormattedArticle {
  id: string;
  title: string;
  content: string;
  status: string;
  images: any[];
  featuredImage: string | null;
  createdAt: string;
  publishedAt: string | null;
  views: number;
  earnings: number;
}

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const { params } = context;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: {
        id: params.id,
        ...(session.user.role !== "ADMIN" ? { authorId: session.user.id } : {}),
      },
      include: {
        views: true,
        earnings: true,
      },
    });

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    // Parse the content JSON string into an object
    const parsedContent = typeof article.content === "string" ? JSON.parse(article.content) : article.content;

    // Generate HTML using TipTap (server version)
    const htmlContent = generateHTML(parsedContent, [defaultExtensions]);

    const formattedArticle: FormattedArticle = {
      id: article.id,
      title: article.title,
      content: htmlContent, // Content is now HTML
      status: article.status,
      images: article.images ? JSON.parse(article.images) : [],
      featuredImage: article.featuredImage,
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() ?? null,
      views: article.views.length,
      earnings: article.earnings.reduce((sum, earning) => sum + earning.amount, 0),
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}