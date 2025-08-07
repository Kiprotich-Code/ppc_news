"use client"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminSidebar, SIDEBAR_WIDTH_OPEN, SIDEBAR_WIDTH_CLOSED } from "@/components/AdminSidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  Users, 
  FileText, 
  Eye, 
  DollarSign, 
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  Menu
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AdminMobileNav } from "@/components/AdminMobileNav"
import { signOut } from "next-auth/react"

interface AdminStats {
  totalUsers: number
  totalArticles: number
  pendingArticles: number
  totalViews: number
  totalEarnings: number
  pendingWithdrawals: number
}
interface PendingArticle {
  id: string;
  title: string;
  authorName: string;
  createdAt: string;
}
export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingArticles, setPendingArticles] = useState<PendingArticle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMdUp, setIsMdUp] = useState(false)

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

  useEffect(() => {
    const checkScreen = () => {
      setIsMdUp(window.matchMedia('(min-width: 768px)').matches)
    }
    checkScreen()
    window.addEventListener('resize', checkScreen)
    return () => window.removeEventListener('resize', checkScreen)
  }, [])

  const fetchAdminData = async () => {
    try {
      console.log("Fetching admin data from /api/admin/dashboard")
      const response = await fetch("/api/admin/dashboard")
      console.log("Response status:", response.status)
      if (response.ok) {
        const data = await response.json()
        console.log("Admin data received:", data)
        setStats(data.stats)
        setPendingArticles(data.pendingArticles)
      } else {
        console.error("Failed to fetch admin data, status:", response.status)
      }
    } catch (error) {
      console.error("Error fetching admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleArticleAction = async (articleId: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action })
      })
      if (response.ok) {
        fetchAdminData()
      }
    } catch (error) {
      console.error("Error updating article:", error)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
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
    <div className="min-h-screen bg-red-50 flex flex-col md:flex-row">
      <div className="hidden md:block">
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session.user.name} />
      </div>
      <main
        className="flex-1 p-4 md:p-8 pb-20 transition-all duration-300"
        style={isMdUp ? { marginLeft: sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_CLOSED } : {}}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
            Sign Out
          </button>
        </div>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1 text-sm">Manage your platform and moderate content.</p>
        </div>
        
        {/* Stats Grid - Modified for compact mobile layout */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Users</p>
                <p className="text-lg font-bold text-gray-900">{stats?.totalUsers ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Articles</p>
                <p className="text-lg font-bold text-gray-900">{stats?.totalArticles ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Articles</p>
                <p className="text-lg font-bold text-gray-900">{stats?.pendingArticles ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <Eye className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Views</p>
                <p className="text-lg font-bold text-gray-900">{stats?.totalViews?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Total Earnings</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats?.totalEarnings ?? 0)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-red-600" />
              <div className="ml-3">
                <p className="text-xs font-medium text-gray-600">Pending Withdrawals</p>
                <p className="text-lg font-bold text-gray-900">{stats?.pendingWithdrawals ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions - Modified to look like buttons in the image */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          <Link
            href="/admin/articles"
            className="bg-red-600 text-white rounded-lg shadow-sm p-4 hover:bg-red-700 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <FileText className="h-5 w-5 mr-3" />
              <span className="font-medium">Manage Articles</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Link
            href="/admin/members"
            className="bg-red-600 text-white rounded-lg shadow-sm p-4 hover:bg-red-700 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-3" />
              <span className="font-medium">Manage Members</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
          <Link
            href="/admin/withdrawals"
            className="bg-red-600 text-white rounded-lg shadow-sm p-4 hover:bg-red-700 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-3" />
              <span className="font-medium">Withdrawals</span>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        
        {/* Pending Articles - More compact layout */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-md font-semibold text-gray-900">Pending Articles</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {pendingArticles.length > 0 ? (
              pendingArticles.map((article) => (
                <div key={article.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {article.title.length > 80 ? `${article.title.substring(0, 80)}...` : article.title}
                      </h3>
                      <div className="flex items-center mt-1 text-xs text-gray-500 gap-2">
                        <span>By {article.authorName}</span>
                        <span>•</span>
                        <span>{formatDate(new Date(article.createdAt))}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleArticleAction(article.id, "approve")}
                        className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md text-xs hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleArticleAction(article.id, "reject")}
                        className="flex items-center px-3 py-1 bg-red-600 text-white rounded-md text-xs hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-center">
                <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-md font-medium text-gray-900 mb-1">No pending articles</h3>
                <p className="text-gray-600 text-sm">All articles have been reviewed.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminMobileNav userName={session.user.name} />
      </div>
    </div>
  )
}