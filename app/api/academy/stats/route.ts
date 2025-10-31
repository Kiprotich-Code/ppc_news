import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's enrolled courses
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { userId: session.user.id },
      include: {
        course: {
          include: {
            sections: {
              where: { isPublished: true },
              include: {
                lessons: {
                  where: { isPublished: true },
                  select: {
                    id: true,
                    duration: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate statistics
    const enrolledCourses = enrollments.length
    const completedCourses = enrollments.filter(e => e.completedAt !== null).length
    
    const totalLessons = enrollments.reduce((acc, enrollment) => {
      const courseLessons = enrollment.course.sections.reduce((sectionAcc, section) => 
        sectionAcc + section.lessons.length, 0
      )
      return acc + courseLessons
    }, 0)

    const totalHours = enrollments.reduce((acc, enrollment) => {
      const courseDuration = enrollment.course.sections.reduce((sectionAcc, section) => 
        sectionAcc + section.lessons.reduce((lessonAcc, lesson) => 
          lessonAcc + (lesson.duration || 0), 0
        ), 0
      )
      return acc + courseDuration
    }, 0)

    const stats = {
      enrolledCourses,
      completedCourses,
      totalLessons,
      totalHours: Math.floor(totalHours / 3600) // Convert to hours
    }

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('Error fetching academy stats:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
