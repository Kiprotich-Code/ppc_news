import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

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

    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' }
        },
        course: {
          select: {
            id: true,
            title: true,
            category: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Error fetching section:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, isPublished } = await request.json()
    const { sectionId } = await params

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const section = await prisma.courseSection.update({
      where: { id: sectionId },
      data: {
        title,
        description,
        isPublished: isPublished !== undefined ? isPublished : undefined
      },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Error updating section:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sectionId } = await params

    // Check if section exists and get lesson count
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: { lessons: true }
        }
      }
    })

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }

    // Delete the section (lessons will be deleted via cascade)
    await prisma.courseSection.delete({
      where: { id: sectionId }
    })

    return NextResponse.json({ 
      message: "Section deleted successfully",
      deletedLessons: section._count.lessons
    })
  } catch (error: any) {
    console.error('Error deleting section:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: "Section not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
