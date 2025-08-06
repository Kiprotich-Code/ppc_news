"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Plus, Video, FileText, Upload } from "lucide-react"
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
}

interface FormData {
  title: string
  description: string
  content: string
  videoUrl: string
  type: string
  duration: number
  isFreePreview: boolean
}

export default function NewLessonPage({ 
  params 
}: { 
  params: { id: string; sectionId: string } 
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [section, setSection] = useState<Section | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    type: "ARTICLE",
    duration: 0,
    isFreePreview: false
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
    fetchData()
  }, [session, status, router, params.id, params.sectionId])

  const fetchData = async () => {
    try {
      // Fetch course data
      const courseResponse = await fetch(`/api/admin/courses/${params.id}`)
      if (!courseResponse.ok) {
        toast.error("Failed to fetch course")
        router.push("/admin/courses")
        return
      }
      const courseData = await courseResponse.json()
      setCourse(courseData)

      // Find the section in the course data
      const sectionData = courseData.sections?.find((s: Section) => s.id === params.sectionId)
      if (!sectionData) {
        toast.error("Section not found")
        router.push(`/admin/courses/${params.id}`)
        return
      }

      setSection(sectionData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to fetch course data")
      router.push("/admin/courses")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error("Lesson title is required")
      return
    }

    // Validate based on lesson type
    if (formData.type === "ARTICLE" && !formData.content.trim()) {
      toast.error("Article content is required")
      return
    }

    if (formData.type === "VIDEO" && !formData.videoUrl.trim()) {
      toast.error("Video URL is required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/courses/${params.id}/sections/${params.sectionId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const lesson = await response.json()
        toast.success("Lesson created successfully")
        router.push(`/admin/courses/${params.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create lesson")
      }
    } catch (error) {
      console.error("Error creating lesson:", error)
      toast.error("Failed to create lesson")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
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
              <h1 className="text-2xl font-bold text-gray-900">Add New Lesson</h1>
              <p className="text-gray-600 mt-1">
                Add a lesson to <span className="font-medium">{section.title}</span>
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
              <span className="text-gray-900 font-medium">New Lesson</span>
            </div>
          </nav>

          <div className="max-w-4xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-lg font-semibold mb-4">Lesson Details</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter lesson title"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lesson Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ARTICLE">📄 Article/Text</option>
                      <option value="VIDEO">🎥 Video</option>
                      <option value="PDF">📋 PDF Document</option>
                      <option value="QUIZ">❓ Quiz</option>
                    </select>
                  </div>

                  {formData.type === "VIDEO" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={Math.floor(formData.duration / 60)}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          duration: parseInt(e.target.value || "0") * 60 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  )}

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the lesson"
                      rows={2}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isFreePreview}
                        onChange={(e) => setFormData({ ...formData, isFreePreview: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Free Preview (available to non-enrolled students)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Content Based on Type */}
              <div className="bg-white p-6 rounded-lg shadow border">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  {formData.type === "ARTICLE" && <FileText className="w-5 h-5" />}
                  {formData.type === "VIDEO" && <Video className="w-5 h-5" />}
                  {formData.type === "PDF" && <Upload className="w-5 h-5" />}
                  Lesson Content
                </h2>

                {formData.type === "ARTICLE" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Article Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Write your lesson content here..."
                      rows={12}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You can use basic formatting. Rich text editor coming soon!
                    </p>
                  </div>
                )}

                {formData.type === "VIDEO" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video URL *
                      </label>
                      <input
                        type="url"
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Supports YouTube, Vimeo, or direct video file URLs
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Video Notes (Optional)
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional notes, resources, or transcript for this video..."
                        rows={6}
                      />
                    </div>
                  </div>
                )}

                {formData.type === "PDF" && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Upload PDF Document</h3>
                      <p className="text-gray-600 mb-4">File upload functionality will be implemented here</p>
                      <p className="text-sm text-gray-500">
                        For now, you can add a description and implement file upload later
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        PDF Description
                      </label>
                      <textarea
                        value={formData.content}
                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what's in this PDF document..."
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {formData.type === "QUIZ" && (
                  <div className="text-center py-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Quiz Builder</h3>
                    <p className="text-gray-600 mb-4">Quiz functionality will be implemented in a future update</p>
                    <p className="text-sm text-gray-500">
                      For now, you can create the lesson and add quiz content later
                    </p>
                  </div>
                )}
              </div>

              {/* Section Context */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Lesson Context</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><span className="font-medium">Course:</span> {course.title}</p>
                  <p><span className="font-medium">Section:</span> {section.title}</p>
                  <p><span className="font-medium">Section Order:</span> {section.orderIndex + 1}</p>
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
                  {isSubmitting ? "Creating..." : "Create Lesson"}
                </button>
                
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
