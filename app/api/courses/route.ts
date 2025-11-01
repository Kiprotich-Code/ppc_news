import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"


export const dynamic = 'force-dynamic';

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') // 'all', 'free', 'premium'
    const enrolled = searchParams.get('enrolled') // 'true' to get only enrolled courses

    let whereClause: any = {
      isPublished: true
    }

    // Apply filter for free/premium courses
    if (filter === 'free') {
      whereClause.isFree = true
    } else if (filter === 'premium') {
      whereClause.isPremium = true
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        sections: {
          where: { isPublished: true },
          include: {
            lessons: {
              where: { isPublished: true },
              select: {
                id: true,
                title: true,
                type: true,
                duration: true,
                isFreePreview: true
              },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        enrollments: enrolled === 'true' ? {
          where: { userId: session.user.id }
        } : undefined,
        _count: {
          select: {
            enrollments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to include computed fields
    const transformedCourses = courses.map(course => {
      const totalLessons = course.sections.reduce((acc, section) => acc + section.lessons.length, 0)
      const totalDuration = course.sections.reduce((acc, section) => 
        acc + section.lessons.reduce((sectionAcc, lesson) => sectionAcc + (lesson.duration || 0), 0), 0
      )
      
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        shortDescription: course.shortDescription,
        featuredImage: course.featuredImage,
        price: course.price,
        isFree: course.isFree,
        isPremium: course.isPremium,
        difficulty: course.difficulty,
        duration: course.duration,
        instructor: course.instructor,
        category: course.category,
        totalLessons,
        totalDuration: Math.floor(totalDuration / 60), // Convert to minutes
        enrollmentCount: course._count.enrollments,
        rating: course.rating,
        isPurchased: enrolled === 'true' ? course.enrollments.length > 0 : false,
        createdAt: course.createdAt
      }
    })

    // If filtering for enrolled courses only, filter the results
    if (enrolled === 'true') {
      const enrolledCourses = transformedCourses.filter(course => course.isPurchased)
      return NextResponse.json(enrolledCourses)
    }

    return NextResponse.json(transformedCourses)
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
