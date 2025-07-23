// Solution 1: Awaited params (Next.js 15+)
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    const { action } = await request.json()
    const articleId = id

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      )
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED"
    const publishedAt = action === "approve" ? new Date() : null

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: newStatus,
        publishedAt
      }
    })

    return NextResponse.json({
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        status: updatedArticle.status
      }
    })
  } catch (error) {
    console.error("Article update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = context.params;
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { action } = await request.json();
    const articleId = id;

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const newStatus = action === "approve" ? "APPROVED" : "REJECTED";
    const publishedAt = action === "approve" ? new Date() : null;

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        status: newStatus,
        publishedAt,
      },
    });

    return NextResponse.json({
      article: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        status: updatedArticle.status,
      },
    });
  } catch (error) {
    console.error("Article update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}