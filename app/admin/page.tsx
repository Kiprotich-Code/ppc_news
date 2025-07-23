"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/Sidebar"
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
  // ...existing code...
}

interface PendingArticle {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
}

const AdminPage = () => {
  interface SessionUser {
    id: string;
    email: string;
    name: string;
    role: string;
    image?: string;
  }
  
  interface SessionData {
    user: SessionUser;
    // add other session properties if needed
  }
  
  const { data: session, status } = useSession() as { data: SessionData | null, status: string };
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex">
        <Sidebar
          open={false}
          setOpen={() => {}}
          userImage={session?.user?.image}
          userName={session?.user?.name}
        />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== "ADMIN") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex">
      <Sidebar userImage={session.user.image} userName={session.user.name} open={false} setOpen={() => {}} />
      <main className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your platform and moderate content.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalArticles ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Articles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingArticles ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalViews?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalEarnings ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Withdrawals</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingWithdrawals ?? 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/admin/articles"
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-white" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Manage Articles</h3>
                <p className="text-sm">Review and moderate all articles</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/members"
            className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <Users className="h-8 w-8 text-white" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Manage Members</h3>
                <p className="text-sm">View and manage user accounts</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/withdrawals"
            className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-white" />
              <div className="ml-4">
                <h3 className="text-lg font-semibold">Withdrawals</h3>
                <p className="text-sm">Process withdrawal requests</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Pending Articles */}
        <div className="bg-white rounded-lg shadow">
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
      </main>
    </div>
  )
}

export default AdminPage