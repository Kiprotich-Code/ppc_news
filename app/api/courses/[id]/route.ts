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
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = params

    // Check if user is enrolled in this course
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: id
        }
      }
    })

    const course = await prisma.course.findUnique({
      where: { id },
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
              where: enrollment ? { isPublished: true } : { 
                AND: [
                  { isPublished: true },
                  { isFreePreview: true }
                ]
              },
              include: {
                progress: {
                  where: { userId: session.user.id }
                }
              },
              orderBy: { orderIndex: 'asc' }
            }
          },
          orderBy: { orderIndex: 'asc' }
        },
        enrollments: {
          where: { userId: session.user.id }
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

    if (!course.isPublished) {
      return NextResponse.json({ error: "Course not available" }, { status: 404 })
    }

    // Transform the data
    const totalLessons = course.sections.reduce((acc, section) => acc + section.lessons.length, 0)
    const totalDuration = course.sections.reduce((acc, section) => 
      acc + section.lessons.reduce((sectionAcc, lesson) => sectionAcc + (lesson.duration || 0), 0), 0
    )

    const transformedCourse = {
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
      tags: course.tags ? JSON.parse(course.tags) : [],
      requirements: course.requirements ? JSON.parse(course.requirements) : [],
      whatYouWillLearn: course.whatYouWillLearn ? JSON.parse(course.whatYouWillLearn) : [],
      totalLessons,
      totalDuration: Math.floor(totalDuration / 60), // Convert to minutes
      enrollmentCount: course._count.enrollments,
      rating: course.rating,
      isPurchased: course.enrollments.length > 0,
      sections: course.sections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        orderIndex: section.orderIndex,
        lessons: section.lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          duration: lesson.duration,
          orderIndex: lesson.orderIndex,
          isFreePreview: lesson.isFreePreview,
          isCompleted: lesson.progress.length > 0 ? lesson.progress[0].isCompleted : false
        }))
      })),
      createdAt: course.createdAt
    }

    return NextResponse.json(transformedCourse)
  } catch (error: any) {
    console.error('Error fetching course:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
