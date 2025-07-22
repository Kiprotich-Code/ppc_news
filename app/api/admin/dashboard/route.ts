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

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Get platform statistics
    const [
      totalUsers,
      totalArticles,
      pendingArticles,
      totalViews,
      totalEarnings,
      pendingWithdrawals
    ] = await Promise.all([
      prisma.user.count(),
      prisma.article.count(),
      prisma.article.count({ where: { status: "PENDING" } }),
      prisma.view.count(),
      prisma.earning.aggregate({ _sum: { amount: true } }),
      prisma.withdrawal.count({ where: { status: "PENDING" } })
    ])

    // Get pending articles with author information
    const pendingArticlesData = await prisma.article.findMany({
      where: { status: "PENDING" },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })

    const formattedPendingArticles = pendingArticlesData.map(article => ({
      id: article.id,
      title: article.title,
      authorName: article.author.name,
      createdAt: article.createdAt.toISOString()
    }))

    return NextResponse.json({
      stats: {
        totalUsers,
        totalArticles,
        pendingArticles,
        totalViews,
        totalEarnings: totalEarnings._sum.amount || 0,
        pendingWithdrawals
      },
      pendingArticles: formattedPendingArticles
    })
  } catch (error) {
    console.error("Admin dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 