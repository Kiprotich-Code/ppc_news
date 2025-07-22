"use client"

import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { LoadingSpinner } from "@/components/LoadingSpinner"

interface DashboardStats {
  totalArticles: number
  totalViews: number
  totalEarnings: number
  pendingArticles: number
}

export default function MonetizationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingArticles: 0
  })
  const { data: session } = useSession()

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true)
      try {
        const res = await fetch("/api/dashboard")
        const data = await res.json()
        setStats(data.stats || stats)
      } catch (e) {
        setStats({
          totalArticles: 0,
          totalViews: 0,
          totalEarnings: 0,
          pendingArticles: 0
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
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
          <div className="max-w-5xl mx-auto px-4 py-10">
            {/* Tabs */}
            <div className="mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                <span className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium cursor-pointer">Revenue Statistics</span>
                {/* Future: add more tabs here */}
              </nav>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 text-center">
              <div>
                <div className="text-lg text-gray-500 mb-1">Total estimated revenue</div>
                <div className="text-3xl font-bold text-orange-400">Kes <span className="text-4xl">{stats.totalEarnings.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="text-lg text-gray-500 mb-1">Total Articles</div>
                <div className="text-3xl font-bold text-gray-700">{stats.totalArticles}</div>
              </div>
              <div>
                <div className="text-lg text-gray-500 mb-1">Pending Articles</div>
                <div className="text-3xl font-bold text-gray-700">{stats.pendingArticles}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-100 rounded p-4 mb-6">
              <div className="text-sm text-gray-700 font-semibold mb-2">Note:</div>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                <li>Revenue data updates from 48 hours ago every day at 16:00.</li>
                <li>Only articles with “Published” status will be defined as monetized and can be paid.</li>
                <li>The earnings for removed and republished articles will show in the end-of-the-month adjustment.</li>
                <li>All data presented are estimated revenue, and the finalized revenue will match the actual outcome.</li>
              </ul>
            </div>      
          </div>
        </main>
      </div>
    </div>
  )
} 