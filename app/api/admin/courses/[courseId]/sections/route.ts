import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId } = params

    const sections = await prisma.courseSection.findMany({
      where: { courseId },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    })

    return NextResponse.json(sections)
  } catch (error: any) {
    console.error('Error fetching sections:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description } = await request.json()
    const { courseId } = params

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Get the next order index
    const lastSection = await prisma.courseSection.findFirst({
      where: { courseId },
      orderBy: { orderIndex: 'desc' }
    })

    const orderIndex = lastSection ? lastSection.orderIndex + 1 : 0

    const section = await prisma.courseSection.create({
      data: {
        title,
        description,
        courseId,
        orderIndex
      },
      include: {
        lessons: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    })

    return NextResponse.json(section)
  } catch (error: any) {
    console.error('Error creating section:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
