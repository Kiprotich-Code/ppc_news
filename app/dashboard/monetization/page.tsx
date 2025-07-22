"use client"

import { Navigation } from "@/components/Navigation"
import { Sidebar } from "@/components/Sidebar"
import { useState } from "react"

const mockStats = {
  total: 0.0,
  monthly: 0.0,
  articles: 0,
}

const mockNotes = [
  "Revenue data updates from 48 hours ago every day at 16:00.",
  'Only articles with “Published” status will be defined as monetized and can be paid.',
  'The earnings for removed and republished articles will show in the end-of-the-month adjustment.',
  'All data presented are estimated revenue, and the finalized revenue will match the actual outcome.'
]

const mockTable = [
  { date: "2025-07-18", revenue: 0.0, adjustment: 0.0 },
]

export default function MonetizationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [tab] = useState("revenue")
  const [filter, setFilter] = useState("daily")
  const [dateRange, setDateRange] = useState({ from: "2025-06-19", to: "2025-07-19" })
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
                <div className="text-3xl font-bold text-orange-400">Kes <span className="text-4xl">{mockStats.total.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="text-lg text-gray-500 mb-1">Monthly estimated revenue</div>
                <div className="text-3xl font-bold text-gray-700">Kes <span className="text-4xl">{mockStats.monthly.toFixed(2)}</span></div>
              </div>
              <div>
                <div className="text-lg text-gray-500 mb-1">Monthly Monetized articles</div>
                <div className="text-3xl font-bold text-gray-700">{mockStats.articles}</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-gray-100 rounded p-4 mb-6">
              <div className="text-sm text-gray-700 font-semibold mb-2">Note:</div>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {mockNotes.map((note, i) => <li key={i}>{note}</li>)}
              </ul>
            </div>      
          </div>
        </main>
      </div>
    </div>
  )
} 