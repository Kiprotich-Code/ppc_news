"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface Article {
  id: string;
  title: string;
  content: string;
  status: string;
  views: number;
  earnings: number;
  images?: string[];
  createdAt?: string;
  publishedAt?: string;
}

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [article, setArticle] = useState<Article | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    // Only count view if article is approved
    if (article.status === "APPROVED") {
      fetch(`/api/articles/${article.id}/view`, { method: "POST" });
    }
  }, [article, isLoading, error]);

  const fetchArticle = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/articles`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch article")
      const found = data.articles.find((a: Article) => a.id === id)
      if (!found) {
        setError("Article not found or you do not have access.")
        setArticle(null)
      } else {
        setArticle(found)
      }
    } catch (e: any) {
      setError(e.message || "Unknown error")
      setArticle(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4 flex items-center justify-center`}>
          <div className="bg-white p-8 rounded shadow text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!article) return null

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      <div className="flex-1 flex flex-col">
        <Navigation />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <div className="ml-24 py-10">
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            <div className="mb-2 text-sm text-gray-500">Status: {article.status}</div>
            <div className="mb-2 text-sm text-gray-500">Views: {article.views} | Earnings: {article.earnings}</div>
            <div className="prose prose-lg mt-6" dangerouslySetInnerHTML={{ __html: article.content }} />
          </div>
        </main>
      </div>
    </div>
  )
} 