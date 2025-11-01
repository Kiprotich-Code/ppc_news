import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const categories = await prisma.courseCategory.findMany({
      include: {
        _count: {
          select: { courses: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching course categories:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const category = await prisma.courseCategory.create({
      data: {
        name,
        description,
        slug
      }
    })

    return NextResponse.json(category)
  } catch (error: any) {
    console.error('Error creating course category:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Category name or slug already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
