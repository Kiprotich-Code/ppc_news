"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Course {
  id: string
  title: string
  category: {
    name: string
  }
}

interface Section {
  id: string
  title: string
  description: string
  orderIndex: number
  isPublished: boolean
  courseId: string
  lessons?: { id: string }[]
}

interface FormData {
  title: string
  description: string
  isPublished: boolean
}

export default function EditSectionPage({ 
  params 
}: { 
  params: Promise<{ id: string; sectionId: string }> 
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [section, setSection] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [courseId, setCourseId] = useState<string>("")
  const [sectionId, setSectionId] = useState<string>("")
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    isPublished: false
  })

  useEffect(() => {
    // Get the course ID and section ID from params Promise
    params.then(({ id, sectionId }) => {
      setCourseId(id)
      setSectionId(sectionId)
    })
  }, [params])

  useEffect(() => {
    if (status === "loading" || !courseId || !sectionId) return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (session.user?.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }
    fetchData()
  }, [session, status, router, courseId, sectionId])

  const fetchData = async () => {
    try {
      // Fetch course data
      const courseResponse = await fetch(`/api/admin/courses/${courseId}`)
      if (!courseResponse.ok) {
        toast.error("Failed to fetch course")
        router.push("/admin/courses")
        return
      }
      const courseData = await courseResponse.json()
      setCourse(courseData)

      // Find the section in the course data
      const sectionData = courseData.sections?.find((s: Section) => s.id === sectionId)
      if (!sectionData) {
        toast.error("Section not found")
        router.push(`/admin/courses/${courseId}`)
        return
      }

      setSection(sectionData)
      setFormData({
        title: sectionData.title,
        description: sectionData.description || "",
        isPublished: sectionData.isPublished
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch section data")
      router.push("/admin/courses")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Section title is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success("Section updated successfully")
        router.push(`/admin/courses/${courseId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update section")
      }
    } catch (error) {
      console.error("Error updating section:", error)
      toast.error("Failed to update section")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!section) return

    const confirmMessage = (section.lessons?.length ?? 0) > 0 
      ? `This section contains ${section.lessons?.length ?? 0} lesson(s). Are you sure you want to delete it? This action cannot be undone.`
      : "Are you sure you want to delete this section? This action cannot be undone."

    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections/${sectionId}`, {
        method: "DELETE"
      })

      if (response.ok) {
        toast.success("Section deleted successfully")
        router.push(`/admin/courses/${courseId}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete section")
      }
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course || !section) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Section Not Found</h1>
          <Link href="/admin/courses" className="text-blue-600 hover:text-blue-800">
            Return to Courses
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
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
      
      <div className="flex-1 ml-0 md:ml-64">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href={`/admin/courses/${course.id}`}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Section</h1>
              <p className="text-gray-600 mt-1">
                Editing section in <span className="font-medium">{course.title}</span>
              </p>
            </div>
          </div>

          {/* Breadcrumb */}
          <nav className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/admin/courses" className="hover:text-blue-600">
                Courses
              </Link>
              <span>/</span>
              <Link href={`/admin/courses/${course.id}`} className="hover:text-blue-600">
                {course.title}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Edit Section</span>
            </div>
          </nav>

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-lg font-semibold mb-4">Section Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter section title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of what this section covers"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublished"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isPublished" className="ml-2 text-sm font-medium text-gray-700">
                      Published (visible to students)
                    </label>
                  </div>
                </div>
              </div>

              {/* Section Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Section Information</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Course:</span> {course.title}</p>
                  <p><span className="font-medium">Section Order:</span> {section.orderIndex + 1}</p>
                  <p><span className="font-medium">Current Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      section.isPublished 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {section.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <LoadingSpinner /> : <Save className="w-4 h-4" />}
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
                
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </Link>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Section
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
