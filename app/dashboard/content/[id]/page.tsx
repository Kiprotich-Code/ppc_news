"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { DashboardMobileNav } from "@/components/DashboardMobileNav"

interface Article {
  id: string;
  title: string;
  content: string;
  status: string;
  views: number;
  earnings: number;
  images?: string[];
  featuredImage?: string;
  createdAt?: string;
  publishedAt?: string;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false) // Start closed on mobile
  const [isLoading, setIsLoading] = useState(true)
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check for mobile viewport
  useEffect(() => {
    console.log("ID from useParams:", id);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768) // Auto-open sidebar on desktop
    }
    
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    if (!id) return
    fetchArticle()
    // eslint-disable-next-line
  }, [session, status, id])

  // Call view/earnings API after article is loaded and not loading
  useEffect(() => {
    if (!article || isLoading || error) return;
    if (article.status === "APPROVED") {
      fetch(`/api/articles/${article.id}/view`, { method: "POST" });
    }
  }, [article, isLoading, error]);

  const fetchArticle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/articles/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch article")
      setArticle(data.article)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setArticle(null);
    } finally {
      setIsLoading(false)
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
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner />
          </div>
        </main>
        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
        {/* Sidebar for md+ */}
        <div className="hidden md:block">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        </div>
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20 flex items-center justify-center`}>
          <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <button 
              onClick={() => router.push("/dashboard/content")}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
            >
              Back to Content
            </button>
          </div>
        </main>
        {/* Bottom nav for mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
          <DashboardMobileNav />
        </div>
      </div>
    )
  }

  if (!article) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">      
      {/* Sidebar - shown on desktop, hidden on mobile */}
      <div className={`fixed md:static inset-0 z-40 md:z-auto transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      </div>
      
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col">
        <main className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} mt-4 pb-20`}>
          <div className="px-4 sm:px-6 md:px-8 py-6">
            <div className="max-w-4xl mx-auto">
              {/* Back Button */}
              <div className="mb-6">
                <Link
                  href="/dashboard/content"
                  className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Content Library
                </Link>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Featured Image */}
                {article.featuredImage && (
                  <div className="w-full h-48 sm:h-64 md:h-80 lg:h-96 relative">
                    <img
                      src={article.featuredImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}
                
                {/* Article Content */}
                <div className="p-4 sm:p-6 md:p-8">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">{article.title}</h1>
                  
                  {/* Article Stats */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        article.status === "APPROVED" ? "bg-green-100 text-green-800" :
                        article.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        article.status === "REJECTED" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {article.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>👁️ {article.views.toLocaleString()} views</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>💰 ${article.earnings.toFixed(2)}</span>
                    </div>
                    {article.createdAt && (
                      <div className="flex items-center gap-1">
                        <span>📅 {new Date(article.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Article Content */}
                  <div className="prose prose-sm sm:prose-base max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: article.content }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Bottom nav for mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <DashboardMobileNav onMenuClick={() => setSidebarOpen(true)} />
      </div>
    </div>
  )
}