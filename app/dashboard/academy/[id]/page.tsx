"use client"

import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { BookOpen, Clock, FileText, DollarSign, Lock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

interface Course {
  id: string
  title: string
  description: string
  price: number
  duration: string
  lessons: number
  isPurchased: boolean
  contentOutline: string[]
}

export default function CourseDetail() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { courseId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchCourseData()
  }, [session, status, router, courseId])

  const fetchCourseData = async () => {
    try {
      // Mock API response for course details
      const mockCourses: Course[] = [
        {
          id: "course1",
          title: "Introduction to Content Creation",
          description: "Learn the basics of creating engaging content for online platforms.",
          price: 49.99,
          duration: "5 hours",
          lessons: 10,
          isPurchased: true,
          contentOutline: [
            "Introduction to Content Creation",
            "Understanding Your Audience",
            "Crafting Compelling Headlines",
            "Writing for Digital Platforms",
            "Basic SEO Principles",
            "Creating Visual Content",
            "Publishing and Promotion",
            "Analyzing Content Performance",
            "Engaging with Your Community",
            "Final Project: Create Your First Post"
          ]
        },
        {
          id: "course2",
          title: "Advanced SEO Strategies",
          description: "Master SEO techniques to boost your content's visibility.",
          price: 79.99,
          duration: "8 hours",
          lessons: 12,
          isPurchased: false,
          contentOutline: [
            "SEO Fundamentals Recap",
            "Keyword Research Deep Dive",
            "On-Page SEO Optimization",
            "Technical SEO Essentials",
            "Link Building Strategies",
            "Local SEO Tactics",
            "Content Optimization for Search",
            "SEO Analytics and Tools",
            "Mobile SEO Best Practices",
            "Voice Search Optimization",
            "SEO Case Studies",
            "Final Project: SEO Audit"
          ]
        },
        {
          id: "course3",
          title: "Social Media Marketing",
          description: "Grow your audience using social media strategies.",
          price: 59.99,
          duration: "6 hours",
          lessons: 8,
          isPurchased: false,
          contentOutline: [
            "Introduction to Social Media Marketing",
            "Choosing the Right Platforms",
            "Creating a Content Calendar",
            "Designing Engaging Posts",
            "Social Media Advertising Basics",
            "Building Community Engagement",
            "Analytics and Performance Tracking",
            "Final Project: Social Media Campaign"
          ]
        }
      ]

      const selectedCourse = mockCourses.find((c) => c.id === courseId)
      if (selectedCourse) {
        setCourse(selectedCourse)
        if (!selectedCourse.isPurchased) {
          router.push(`/dashboard/academy/payment?courseId=${courseId}`)
          return
        }
      } else {
        router.push("/dashboard/academy")
      }
    } catch (error) {
      console.error("Error fetching course data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBuyCourse = () => {
    router.push(`/dashboard/academy/payment?courseId=${courseId}`)
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

  if (!session || !course) {
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
            <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
            <p className="text-gray-600 mt-2">{course.description}</p>
          </div>

          {/* Course Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-red-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">{course.duration}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Lessons</p>
                  <p className="text-lg font-bold text-gray-900">{course.lessons}</p>
                </div>
              </div>
              <div className="flex items-center">
                <DollarSign className="h-6 w-6 text-red-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Price</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(course.price)}</p>
                </div>
              </div>
            </div>
            {course.isPurchased ? (
              <div className="mt-4 flex items-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Purchased</span>
              </div>
            ) : (
              <button
                onClick={handleBuyCourse}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 flex items-center"
              >
                <Lock className="h-4 w-4 mr-1" />
                Buy Course
              </button>
            )}
          </div>

          {/* Course Content Outline */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
            </div>
            <div className="p-6">
              {course.contentOutline.length > 0 ? (
                <ul className="space-y-4">
                  {course.contentOutline.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <BookOpen className="h-5 w-5 text-red-600 mr-3" />
                      <span className="text-sm text-gray-900">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No content available</h3>
                  <p className="text-gray-600">This course has no content listed yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Back to Academy */}
          <div className="mt-8">
            <Link
              href="/dashboard/academy"
              className="text-red-600 hover:underline text-sm font-medium flex items-center"
            >
              <BookOpen className="h-4 w-4 mr-1" />
              Back to Academy
            </Link>
          </div>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}