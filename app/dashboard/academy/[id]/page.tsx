"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { tiptapToHtml, extractTextFromTipTap, isTipTapContent } from "@/lib/utils"
import { 
  BookOpen, 
  Clock, 
  PlayCircle, 
  FileText, 
  Download, 
  CheckCircle,
  User,
  Star,
  Users,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"

interface Lesson {
  id: string
  title: string
  description: string
  type: string
  duration: number
  orderIndex: number
  isFreePreview: boolean
  isCompleted: boolean
}

interface Section {
  id: string
  title: string
  description: string
  orderIndex: number
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  shortDescription: string
  featuredImage: string
  price: number
  isFree: boolean
  isPremium: boolean
  difficulty: string
  duration: string
  instructor: string
  category: {
    id: string
    name: string
  }
  tags: string[]
  requirements: string[]
  whatYouWillLearn: string[]
  totalLessons: number
  totalDuration: number
  enrollmentCount: number
  rating: number
  isPurchased: boolean
  sections: Section[]
  createdAt: string
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'reviews'>('overview')
  const [courseId, setCourseId] = useState<string>("")

  useEffect(() => {
    // Get the course ID from params Promise
    params.then(({ id }) => {
      setCourseId(id)
    })
  }, [params])

  useEffect(() => {
    if (status === "loading" || !courseId) return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchCourse()
  }, [session, status, router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/dashboard/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
      } else if (response.status === 404) {
        router.push("/dashboard/academy")
      } else {
        console.error("Failed to fetch course")
      }
    } catch (error) {
      console.error("Error fetching course:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <PlayCircle className="h-4 w-4" />
      case 'PDF':
        return <Download className="h-4 w-4" />
      case 'QUIZ':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return 'bg-green-100 text-green-800'
      case 'INTERMEDIATE':
        return 'bg-yellow-100 text-yellow-800'
      case 'ADVANCED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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

  // Redirect to academy if not purchased
  if (!course.isPurchased) {
    router.push("/dashboard/academy")
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/dashboard/academy"
                className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-gray-600 mt-1">{course.shortDescription}</p>
              </div>
            </div>
            
            {/* Course Meta */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                <User className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{course.instructor}</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{course.totalLessons} lessons</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{course.totalDuration} minutes</span>
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md shadow-sm">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{course.enrollmentCount} students</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(course.difficulty)}`}>
                {course.difficulty}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'curriculum', label: 'Curriculum' },
                { id: 'reviews', label: 'Reviews' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">About this course</h2>
                    {course.description && isTipTapContent(course.description) ? (
                      <div 
                        className="text-gray-700" 
                        dangerouslySetInnerHTML={{ __html: tiptapToHtml(course.description, "text-gray-700") }}
                      />
                    ) : (
                      <p className="text-gray-700 leading-relaxed">{course.description}</p>
                    )}
                  </div>

                  {course.whatYouWillLearn.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">What you'll learn</h2>
                      <ul className="space-y-2">
                        {course.whatYouWillLearn.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {course.requirements.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm p-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                      <ul className="space-y-2">
                        {course.requirements.map((requirement, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-gray-700">{requirement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="space-y-4">
                  {course.sections.map((section) => (
                    <div key={section.id} className="bg-white rounded-lg shadow-sm">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">{section.title}</h3>
                        {section.description && (
                          <div className="text-gray-600 text-sm mt-1">
                            {isTipTapContent(section.description) ? (
                              <div 
                                className="prose-sm" 
                                dangerouslySetInnerHTML={{ __html: tiptapToHtml(section.description, "prose-sm") }}
                              />
                            ) : (
                              <p>{section.description}</p>
                            )}
                          </div>
                        )}
                        <p className="text-gray-500 text-sm mt-2">
                          {section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {section.lessons.map((lesson) => (
                          <div key={lesson.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="text-gray-400">
                                  {getLessonIcon(lesson.type)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-gray-900">{lesson.title}</h4>
                                  {lesson.description && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {isTipTapContent(lesson.description) ? (
                                        <div className="prose prose-xs max-w-none">
                                          {extractTextFromTipTap(lesson.description)}
                                        </div>
                                      ) : (
                                        <p>{lesson.description}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {lesson.duration && (
                                  <span className="text-xs text-gray-500">
                                    {formatDuration(lesson.duration)}
                                  </span>
                                )}
                                {lesson.isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <div className="h-4 w-4 border border-gray-300 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Reviews</h2>
                  <div className="text-center py-8">
                    <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet</p>
                    <p className="text-gray-500 text-sm mt-2">Be the first to review this course!</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Progress</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Completion</span>
                      <span>0%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>0 of {course.totalLessons} lessons completed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Info</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category</span>
                    <span className="text-gray-900">{course.category.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="text-gray-900">{course.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="text-gray-900">{course.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students</span>
                    <span className="text-gray-900">{course.enrollmentCount}</span>
                  </div>
                </div>
              </div>

              {course.tags.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}