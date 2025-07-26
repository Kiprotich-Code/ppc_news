"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"
import { FileText, Plus, Eye, MousePointer, Share2, MessageCircle } from "lucide-react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useRouter } from "next/navigation"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"

interface Article {
  id: string;
  title: string;
  status: string;
  views: number;
  earnings: number;
  createdAt: string;
  publishedAt?: string;
  featuredImage?: string;
}

export default function ContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [statusFilter, setStatusFilter] = useState("All")
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchArticles()
  }, [session, status, router, statusFilter])

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const url = statusFilter === "All" 
        ? "/api/articles" 
        : `/api/articles?status=${statusFilter.toUpperCase()}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error("Failed to fetch articles")
      }
      
      const data = await response.json()
      setArticles(data.articles || [])
    } catch (error) {
      console.error("Error fetching articles:", error)
      setArticles([])
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h`
    if (diffInHours < 48) return "1d"
    return `${Math.floor(diffInHours / 24)}d`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <LoadingSpinner />
        </main>
        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>
      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <div className="w-full mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
              <select 
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Approved</option>
                <option>Pending</option>
                <option>Rejected</option>
                <option>Draft</option>
              </select>
            </div>
            {articles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h2>
                <p className="text-gray-600 mb-4">You haven't published any articles yet.</p>
                <Link
                  href="/dashboard/articles/new"
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  <Plus className="h-4 w-4" />
                  Create New Article
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {articles.map((article) => (
                  <div key={article.id} className="p-4 hover:bg-gray-50">
                    <div className="flex gap-4 mb-3">
                      <img
                        src={article.featuredImage || "/uploads/1753455972866-712433807-download.png"}
                        alt={article.title}
                        className="w-32 h-24 md:w-20 md:h-16 object-cover rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-md font-semibold text-gray-900 mb-2">
                          <Link href={`/dashboard/content/${article.id}`} className="hover:underline">
                            {article.title}
                          </Link>
                        </h3>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(article.status)}`}
                          >
                            {article.status}
                          </span>
                          <span>{formatDate(article.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{article.views.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MousePointer className="h-4 w-4" />
                          <span>${article.earnings.toFixed(2)}</span>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/content/${article.id}`}
                        className="text-red-600 text-sm hover:underline"
                      >
                        See More &gt;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}