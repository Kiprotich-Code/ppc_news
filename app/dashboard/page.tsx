"use client"

import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Eye, 
  Plus,
  Calendar,
  User,
  Copy,
  Share2
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"

interface DashboardStats {
  totalArticles: number
  totalViews: number
  totalEarnings: number
  pendingArticles: number
}

interface ReferralStats {
  referralCode: string
  referralCount: number
}

interface Article {
  id: string
  title: string
  status: string
  createdAt: string
  views: number
  earnings: number
  authorName: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingArticles: 0
  })
  const [recentArticles, setRecentArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [referral, setReferral] = useState<ReferralStats | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/auth/signin")
      return
    }

    fetchDashboardData()
    fetchReferralData()
  }, [session, status, router])

  const fetchReferralData = async () => {
    try {
      const response = await fetch("/api/user/referrals")
      if (response.ok) {
        const data = await response.json()
        setReferral(data)
      }
    } catch (error) {
      console.error("Error fetching referral data:", error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard")
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentArticles(data.recentArticles)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (referral?.referralCode) {
      const referralLink = `${window.location.origin}/signup?ref=${referral.referralCode}`
      try {
        await navigator.clipboard.writeText(referralLink)
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      } catch (error) {
        console.error("Failed to copy referral link:", error)
      }
    }
  }

  const shareToSocialMedia = (platform: string) => {
    if (!referral?.referralCode) return
    const referralLink = `${window.location.origin}/signup?ref=${referral.referralCode}`
    const encodedLink = encodeURIComponent(referralLink)
    const text = encodeURIComponent(`Join me on N Studio and start creating content! Use my referral link: ${referralLink}`)
    
    let shareUrl = ""
    switch (platform) {
      case "x":
        shareUrl = `https://x.com/intent/tweet?text=${text}`
        break
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=${text}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`
        break
    }
    
    window.open(shareUrl, "_blank", "noopener,noreferrer")
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-16`}>
            <LoadingSpinner />
          </main>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar for md+ */}
      <div className="hidden md:block">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>
      <main className={`flex-1 p-4 md:p-8 pb-20 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Sign Out Button */}
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-200 transition-colors text-sm font-medium shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" /></svg>
                      Sign Out
                    </button>
                  </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session.user?.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your content today.
            </p>
          </div>

          {/* Banner */}
          {/* <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img src="/opera-news-hub-logo.png" alt="Opera News Hub Logo" className="w-16 h-16 mr-4" />
                <div>
                  <h2 className="text-xl font-bold text-red-600">OPERA NEWS HUB LAUNCHES IN TANZANIA AND UGANDA!</h2>
                  <p className="text-gray-700">Kenyan Authors, Expand Your Reach!</p>
                  <p className="text-yellow-500 bg-yellow-100 inline-block px-2 py-1 rounded mt-2">
                    We are excited to announce the launch of Opera News Hub in Kiswahili for Tanzania or in English for Uganda and reach a wider audience!
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>Training Dates: <span className="font-semibold">Friday, 30th August</span></p>
              </div>
            </div>
          </div> */}

          {/* Referral Info */}
          {referral && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <span className="font-semibold text-red-800">Your Referral Link:</span>
                <div className="flex items-center mt-2">
                  <Link
                    href={`/signup?ref=${referral.referralCode}`}
                    className="font-mono text-red-700 bg-red-100 px-2 py-1 rounded mr-2 hover:underline"
                  >
                    {`${window.location.origin}/signup?ref=${referral.referralCode}`}
                  </Link>
                  <button
                    onClick={handleCopyLink}
                    className="p-1 rounded hover:bg-red-200 focus:outline-none"
                    aria-label="Copy referral link"
                    title={copySuccess ? "Copied!" : "Copy link"}
                  >
                    <Copy className={`h-5 w-5 ${copySuccess ? "text-green-600" : "text-red-600"}`} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-4">
                <div className="mb-2 md:mb-0">
                  <span className="font-semibold text-red-800">Successful Referrals:</span>
                  <span className="ml-2 text-red-700">{referral.referralCount}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => shareToSocialMedia("x")}
                    className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                    aria-label="Share to X"
                    title="Share to X"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => shareToSocialMedia("whatsapp")}
                    className="p-2 rounded bg-green-600 text-white hover:bg-green-700"
                    aria-label="Share to WhatsApp"
                    title="Share to WhatsApp"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => shareToSocialMedia("facebook")}
                    className="p-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    aria-label="Share to Facebook"
                    title="Share to Facebook"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-red-600" />
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
                  <Eye className="h-8 w-8 text-red-600" />
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
                  <DollarSign className="h-8 w-8 text-red-600" />
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
                  <TrendingUp className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Articles</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingArticles}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link
              href="/dashboard/articles/new"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-red-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Plus className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Write New Article</h3>
                  <p className="text-sm text-gray-600">Create and publish a new article</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/profile"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-red-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <User className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Update Profile</h3>
                  <p className="text-sm text-gray-600">Manage your account settings</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/wallet"
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow border border-red-200"
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Wallet</h3>
                  <p className="text-sm text-gray-600">Manage your earnings</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Trending Topics */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Trending Topics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900">Police Brutality</h3>
                <p className="text-sm text-gray-600 mt-2">What will it take to end police brutality in Kenya? When are police officers allowed to use force? What are leaders and other stakeholders saying about it? Update your readers.</p>
                <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Create</button>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-md font-medium text-gray-900">Broad-based Govt</h3>
                <p className="text-sm text-gray-600 mt-2">Will President Ruto's broad-based government deliver? Is the country headed in the right direction? Be the watchdog, share with your readers events and insights about the happenings in Kenya.</p>
                <button className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700">Create</button>
              </div>
            </div>
          </div>

          {/* Recent Articles */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Articles</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <div key={article.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{article.title}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(new Date(article.createdAt))}
                          <span className="mx-2">•</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            article.status === "APPROVED" 
                              ? "bg-green-100 text-green-800"
                              : article.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {article.status}
                          </span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {article.authorName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.views.toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(article.earnings)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h3>
                  <p className="text-gray-600 mb-4">Start writing your first article to see it here.</p>
                  <Link
                    href="/dashboard/articles/new"
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Write Your First Article
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav />
      </div>
    </div>
  )
}