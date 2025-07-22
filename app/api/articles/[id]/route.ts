import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// POST /api/articles/[id]/view - increment view count and earnings if eligible
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const articleId = params.id;

    // Find the article and author
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true }
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

    // Increment view count and earnings atomically
    await prisma.article.update({
      where: { id: articleId },
      data: {
        views: { increment: 1 },
        earnings: { increment: cpc }
      }
    });
    await prisma.user.update({
      where: { id: article.authorId },
      data: {
        earnings: { increment: cpc }
      }
    });

    return NextResponse.json({ message: "View counted", cpc }, { status: 200 });
  } catch (error) {
    console.error("Error incrementing article view/earnings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
