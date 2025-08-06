"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"

interface Course {
  id: string
  title: string
  category: {
    name: string
  }
}

interface FormData {
  title: string
  description: string
}

export default function NewSectionPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: ""
  })

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
    fetchCourse()
  }, [session, status, router, params.id])

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/admin/courses/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setCourse(data)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Section title is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/courses/${params.id}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const section = await response.json()
        toast.success("Section created successfully")
        router.push(`/admin/courses/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create section")
      }
    } catch (error) {
      console.error("Error creating section:", error)
      toast.error("Failed to create section")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h1>
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
              <h1 className="text-2xl font-bold text-gray-900">Add New Section</h1>
              <p className="text-gray-600 mt-1">
                Add a section to <span className="font-medium">{course.title}</span>
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
              <span className="text-gray-900 font-medium">New Section</span>
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
                      placeholder="Enter section title (e.g., Introduction, Advanced Techniques)"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be displayed as a chapter or module heading
                    </p>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Optional description to help students understand the section content
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Context Info */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Course Information</h3>
                <div className="text-sm text-blue-800">
                  <p><span className="font-medium">Course:</span> {course.title}</p>
                  <p><span className="font-medium">Category:</span> {course.category.name}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? <LoadingSpinner /> : <Plus className="w-4 h-4" />}
                  {isSubmitting ? "Creating..." : "Create Section"}
                </button>
                
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </Link>
              </div>

              {/* Help Text */}
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">💡 Tips for Creating Sections</h3>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Use clear, descriptive titles that outline the learning progression</li>
                  <li>• Consider logical grouping of related lessons</li>
                  <li>• Each section should have a clear learning objective</li>
                  <li>• After creating the section, you can add lessons to it</li>
                </ul>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
