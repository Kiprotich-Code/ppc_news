import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = await params

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        section: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error('Error fetching lesson:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
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
      isFreePreview,
      isPublished 
    } = await request.json()
    const { lessonId } = await params

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (type && !["ARTICLE", "VIDEO", "PDF", "QUIZ"].includes(type)) {
      return NextResponse.json({ error: "Valid lesson type is required" }, { status: 400 })
    }

    const lesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        title,
        description,
        content,
        videoUrl,
        type,
        duration: duration || null,
        isFreePreview: isFreePreview !== undefined ? isFreePreview : undefined,
        isPublished: isPublished !== undefined ? isPublished : undefined
      }
    })

    return NextResponse.json(lesson)
  } catch (error: any) {
    console.error('Error updating lesson:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = await params

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: { id: lessonId }
    })

    return NextResponse.json({ 
      message: "Lesson deleted successfully"
    })
  } catch (error: any) {
    console.error('Error deleting lesson:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
