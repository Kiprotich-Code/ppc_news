import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();
    if (!articleId) {
      return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || null;
    const userAgent = request.headers.get("user-agent") || null;

    // Try to get userId from session (optional, for signed-in users)
    let userId = null;
    // (Session extraction logic can be added if needed)

    // Create view
    const view = await prisma.view.create({
      data: {
        articleId,
        ipAddress: ip,
        userAgent,
        userId,
      },
    });

    // Find article and add earning for the author
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true },
    });
    if (article) {
      // Get click value or default
      const clickValue = article.clickValue || 0.01;
      await prisma.earning.create({
        data: {
          articleId,
          userId: article.authorId,
          amount: clickValue,
          rate: clickValue,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
