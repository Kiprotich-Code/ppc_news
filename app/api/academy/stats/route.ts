import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"

// Type for lesson in section
interface CourseLesson {
  id: string;
  duration: number | null;
}

// Type for section in course
interface CourseSection {
  lessons: CourseLesson[];
}

// Type for course in enrollment
interface EnrolledCourse {
  sections: CourseSection[];
}

// Type for enrollment
interface CourseEnrollment {
  completedAt: Date | null;
  course: EnrolledCourse;
}

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
      const courseLessons = enrollment.course.sections.reduce((sectionAcc, section) => {
        // Type guard to ensure section has lessons array
        if (!Array.isArray(section.lessons)) return sectionAcc;
        return sectionAcc + section.lessons.length;
      }, 0);
      return acc + courseLessons;
    }, 0);

    // Calculate total duration in seconds
    const totalDurationSeconds = enrollments.reduce((acc, enrollment) => {
      const courseDuration = enrollment.course.sections.reduce((sectionAcc, section) => {
        // Ensure section has lessons array
        if (!Array.isArray(section.lessons)) return sectionAcc;
        
        return sectionAcc + section.lessons.reduce((lessonAcc, lesson) => {
          // Ensure duration is a valid number
          const duration = typeof lesson.duration === 'number' ? lesson.duration : 0;
          return lessonAcc + duration;
        }, 0);
      }, 0);
      return acc + courseDuration;
    }, 0);

    const stats = {
      enrolledCourses,
      completedCourses,
      totalLessons,
      totalHours: Math.max(0, Math.floor(totalDurationSeconds / 3600)) // Ensure non-negative hours
    };

    return NextResponse.json(stats);
  } catch (error) {
    // Log the full error for debugging
    console.error('Error fetching academy stats:', error);
    
    // Return a safe error response
    return NextResponse.json(
      { error: "Failed to fetch academy statistics" }, 
      { status: 500 }
    );
    console.error('Error fetching academy stats:', error);
    
    // Return a safe error response
    return NextResponse.json(
      { error: "Failed to fetch academy statistics" }, 
      { status: 500 }
    );
  }
}
