import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Quick utility endpoint to update existing articles with categories
export async function POST() {
  try {
    // Update all articles without categories to have 'agriculture' category
    const updatedArticles = await prisma.article.updateMany({
      where: {
        category: null
      },
      data: {
        category: 'agriculture'
      }
    });

    return NextResponse.json({ 
      message: `Updated ${updatedArticles.count} articles with agriculture category`,
      count: updatedArticles.count 
    });
  } catch (error) {
    console.error("Error updating articles:", error);
    return NextResponse.json({ error: "Failed to update articles" }, { status: 500 });
  }
}
