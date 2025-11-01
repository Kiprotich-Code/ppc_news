import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      include: {
        category: true,
        _count: {
          select: { 
            sections: true,
            enrollments: true 
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(courses)
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      shortDescription,
      categoryId,
      price,
      isFree,
      isPremium,
      difficulty,
      duration,
      tags,
      requirements,
      whatYouWillLearn,
      instructor
    } = body

    if (!title || !categoryId) {
      return NextResponse.json({ 
        error: "Title and category are required" 
      }, { status: 400 })
    }

    // Generate slug from title
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const course = await prisma.course.create({
      data: {
        title,
        description,
        shortDescription,
        categoryId,
        price: isFree ? 0 : (price || 0),
        isFree: isFree || false,
        isPremium: isPremium !== false,
        difficulty: difficulty || 'BEGINNER',
        duration,
        tags: tags ? JSON.stringify(tags) : null,
        requirements: requirements ? JSON.stringify(requirements) : null,
        whatYouWillLearn: whatYouWillLearn ? JSON.stringify(whatYouWillLearn) : null,
        instructor,
        slug
      },
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
    console.error('Error creating course:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Course slug already exists" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
