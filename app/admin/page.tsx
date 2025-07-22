"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  Users, 
  FileText, 
  Eye, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AdminStats {
  totalUsers: number
  totalArticles: number
  pendingArticles: number
  totalViews: number
  totalEarnings: number
  pendingWithdrawals: number
}

interface PendingArticle {
  id: string
  title: string
  authorName: string
  createdAt: string
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalArticles: 0,
    pendingArticles: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingWithdrawals: 0
  })
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    if (session.user.role !== "ADMIN") {
      router.push("/dashboard")
      return
    }

    fetchAdminData()
  }, [session, status, router])

  const fetchAdminData = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setPendingArticles(data.pendingArticles)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArticleAction = async (articleId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        // Refresh data
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error updating article:", error)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <LoadingSpinner />
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your platform and moderate content.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingArticles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalEarnings)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Settings className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/articles"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Articles</h3>
                <p className="text-sm text-gray-600">Review and moderate all articles</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-600">View and manage user accounts</p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Withdrawals</h3>
                <p className="text-sm text-gray-600">Process withdrawal requests</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pending Articles */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Articles</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingArticles.length > 0 ? (
              pendingArticles.map((article) => (
                <div key={article.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{article.title}</h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <span>By {article.authorName}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(new Date(article.createdAt))}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleArticleAction(article.id, "approve")}
                        className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleArticleAction(article.id, "reject")}
                        className="flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending articles</h3>
                <p className="text-gray-600">All articles have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 