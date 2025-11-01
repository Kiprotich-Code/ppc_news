import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Use the same filtering logic as /api/articles
    const articles = await prisma.article.findMany({
      where: {
        ...(session.user.role !== 'ADMIN'
          ? { authorId: session.user.id } 
          : {}),
      },
      include: {
        views: true,
        earnings: true,
        author: true 
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Calculate statistics
    const totalArticles = articles.length
    const totalViews = articles.reduce((sum, article) => sum + article.views.length, 0)
    const articleEarnings = articles.reduce((sum, article) => {
      return sum + article.earnings.reduce((earnSum, earning) => earnSum + earning.amount, 0)
    }, 0)
    const pendingArticles = articles.filter(article => article.status === "PENDING").length

    // Get referral earnings from wallet (wallet earnings that aren't from article views)
    let referralEarnings = 0
    const wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } })
    
    if (wallet) {
      // Calculate what's already been transferred from earnings
      const transferredEarnings = await prisma.transaction.aggregate({
        where: { 
          userId: session.user.id,
          type: 'transfer',
          status: 'COMPLETED',
          description: 'Transfer earnings to wallet'
        },
        _sum: { amount: true }
      });
      
      const alreadyTransferred = transferredEarnings._sum.amount || 0;
      const availableArticleEarnings = Math.max(0, articleEarnings - alreadyTransferred);
      
      // Referral earnings = remaining wallet earnings after accounting for article earnings
      // After a transfer, wallet.earnings should be 0, so this will correctly show 0
      referralEarnings = Math.max(0, wallet.earnings - availableArticleEarnings);
    }
    
    const totalEarnings = articleEarnings + referralEarnings

    // Get recent articles (last 5) with author names
    const recentArticles = articles.slice(0, 5).map(article => ({
      id: article.id,
      title: article.title,
      status: article.status,
      createdAt: article.createdAt.toISOString(),
      views: article.views.length,
      earnings: article.earnings.reduce((sum, earning) => sum + earning.amount, 0),
      authorName: article.author?.name || 'Unknown' // Include author name
    }))

    return NextResponse.json({
      stats: {
        totalArticles,
        totalViews,
        totalEarnings,
        pendingArticles,
        referralEarnings // Add referral earnings to response
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