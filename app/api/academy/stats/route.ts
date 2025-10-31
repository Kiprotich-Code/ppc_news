import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

export const GET = async (_: Request) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get all stats in parallel
    const [enrolledCount, completedCount, publishedLessonsCount, totalDuration] = await Promise.all([
      prisma.courseEnrollment.count({
        where: { userId }
      }),
      prisma.courseEnrollment.count({
        where: { 
          userId,
          completedAt: { not: null }
        }
      }),
      prisma.lesson.count({
        where: {
          isPublished: true,
          section: {
            isPublished: true,
            course: {
              enrollments: {
                some: { userId }
              }
            }
          }
        }
      }),
      prisma.lesson.aggregate({
        _sum: { duration: true },
        where: {
          isPublished: true,
          section: {
            isPublished: true,
            course: {
              enrollments: {
                some: { userId }
              }
            }
          }
        }
      })
    ])

    // Format and return response
    return NextResponse.json({
      enrolledCourses: enrolledCount,
      completedCourses: completedCount,
      totalLessons: publishedLessonsCount,
      totalHours: Math.max(0, Math.floor((totalDuration._sum.duration || 0) / 3600))
    })

  } catch (error) {
    console.error("Academy stats error:", error)
    return NextResponse.json(
      { error: "Failed to fetch academy statistics" }, 
      { status: 500 }
    )
  }
}