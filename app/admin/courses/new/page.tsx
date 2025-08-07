"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft, Save, X, Upload, Menu, Plus } from "lucide-react"
import Link from "next/link"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import toast from "react-hot-toast"
import { CourseCategory } from "@prisma/client"

interface Category {
  id: string
  name: string
}


interface FormData {
  title: string
  description: string
  shortDescription: string
  categoryId: string
  price: number
  isFree: boolean
  isPremium: boolean
  difficulty: string
  duration: string
  instructor: string
  tags: string[]
  requirements: string[]
  whatYouWillLearn: string[]
}

export default function NewCoursePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    shortDescription: "",
    categoryId: "",
    price: 0,
    isFree: false,
    isPremium: true,
    difficulty: "BEGINNER",
    duration: "",
    instructor: "",
    tags: [],
    requirements: [],
    whatYouWillLearn: []
  })
  
  const [newTag, setNewTag] = useState("")
  const [newRequirement, setNewRequirement] = useState("")
  const [newLearningOutcome, setNewLearningOutcome] = useState("")

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
    fetchCategories()
  }, [session, status, router])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/courses/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        toast.error("Failed to fetch categories")
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast.error("Failed to fetch categories")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.categoryId) {
      toast.error("Title and category are required")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const course = await response.json()
        toast.success("Course created successfully")
        router.push(`/admin/courses/${course.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create course")
      }
    } catch (error) {
      console.error("Error creating course:", error)
      toast.error("Failed to create course")
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      setFormData({
        ...formData,
        requirements: [...formData.requirements, newRequirement.trim()]
      })
      setNewRequirement("")
    }
  }

  const removeRequirement = (reqToRemove: string) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter(req => req !== reqToRemove)
    })
  }

  const addLearningOutcome = () => {
    if (newLearningOutcome.trim() && !formData.whatYouWillLearn.includes(newLearningOutcome.trim())) {
      setFormData({
        ...formData,
        whatYouWillLearn: [...formData.whatYouWillLearn, newLearningOutcome.trim()]
      })
      setNewLearningOutcome("")
    }
  }

  const removeLearningOutcome = (outcomeToRemove: string) => {
    setFormData({
      ...formData,
      whatYouWillLearn: formData.whatYouWillLearn.filter(outcome => outcome !== outcomeToRemove)
    })
  }

  // Hook to detect if screen is md or up
  function useIsMdUp() {
    const [isMdUp, setIsMdUp] = useState(false)
    useEffect(() => {
      const media = window.matchMedia("(min-width: 768px)")
      const listener = () => setIsMdUp(media.matches)
      listener()
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }, [])
    return isMdUp
  }

  const isMdUp = useIsMdUp()

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
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
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href="/admin/courses"
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            <p className="text-gray-600 mt-1">Set up a new course with all its details</p>
          </div>
        </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter course title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 4 weeks, 20 hours"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Instructor name"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description for course cards"
                  rows={2}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Detailed course description"
                  rows={5}
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">Pricing</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isFree}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        isFree: e.target.checked,
                        price: e.target.checked ? 0 : formData.price
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Free Course</span>
                  </label>
                </div>

                {!formData.isFree && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (KES)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">Tags</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a tag"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Requirements Section */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">Prerequisites</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a prerequisite"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {formData.requirements.length > 0 && (
                  <ul className="space-y-2">
                    {formData.requirements.map((req, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{req}</span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(req)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Learning Outcomes Section */}
            <div className="bg-white p-6 rounded-lg shadow border">
              <h2 className="text-lg font-semibold mb-4">What You'll Learn</h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLearningOutcome}
                    onChange={(e) => setNewLearningOutcome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningOutcome())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a learning outcome"
                  />
                  <button
                    type="button"
                    onClick={addLearningOutcome}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                {formData.whatYouWillLearn.length > 0 && (
                  <ul className="space-y-2">
                    {formData.whatYouWillLearn.map((outcome, index) => (
                      <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{outcome}</span>
                        <button
                          type="button"
                          onClick={() => removeLearningOutcome(outcome)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? <LoadingSpinner /> : <Plus className="w-4 h-4" />}
                {isSubmitting ? "Creating..." : "Create Course"}
              </button>
              
              <Link
                href="/admin/courses"
                className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </main>

        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <AdminMobileNav />
        </div>
      </div>
    )
  }
