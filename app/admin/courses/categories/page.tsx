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
  FolderOpen,
  Menu,
  X,
  Save
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import toast from "react-hot-toast"

interface Category {
  id: string
  name: string
  description: string
  createdAt: string
  _count: {
    courses: number
  }
}

export default function CourseCategoriesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMdUp, setIsMdUp] = useState(false)
  
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  })
  
  const [editCategory, setEditCategory] = useState({
    name: "",
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
    fetchCategories()
  }, [session, status, router])

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

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

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const response = await fetch("/api/admin/courses/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCategory)
      })

      if (response.ok) {
        toast.success("Category created successfully")
        setNewCategory({ name: "", description: "" })
        setIsCreating(false)
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to create category")
      }
    } catch (error) {
      console.error("Error creating category:", error)
      toast.error("Failed to create category")
    }
  }

  const updateCategory = async (categoryId: string) => {
    if (!editCategory.name.trim()) {
      toast.error("Category name is required")
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/categories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: categoryId,
          ...editCategory
        })
      })

      if (response.ok) {
        toast.success("Category updated successfully")
        setEditingId(null)
        setEditCategory({ name: "", description: "" })
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to update category")
      }
    } catch (error) {
      console.error("Error updating category:", error)
      toast.error("Failed to update category")
    }
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/courses/categories`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: categoryId })
      })

      if (response.ok) {
        toast.success("Category deleted successfully")
        fetchCategories()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to delete category")
      }
    } catch (error) {
      console.error("Error deleting category:", error)
      toast.error("Failed to delete category")
    }
  }

  const startEdit = (category: Category) => {
    setEditingId(category.id)
    setEditCategory({
      name: category.name,
      description: category.description
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditCategory({ name: "", description: "" })
  }

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
          <h1 className="text-lg font-semibold text-gray-900">Categories</h1>
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
          <div className="p-4 md:p-6 pb-20 md:pb-6">
            {/* Desktop Header */}
            <div className="hidden md:flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/courses"
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Course Categories</h1>
                  <p className="text-gray-600 text-sm">Manage course categories and organization</p>
                </div>
              </div>
            </div>

            {/* New Category Form */}
            <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isCreating ? "Create New Category" : "Categories"}
                </h2>
                <button
                  onClick={() => setIsCreating(!isCreating)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  {isCreating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {isCreating ? "Cancel" : "New Category"}
                </button>
              </div>

              {isCreating && (
                <form onSubmit={createCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                      placeholder="Enter category name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                      placeholder="Enter category description"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Create Category
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="bg-white rounded-lg shadow-sm border border-red-200">
                  <div className="p-4">
                    {editingId === category.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); updateCategory(category.id); }} className="space-y-3">
                        <div>
                          <input
                            type="text"
                            value={editCategory.name}
                            onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium"
                            required
                          />
                        </div>
                        <div>
                          <textarea
                            value={editCategory.description}
                            onChange={(e) => setEditCategory(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none text-sm"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                          >
                            Save
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                              {category.name}
                            </h3>
                            {category.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {category.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                              <span className="flex items-center gap-1">
                                <FolderOpen className="w-3 h-3" />
                                {category._count.courses} courses
                              </span>
                              <span className="hidden sm:inline">
                                Created {formatDate(new Date(category.createdAt))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="Edit Category"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="Delete Category"
                            disabled={category._count.courses > 0}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {categories.length === 0 && (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Create your first category to organize courses.
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Create Category
                  </button>
                </div>
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
