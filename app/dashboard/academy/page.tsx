"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { MpesaPayment } from "@/components/MpesaPayment"
import { BookOpen, Clock, CheckCircle, Lock, DollarSign, FileText } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Course {
  id: string
  title: string
  description: string
  price: number
  duration: string
  lessons: number
  isPurchased: boolean
}

interface AcademyStats {
  enrolledCourses: number
  completedCourses: number
  totalLessons: number
  totalHours: number
}

export default function Academy() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AcademyStats>({
    enrolledCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    totalHours: 0
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Mpesa Payment Modal State
  const [isMpesaModalOpen, setIsMpesaModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchAcademyData()
  }, [session, status, router])

  const fetchAcademyData = async () => {
    try {
      // Mock API response
      const mockStats: AcademyStats = {
        enrolledCourses: 2,
        completedCourses: 1,
        totalLessons: 15,
        totalHours: 10
      }

      const mockCourses: Course[] = [
        {
          id: "course1",
          title: "Introduction to Content Creation",
          description: "Learn the basics of creating engaging content for online platforms.",
          price: 49.99,
          duration: "5 hours",
          lessons: 10,
          isPurchased: true
        },
        {
          id: "course2",
          title: "Advanced SEO Strategies",
          description: "Master SEO techniques to boost your content's visibility.",
          price: 79.99,
          duration: "8 hours",
          lessons: 12,
          isPurchased: false
        },
        {
          id: "course3",
          title: "Social Media Marketing",
          description: "Grow your audience using social media strategies.",
          price: 59.99,
          duration: "6 hours",
          lessons: 8,
          isPurchased: false
        }
      ]

      setStats(mockStats)
      setCourses(mockCourses)
    } catch (error) {
      console.error("Error fetching academy data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyCourse = (course: Course) => {
    setSelectedCourse(course)
    setIsMpesaModalOpen(true)
  }

  const handlePaymentSuccess = () => {
    // Refresh the courses data to update purchase status
    fetchAcademyData()
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-16`}>
            <LoadingSpinner />
          </main>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main className={`flex-1 p-4 md:p-8 pb-20 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Academy
            </h1>
            <p className="text-gray-600 mt-2">
              Enhance your skills with our curated courses for content creators.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Enrolled Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.enrolledCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Courses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Available Courses</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="px-4 sm:px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                        <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 gap-y-1">
                          <div className="flex items-center mr-3">
                            <Clock className="h-4 w-4 mr-1" />
                            {course.duration}
                          </div>
                          <div className="flex items-center mr-3">
                            <FileText className="h-4 w-4 mr-1" />
                            {course.lessons} lessons
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(course.price)}
                          </div>
                        </div>
                      </div>
                      <div className="flex sm:items-center justify-end sm:space-x-4">
                        {course.isPurchased ? (
                          <Link
                            href={`/dashboard/academy/${course.id}`}
                            className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm font-medium hover:bg-red-700 whitespace-nowrap"
                          >
                            View Course
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleBuyCourse(course)}
                            className="bg-red-600 text-white px-3 py-2 sm:px-4 rounded-md text-sm font-medium hover:bg-red-700 flex items-center whitespace-nowrap"
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Buy Course
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 sm:px-6 py-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses available</h3>
                  <p className="text-gray-600 mb-4">Check back soon for new learning opportunities.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>

      {/* Mpesa Payment Modal */}
      {selectedCourse && (
        <MpesaPayment
          isOpen={isMpesaModalOpen}
          onClose={() => {
            setIsMpesaModalOpen(false)
            setSelectedCourse(null)
          }}
          amount={selectedCourse.price}
          onSuccess={handlePaymentSuccess}
          type="course_payment"
          description={`Payment for ${selectedCourse.title}`}
          courseId={selectedCourse.id}
        />
      )}
    </div>
  )
}