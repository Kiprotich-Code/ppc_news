import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    console.log("=== SESSION DEBUG ===")
    console.log("Session:", session)
    console.log("User role:", session?.user?.role)
    console.log("====================")

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      console.log("User role is not ADMIN:", session.user.role)
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

    // Debug: Check all articles and their statuses
    const allArticles = await prisma.article.findMany({
      select: { id: true, title: true, status: true, publishedStatus: true }
    })
    console.log("=== ALL ARTICLES DEBUG ===")
    console.log("Total articles found:", allArticles.length)
    console.log("Articles:", allArticles)

    // Check status distribution
    const statusCounts = await prisma.article.groupBy({
      by: ['status'],
      _count: { status: true }
    })
    console.log("Status distribution:", statusCounts)
    console.log("==========================")

    // Get pending articles with author information
    const pendingArticlesData = await prisma.article.findMany({
      where: { status: "PENDING" },
      include: {
        author: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 1000
    })

    const formattedPendingArticles = pendingArticlesData.map((article: { id: any; title: any; author: { name: any }; createdAt: { toISOString: () => any } }) => ({
      id: article.id,
      title: article.title,
      authorName: article.author.name,
      createdAt: article.createdAt.toISOString()
    }))

    const responseData = {
      stats: {
        totalUsers,
        totalArticles,
        pendingArticles,
        totalViews,
        totalEarnings: totalEarnings._sum.amount || 0,
        pendingWithdrawals
      },
      pendingArticles: formattedPendingArticles
    }

    console.log("=== ADMIN DASHBOARD DEBUG ===")
    console.log("Stats:", responseData.stats)
    console.log("Pending articles count:", formattedPendingArticles.length)
    console.log("Raw pending articles data:", pendingArticlesData)
    console.log("=============================")

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Admin dashboard API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 