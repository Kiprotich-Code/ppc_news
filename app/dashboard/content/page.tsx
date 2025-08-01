"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"
import { FileText, Plus, Eye, MousePointer, DollarSign, Share2, Facebook, Twitter, Linkedin } from "lucide-react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useRouter } from "next/navigation"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"
import { formatCurrency } from "@/lib/utils"

interface Article {
  id: string;
  title: string;
  status: string;
  publishedStatus: string;
  views: number;
  earnings: number;
  createdAt: string;
  publishedAt?: string;
}

export default function ContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [articles, setArticles] = useState<Article[]>([])
  const [statusFilter, setStatusFilter] = useState("All")
  const [publishedStatusFilter, setPublishedStatusFilter] = useState("All")
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showShareOptions, setShowShareOptions] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchArticles()
  }, [session, status, router, statusFilter, publishedStatusFilter])

  const fetchArticles = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/articles')
      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }
      const data = await response.json()
      
      // Your API returns { articles: [...] }, so we need to access data.articles
      const articlesArray = data.articles || []

      // Filter articles based on status and publishedStatus
      const filteredArticles = articlesArray.filter((article: Article) => {
        const statusMatch = statusFilter === "All" || article.status === statusFilter.toUpperCase()
        const publishedStatusMatch = publishedStatusFilter === "All" || article.publishedStatus === publishedStatusFilter.toUpperCase()
        return statusMatch && publishedStatusMatch
      })

      setArticles(filteredArticles)
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

  const toggleShareOptions = (articleId: string) => {
    setShowShareOptions(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }))
  }

  const shareOnSocialMedia = (platform: string, article: Article) => {
    const articleUrl = `${window.location.origin}/articles/${article.id}`
    const shareText = `Check out this article: ${article.title}`

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`, '_blank')
        break
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(articleUrl)}`, '_blank')
        break
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(articleUrl)}&title=${encodeURIComponent(article.title)}`, '_blank')
        break
      default:
        break
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <LoadingSpinner />
        </main>
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>
      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <div className="w-full mx-auto px-4 py-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
              <div className="flex gap-4">
                <select 
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option>All</option>
                  <option>Approved</option>
                  <option>Pending</option>
                  <option>Rejected</option>
                </select>
                <select 
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                  value={publishedStatusFilter}
                  onChange={(e) => setPublishedStatusFilter(e.target.value)}
                >
                  <option>All</option>
                  <option>Draft</option>
                  <option>Published</option>
                </select>
              </div>
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
                    <div className="flex flex-col gap-3">
                      <h3 className="text-md font-semibold text-gray-900">
                        <Link href={`/dashboard/content/${article.id}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(article.status)}`}
                        >
                          {article.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(article.publishedStatus)}`}
                        >
                          {article.publishedStatus}
                        </span>
                        <span>{formatDate(article.createdAt)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-red-600" />
                            <span>{article.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-red-600" />
                            <span>{formatCurrency(article.earnings)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {article.publishedStatus === "PUBLISHED" && (
                            <div className="relative">
                              <button 
                                onClick={() => toggleShareOptions(article.id)}
                                className="p-2 text-gray-500 hover:text-red-600"
                              >
                                <Share2 className="h-4 w-4" />
                              </button>
                              {showShareOptions[article.id] && (
                                <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-md shadow-lg z-10 py-1">
                                  <button
                                    onClick={() => shareOnSocialMedia('facebook', article)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Facebook className="h-4 w-4 mr-2 text-blue-600" />
                                    Facebook
                                  </button>
                                  <button
                                    onClick={() => shareOnSocialMedia('twitter', article)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Twitter className="h-4 w-4 mr-2 text-blue-400" />
                                    Twitter
                                  </button>
                                  <button
                                    onClick={() => shareOnSocialMedia('linkedin', article)}
                                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Linkedin className="h-4 w-4 mr-2 text-blue-700" />
                                    LinkedIn
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          <Link
                            href={`/dashboard/content/${article.id}`}
                            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                          >
                            Details
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}