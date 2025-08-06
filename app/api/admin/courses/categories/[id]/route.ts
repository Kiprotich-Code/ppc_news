import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()
    const { id } = params

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const category = await prisma.courseCategory.update({
      where: { id },
      data: {
        name,
        description,
        slug
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error updating course category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category name or slug already exists" }, { status: 400 })
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

    // Check if category has courses
    const categoryWithCourses = await prisma.courseCategory.findUnique({
      where: { id },
      include: { _count: { select: { courses: true } } }
    })

    if (!categoryWithCourses) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    if (categoryWithCourses._count.courses > 0) {
      return NextResponse.json({ 
        error: "Cannot delete category with existing courses" 
      }, { status: 400 })
    }

    await prisma.courseCategory.delete({
      where: { id }
    })

    return NextResponse.json({ message: "Category deleted successfully" })
  } catch (error: any) {
    console.error('Error deleting course category:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
