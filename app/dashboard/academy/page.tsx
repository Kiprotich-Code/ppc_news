"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { PayHeroPayment } from "@/components/PayHeroPayment"
import { BookOpen, Clock, CheckCircle, Lock, DollarSign, FileText, User } from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Course {
  id: string
  title: string
  description: string
  shortDescription: string
  price: number
  duration: string
  totalLessons: number
  isPurchased: boolean
  isFree: boolean
  isPremium: boolean
  difficulty: string
  instructor: string
  category: {
    id: string
    name: string
  }
  featuredImage: string
  enrollmentCount: number
  rating: number
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
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all')

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchAcademyData()
  }, [session, status, router, filter])

  const fetchAcademyData = async () => {
    try {
      // Fetch user stats
      const statsResponse = await fetch('/api/academy/stats')
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Fetch courses based on filter
      const coursesResponse = await fetch(`/api/dashboard/courses?filter=${filter}`)
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json()
        setCourses(coursesData)
      }
    } catch (error) {
      console.error("Error fetching academy data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyCourse = (course: Course) => {
    setSelectedCourse(course)
  setIsPaymentModalOpen(true)
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Enrolled Courses</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.enrolledCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Completed Courses</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.completedCourses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Lessons</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalLessons}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-3 md:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-6 w-6 md:h-8 md:w-8 text-red-600" />
                </div>
                <div className="ml-2 md:ml-4">
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{stats.totalHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">Available Courses</h2>
                
                {/* Filter Buttons */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                      filter === 'all'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All Courses
                  </button>
                  <button
                    onClick={() => setFilter('free')}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                      filter === 'free'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Free
                  </button>
                  <button
                    onClick={() => setFilter('premium')}
                    className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                      filter === 'premium'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Premium
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <div key={course.id} className="px-4 sm:px-6 py-3">
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-gray-900">{course.title}</h3>
                          <div className="flex flex-wrap items-center gap-1">
                            {course.isFree && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                Free
                              </span>
                            )}
                            {course.isPremium && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Premium
                              </span>
                            )}
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                              {course.difficulty}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{course.shortDescription || course.description}</p>
                        <div className="flex flex-wrap items-center mt-2 text-xs text-gray-500 gap-x-4 gap-y-1">
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {course.duration}
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-3 w-3 mr-1" />
                            {course.totalLessons} lessons
                          </div>
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {course.isFree ? 'Free' : formatCurrency(course.price)}
                          </div>
                          {course.instructor && (
                            <div className="flex items-center">
                              <User className="h-3 w-3 mr-1" />
                              {course.instructor}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end">
                        {course.isPurchased ? (
                          <Link
                            href={`/dashboard/academy/${course.id}`}
                            className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 whitespace-nowrap"
                          >
                            Continue Learning
                          </Link>
                        ) : (
                          <button
                            onClick={() => handleBuyCourse(course)}
                            className="bg-red-600 text-white px-3 py-2 rounded-md text-xs font-medium hover:bg-red-700 flex items-center whitespace-nowrap"
                            disabled={course.isFree}
                          >
                            {course.isFree ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enroll Free
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3 mr-1" />
                                Buy Course
                              </>
                            )}
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

      {/* PayHero Course Payment Modal */}
      {selectedCourse && (
        <PayHeroPayment
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false)
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