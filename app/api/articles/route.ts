import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { title, content, images } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      )
    }

    const userId = session.user.id

    const article = await prisma.article.create({
      data: {
        title,
        content,
        images: images ? JSON.stringify(images) : null,
        authorId: userId,
        status: "PENDING"
      }
    })

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        status: article.status
      }
    })
  } catch (error) {
    console.error("Article creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: any = { authorId: userId }
    if (status) {
      where.status = status
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        views: true,
        earnings: true
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const formattedArticles = articles.map(article => ({
      id: article.id,
      title: article.title,
      content: article.content,
      status: article.status,
      images: article.images ? JSON.parse(article.images) : [],
      createdAt: article.createdAt.toISOString(),
      publishedAt: article.publishedAt?.toISOString(),
      views: article.views.length,
      earnings: article.earnings.reduce((sum, earning) => sum + earning.amount, 0)
    }))

    return NextResponse.json({ articles: formattedArticles })
  } catch (error) {
    console.error("Article retrieval error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 