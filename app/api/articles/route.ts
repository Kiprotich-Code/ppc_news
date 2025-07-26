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

    const { title, subTitle, content, images, featuredImage, status } = await request.json()

    // Validation
    if (status === 'PUBLISHED' || status === 'PENDING') {
      if (!title || !content || !featuredImage) {
        return NextResponse.json(
          { error: "Title, content, and featured image are required to publish" },
          { status: 400 }
        )
      }
    } else if (status === 'DRAFT') {
      if (!title && !content && !featuredImage) {
        return NextResponse.json(
          { error: "Please enter at least one field to save a draft." },
          { status: 400 }
        )
      }
    }

    const userId = session.user.id

    const article = await prisma.article.create({
      data: {
        title: title || '',
        content: JSON.stringify(content) || '',
        images: images ? JSON.stringify(images) : null,
        featuredImage: featuredImage || null,
        authorId: userId,
        status: status || 'DRAFT',
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

    const where: Record<string, unknown> = { authorId: userId }
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
      images: article.images ? JSON.parse(article.images as string) : [],
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