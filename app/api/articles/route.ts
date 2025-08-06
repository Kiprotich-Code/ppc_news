import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface FormattedArticle {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  status: string,
  publishedStatus: string,
  images: any[];
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
        ...(session.user.role !== 'ADMIN'
          ? { authorId: session.user.id } // Non-admins see only their own articles
          : {}),
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
      category: article.category,
      status: article.status,
      publishedStatus: article.publishedStatus,
      images: article.images ? JSON.parse(article.images) : [],
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

// POST /api/articles - create a new article (draft or published)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, publishedStatus, authorId, featuredImage, category } = body;

    if (publishedStatus === 'PUBLISHED' && (!title || !content || !featuredImage)) {
      return NextResponse.json({ error: 'Title, content, and featured image are required to publish' }, { status: 400 });
    }

    if (publishedStatus === 'DRAFT' && !title && !content && !featuredImage) {
      return NextResponse.json({ error: 'At least one field is required to save a draft' }, { status: 400 });
    }

    // Validate publishedStatus
    if (!['DRAFT', 'PUBLISHED'].includes(publishedStatus)) {
      return NextResponse.json({ error: 'Invalid publishedStatus' }, { status: 400 });
    }

    // Only allow authorId to be the current user
    if (authorId && authorId !== session.user.id) {
      return NextResponse.json({ error: 'Invalid author' }, { status: 403 });
    }

    const article = await prisma.article.create({
      data: {
        title: title || '', 
        content: content || '', 
        category: category || null,
        publishedStatus, 
        authorId: session.user.id,
        featuredImage: featuredImage || null,
        publishedAt: publishedStatus === 'PUBLISHED' ? new Date() : null,
      },
    });

    return NextResponse.json({ article });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}