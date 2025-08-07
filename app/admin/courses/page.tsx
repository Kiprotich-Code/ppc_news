"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users,
  BookOpen,
  DollarSign,
  Eye,
  EyeOff,
  Menu
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import toast from "react-hot-toast"

interface Course {
  id: string
  title: string
  description: string
  price: number
  isFree: boolean
  isPremium: boolean
  isPublished: boolean
  difficulty: string
  createdAt: string
  category: {
    id: string
    name: string
  }
  _count: {
    sections: number
    enrollments: number
  }
}

export default function AdminCoursesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMdUp, setIsMdUp] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchCourses()
  }, [session, status, router])

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await fetch("/api/admin/courses")
      if (response.ok) {
        const data = await response.json()
        setCourses(data)
      } else {
        toast.error("Failed to fetch courses")
      }
    } catch (error) {
      console.error("Error fetching courses:", error)
      toast.error("Failed to fetch courses")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCoursePublished = async (courseId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !isPublished })
      })

      if (response.ok) {
        fetchCourses()
        toast.success(`Course ${!isPublished ? 'published' : 'unpublished'} successfully`)
      } else {
        toast.error("Failed to update course")
      }
    } catch (error) {
      console.error("Error updating course:", error)
      toast.error("Failed to update course")
    }
  }

  const deleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        fetchCourses()
        toast.success("Course deleted successfully")
      } else {
        toast.error("Failed to delete course")
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error("Failed to delete course")
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <LoadingSpinner />
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
          <h1 className="text-lg font-semibold text-gray-900">Courses</h1>
          <Link 
            href="/admin/courses/new"
            className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New
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
        
        <div
          className="flex-1 transition-all duration-300"
          style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
        >
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {/* Desktop Header */}
            <div className="hidden md:flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Course Management</h1>
                <p className="text-gray-600 mt-1 text-sm">Manage all courses and their content</p>
              </div>
              <div className="flex gap-2 mt-4 sm:mt-0">
                <Link 
                  href="/admin/courses/categories"
                  className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  Categories
                </Link>
                <Link 
                  href="/admin/courses/new"
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  New Course
                </Link>
              </div>
            </div>

            {/* Mobile Quick Actions */}
            <div className="md:hidden mb-4">
              <Link
                href="/admin/courses/categories"
                className="bg-red-600 text-white rounded-lg shadow-sm p-3 hover:bg-red-700 transition-colors flex items-center justify-between w-full mb-2"
              >
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Manage Categories</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Courses List */}
            <div className="space-y-3">
              {filteredCourses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm border border-red-200">
                  <div className="p-4">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">{course.title}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              course.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                              course.isFree 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {course.isFree ? 'Free' : 'Premium'}
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{course.description}</p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {course.category.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {course._count.enrollments}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {course.isFree ? 'Free' : formatCurrency(course.price)}
                            </span>
                            <span>{course._count.sections} sections</span>
                            <span className="hidden sm:inline">{formatDate(new Date(course.createdAt))}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleCoursePublished(course.id, course.isPublished)}
                            className={`p-1.5 rounded text-xs transition-colors ${
                              course.isPublished
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                            title={course.isPublished ? 'Unpublish' : 'Publish'}
                          >
                            {course.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                          
                          <Link
                            href={`/admin/courses/${course.id}`}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Edit Course"
                          >
                            <Edit className="w-3 h-3" />
                          </Link>
                          
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="Delete Course"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="bg-red-600 text-white px-3 py-1.5 rounded text-xs hover:bg-red-700 transition-colors"
                        >
                          Manage
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredCourses.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {searchTerm ? "No courses match your search." : "Get started by creating your first course."}
                  </p>
                  {!searchTerm && (
                    <Link 
                      href="/admin/courses/new"
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create Course
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav />
      </div>
    </div>
  )
}
