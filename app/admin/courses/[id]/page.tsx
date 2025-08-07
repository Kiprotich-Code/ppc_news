"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronDown,
  ChevronUp,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  Menu
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import toast from "react-hot-toast"

interface Lesson {
  id: string
  title: string
  description: string
  type: string
  duration: number
  orderIndex: number
  isFreePreview: boolean
  isPublished: boolean
}

interface Section {
  id: string
  title: string
  description: string
  orderIndex: number
  isPublished: boolean
  lessons: Lesson[]
}

interface Course {
  id: string
  title: string
  description: string
  shortDescription: string
  price: number
  isFree: boolean
  isPremium: boolean
  isPublished: boolean
  difficulty: string
  duration: string
  instructor: string
  featuredImage: string
  createdAt: string
  category: {
    id: string
    name: string
  }
  sections: Section[]
  tags: string[]
  requirements: string[]
  whatYouWillLearn: string[]
  _count: {
    enrollments: number
  }
}

export default function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isMdUp, setIsMdUp] = useState(false)
  const [courseId, setCourseId] = useState<string>("")

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

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
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchCourse()
  }, [session, status, router, courseId])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
        // Expand all sections by default
        setExpandedSections(new Set(data.sections.map((s: Section) => s.id)))
      } else {
        toast.error("Failed to fetch course")
        router.push("/admin/courses")
      }
    } catch (error) {
      console.error("Error fetching course:", error)
      toast.error("Failed to fetch course")
      router.push("/admin/courses")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSectionExpanded = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const toggleCoursePublished = async () => {
    if (!course) return

    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !course.isPublished })
      })

      if (response.ok) {
        fetchCourse()
        toast.success(`Course ${!course.isPublished ? 'published' : 'unpublished'} successfully`)
      } else {
        toast.error("Failed to update course")
      }
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("Failed to update course")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
          <Link href="/admin/courses" className="text-red-600 hover:text-red-800">
            Return to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">{course.title}</h1>
          <Link 
            href="/admin/courses"
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <AdminSidebar 
            open={sidebarOpen} 
            setOpen={setSidebarOpen}
            navItems={[
              { label: "Dashboard", href: "/admin", icon: "home" },
              { label: "Articles", href: "/admin/articles", icon: "file-text" },
              { label: "Courses", href: "/admin/courses", icon: "book-open" },
              { label: "Members", href: "/admin/members", icon: "users" },
              { label: "Withdrawals", href: "/admin/withdrawals", icon: "wallet" },
              { label: "Transactions", href: "/admin/transactions", icon: "dollar-sign" },
              { label: "Settings", href: "/admin/settings", icon: "settings" },
            ]}
          />
        </div>
        
        <main
          className="flex-1 p-4 md:p-6 pb-20 transition-all duration-300"
          style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
        >
          {/* Header */}
          <div className="hidden md:flex items-center gap-4 mb-6">
            <Link 
              href="/admin/courses"
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">{course.title}</h1>
              <p className="text-gray-600 mt-1 text-sm">Manage course content and structure</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={toggleCoursePublished}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                  course.isPublished
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {course.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </Link>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden mb-4 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={toggleCoursePublished}
                className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm ${
                  course.isPublished
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {course.isPublished ? 'Unpublish' : 'Publish'}
              </button>
              <Link
                href={`/admin/courses/${course.id}/edit`}
                className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </Link>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-red-200 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.isFree 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {course.isFree ? 'Free' : 'Premium'}
                  </span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                    {course.difficulty}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4">{course.shortDescription}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <div className="font-medium">{course.category.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <div className="font-medium">
                      {course.isFree ? 'Free' : formatCurrency(course.price)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration:</span>
                    <div className="font-medium">{course.duration || 'Not specified'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Enrollments:</span>
                    <div className="font-medium flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {course._count.enrollments}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-gray-500 text-sm">Sections:</span>
                  <div className="font-medium">{course.sections.length}</div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Total Lessons:</span>
                  <div className="font-medium">
                    {course.sections.reduce((total, section) => total + section.lessons.length, 0)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 text-sm">Created:</span>
                  <div className="font-medium">{formatDate(new Date(course.createdAt))}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Course Content</h2>
                <Link
                  href={`/admin/courses/${course.id}/sections/new`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </Link>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {course.sections.length === 0 ? (
                <div className="p-12 text-center">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                  <p className="text-gray-600 mb-4">Start building your course by adding sections and lessons.</p>
                  <Link
                    href={`/admin/courses/${course.id}/sections/new`}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add First Section
                  </Link>
                </div>
              ) : (
                course.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSectionExpanded(section.id)}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          {expandedSections.has(section.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {sectionIndex + 1}. {section.title}
                          </h3>
                          {section.description && (
                            <p className="text-gray-600 text-sm mt-1">{section.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{section.lessons.length} lesson{section.lessons.length !== 1 ? 's' : ''}</span>
                            <span className={`px-2 py-1 rounded-full ${
                              section.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {section.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/courses/${course.id}/sections/${section.id}/lessons/new`}
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Lesson
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/sections/${section.id}/edit`}
                          className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button className="p-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {expandedSections.has(section.id) && (
                      <div className="ml-8 space-y-2">
                        {section.lessons.length === 0 ? (
                          <div className="p-4 bg-gray-50 rounded-lg text-center">
                            <p className="text-gray-600 text-sm mb-2">No lessons in this section</p>
                            <Link
                              href={`/admin/courses/${course.id}/sections/${section.id}/lessons/new`}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Add the first lesson
                            </Link>
                          </div>
                        ) : (
                          section.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                                  </span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    lesson.type === 'VIDEO' ? 'bg-red-100 text-red-800' :
                                    lesson.type === 'PDF' ? 'bg-orange-100 text-orange-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {lesson.type}
                                  </span>
                                  {lesson.isFreePreview && (
                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                      Free Preview
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    lesson.isPublished 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {lesson.isPublished ? 'Published' : 'Draft'}
                                  </span>
                                </div>
                                {lesson.description && (
                                  <p className="text-gray-600 text-xs mt-1">{lesson.description}</p>
                                )}
                                {lesson.duration && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    Duration: {Math.floor(lesson.duration / 60)}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/admin/courses/${course.id}/sections/${section.id}/lessons/${lesson.id}/edit`}
                                  className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                  <Edit className="w-3 h-3" />
                                </Link>
                                <button className="p-1 text-gray-600 hover:text-red-600 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav />
      </div>
    </div>
  )
}
