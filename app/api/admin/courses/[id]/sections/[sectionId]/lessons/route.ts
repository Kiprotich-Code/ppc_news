import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sectionId } = await params

    const lessons = await prisma.lesson.findMany({
      where: { sectionId },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json(lessons)
  } catch (error: any) {
    console.error('Error fetching lessons:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { 
      title, 
      description, 
      content, 
      videoUrl, 
      type, 
      duration, 
      isFreePreview 
    } = await request.json()
    const { sectionId } = await params

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!type || !["ARTICLE", "VIDEO", "PDF", "QUIZ"].includes(type)) {
      return NextResponse.json({ error: "Valid lesson type is required" }, { status: 400 })
    }

    // Get the next order index
    const lastLesson = await prisma.lesson.findFirst({
      where: { sectionId },
      orderBy: { orderIndex: 'desc' }
    })

    const orderIndex = lastLesson ? lastLesson.orderIndex + 1 : 0

    const lesson = await prisma.lesson.create({
      data: {
        title,
        description,
        content,
        videoUrl,
        type,
        duration: duration || null,
        sectionId,
        orderIndex,
        isFreePreview: isFreePreview || false,
        isPublished: true // Default to published for now
      }
    })

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error('Error creating lesson:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
