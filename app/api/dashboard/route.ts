import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user's articles with view counts and earnings
    const articles = await prisma.article.findMany({
      where: {
        authorId: userId
      },
      include: {
        views: true,
        earnings: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculate statistics
    const totalArticles = articles.length
    const totalViews = articles.reduce((sum, article) => sum + article.views.length, 0)
    const totalEarnings = articles.reduce((sum, article) => {
      return sum + article.earnings.reduce((earnSum, earning) => earnSum + earning.amount, 0)
    }, 0)
    const pendingArticles = articles.filter(article => article.status === "PENDING").length

    // Get recent articles (last 5)
    const recentArticles = articles.slice(0, 5).map(article => ({
      id: article.id,
      title: article.title,
      status: article.status,
      createdAt: article.createdAt.toISOString(),
      views: article.views.length,
      earnings: article.earnings.reduce((sum, earning) => sum + earning.amount, 0)
    }))

    return NextResponse.json({
      stats: {
        totalArticles,
        totalViews,
        totalEarnings,
        pendingArticles
      },
      recentArticles
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 