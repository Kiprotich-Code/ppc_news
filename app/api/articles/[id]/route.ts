import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Helper function to count words from article content
function getWordCount(content: string): number {
  if (!content || typeof content !== 'string') return 0;
  
  try {
    // Try to parse as JSON (TipTap editor format)
    const parsedContent = JSON.parse(content);
    if (parsedContent && parsedContent.content) {
      let text = '';
      
      // Extract text from TipTap JSON structure
      const extractText = (node: any): void => {
        if (node.type === 'text' && node.text) {
          text += node.text + ' ';
        }
        if (node.content) {
          node.content.forEach(extractText);
        }
      };
      
      parsedContent.content.forEach(extractText);
      
      // Count words
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      return words.length;
    }
  } catch (e) {
    // If not JSON, treat as plain text
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  }
  
  return 0;
}

interface FormattedArticle {
  id: string;
  title: string;
  content: string;
  category?: string | null;
  status: string;
  publishedStatus: string;
  images: any[];
  featuredImage: string | null;
  createdAt: string;
  publishedAt: string | null;
  views: number;
  earnings: number;
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = await context; // Await the params Promise
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const article = await prisma.article.findUnique({
      where: {
        id: (await params).id, // Now safe to use after awaiting
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

    // Parse the content JSON string into an object (optional, depending on database storage)
    const parsedContent = typeof article.content === "string" ? article.content : JSON.stringify(article.content);

    const formattedArticle: FormattedArticle = {
      id: article.id,
      title: article.title,
      content: parsedContent, // Return raw JSON string
      category: article.category,
      status: article.status,
      publishedStatus: article.publishedStatus,
      images: article.images ? JSON.parse(article.images) : [],
      featuredImage: article.featuredImage,
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString() ?? null,
      views: article.views.length,
      earnings: article.earnings.reduce((sum: any, earning: { amount: any; }) => sum + earning.amount, 0),
    };

    return NextResponse.json({ article: formattedArticle });
  } catch (error) {
    console.error("Error fetching article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { params } = await context;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received update request body:', body);

    const { title, content, publishedStatus, status, featuredImage, category } = body;

    // Validate publishedStatus
    if (!['DRAFT', 'PUBLISHED'].includes(publishedStatus)) {
      return NextResponse.json({ error: "Invalid publishedStatus value" }, { status: 400 });
    }

    // Validate status if provided
    if (status && !['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate required fields for published articles
    if (publishedStatus === 'PUBLISHED') {
      if (!title || title.trim() === '') {
        return NextResponse.json({ error: "Title is required to publish" }, { status: 400 });
      }
      if (!content) {
        return NextResponse.json({ error: "Content is required to publish" }, { status: 400 });
      }
      if (!featuredImage) {
        return NextResponse.json({ error: "Featured image is required to publish" }, { status: 400 });
      }
      if (!category) {
        return NextResponse.json({ error: "Category is required to publish" }, { status: 400 });
      }

      // Check word count for published articles
      const wordCount = getWordCount(content);
      if (wordCount < 150) {
        return NextResponse.json({ 
          error: `Articles must have at least 150 words to publish. Current word count: ${wordCount}` 
        }, { status: 400 });
      }
    }

    // Validate draft requirements
    if (publishedStatus === 'DRAFT') {
      if (!title && !content && !featuredImage) {
        return NextResponse.json({ error: 'At least one field is required to save a draft' }, { status: 400 });
      }
    }

    // Verify article ownership or admin status
    const existingArticle = await prisma.article.findUnique({
      where: {
        id: (await params).id,
      },
      select: {
        authorId: true,
        publishedAt: true,
      },
    });

    if (!existingArticle) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (session.user.role !== "ADMIN" && existingArticle.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the article
    try {
      const updatedArticle = await prisma.article.update({
        where: {
          id: (await params).id,
        },
        data: {
          title: title ? title.trim() : '',
          content: content || '',
          category: category || null,
          publishedStatus: publishedStatus, // Use publishedStatus instead of status for consistency
          featuredImage: featuredImage || null,
          ...(publishedStatus === "PUBLISHED" && !existingArticle.publishedAt
            ? { publishedAt: new Date() }
            : {}),
        },
        include: {
          views: true,
          earnings: true,
        },
      });

      // Format the response similar to GET
      const formattedArticle: FormattedArticle = {
        id: updatedArticle.id,
        title: updatedArticle.title,
        content: updatedArticle.content,
        category: updatedArticle.category,
        status: updatedArticle.status,
        publishedStatus: updatedArticle.publishedStatus,
        images: updatedArticle.images ? JSON.parse(updatedArticle.images) : [],
        featuredImage: updatedArticle.featuredImage,
        createdAt: updatedArticle.createdAt.toISOString(),
        publishedAt: updatedArticle.publishedAt?.toISOString() ?? null,
        views: updatedArticle.views.length,
        earnings: updatedArticle.earnings.reduce((sum: number, earning: { amount: number }) => sum + earning.amount, 0),
      };

      return NextResponse.json({ article: formattedArticle });
    } catch (error) {
      console.error('Error in prisma update:', error);
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : "Failed to update article in database"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating article:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}