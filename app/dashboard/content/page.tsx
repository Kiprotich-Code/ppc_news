"use client"

import { useState } from "react"
import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

const mockArticles = [] // Replace with real data fetch if available

export default function ContentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation onMenuClick={() => setSidebarOpen((v) => !v)} />
        <div className="flex">
          <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
          <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
            {/* Loading spinner or content */}
          </main>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation onMenuClick={() => setSidebarOpen((v) => !v)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} mt-4`}>
          <div className="w-full mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold mb-6">Content Library</h1>
            {mockArticles.length === 0 ? (
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
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 