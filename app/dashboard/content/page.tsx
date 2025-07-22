"use client"

import { useState, useEffect } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { useRouter } from "next/navigation"

interface Article {
  id: string;
  title: string;
  status: string;
  views: number;
  earnings: number;
}

export default function ContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([])
  const { data: session, status } = useSession()
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    return null;
  }

  useEffect(() => {
    const fetchArticles = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/articles")
        const data = await res.json()
        setArticles(data.articles || [])
      } catch (e) {
        setArticles([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchArticles()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <LoadingSpinner />
        </main>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} userName={session?.user?.name} />
      <div className="flex-1 flex flex-col">
        <Navigation />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <div className="w-full mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-6">Content Library</h1>
            {articles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-lg font-medium text-gray-900 mb-2">No articles yet</h2>
                <p className="text-gray-600 mb-4">You haven't published any articles yet.</p>
                <Link
                  href="/dashboard/articles/new"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Create New Article
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow divide-y">
                {/* Map articles here */}
                {articles.map(article => (
                  <div key={article.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        <Link href={`/dashboard/content/${article.id}`} className="hover:underline">
                          {article.title}
                        </Link>
                      </h3>
                      <div className="text-sm text-gray-500 mt-1">{article.status}</div>
                    </div>
                    <div className="flex gap-4 mt-2 md:mt-0">
                      <span className="text-gray-500 text-sm">Views: {article.views}</span>
                      <span className="text-gray-500 text-sm">Earnings: {article.earnings}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 