import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        sections: {
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: { 
            enrollments: true 
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Parse JSON fields
    const courseWithParsedFields = {
      ...course,
      tags: course.tags ? JSON.parse(course.tags) : [],
      requirements: course.requirements ? JSON.parse(course.requirements) : [],
      whatYouWillLearn: course.whatYouWillLearn ? JSON.parse(course.whatYouWillLearn) : []
    }

    return NextResponse.json(courseWithParsedFields)
  } catch (error: any) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id } = params

    // Extract updateable fields
    const updateData: any = {}
    
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId
    if (body.price !== undefined) updateData.price = body.price
    if (body.isFree !== undefined) updateData.isFree = body.isFree
    if (body.isPremium !== undefined) updateData.isPremium = body.isPremium
    if (body.isPublished !== undefined) updateData.isPublished = body.isPublished
    if (body.difficulty !== undefined) updateData.difficulty = body.difficulty
    if (body.duration !== undefined) updateData.duration = body.duration
    if (body.instructor !== undefined) updateData.instructor = body.instructor
    if (body.featuredImage !== undefined) updateData.featuredImage = body.featuredImage
    
    // Handle JSON fields
    if (body.tags !== undefined) updateData.tags = JSON.stringify(body.tags)
    if (body.requirements !== undefined) updateData.requirements = JSON.stringify(body.requirements)
    if (body.whatYouWillLearn !== undefined) updateData.whatYouWillLearn = JSON.stringify(body.whatYouWillLearn)

    // Generate new slug if title changed
    if (body.title !== undefined) {
      updateData.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        _count: {
          select: { 
            sections: true,
            enrollments: true 
          }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error: any) {
    console.error('Error updating course:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Course slug already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if course has enrollments
    const courseWithEnrollments = await prisma.course.findUnique({
      where: { id },
      include: { _count: { select: { enrollments: true } } }
    })

    if (!courseWithEnrollments) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (courseWithEnrollments._count.enrollments > 0) {
      return NextResponse.json({ 
        error: "Cannot delete course with existing enrollments" 
      }, { status: 400 })
    }

    // Delete course (sections and lessons will be deleted via cascade)
    await prisma.course.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Course deleted successfully" })
  } catch (error: any) {
    console.error('Error deleting course:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
