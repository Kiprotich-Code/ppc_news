"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Pencil, BookOpen, DollarSign, User, MessageSquare, Menu } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Create", href: "/dashboard/articles/new", icon: Pencil },
  { label: "Content Library", href: "/dashboard/content", icon: BookOpen },
  { label: "Monetization", href: "/dashboard/monetization", icon: DollarSign },
  { label: "Account", href: "/dashboard/profile", icon: User },
]

export function Sidebar({ open, setOpen, onMenuClick, userImage, userName }: { open: boolean, setOpen: (v: boolean) => void, onMenuClick?: () => void, userImage?: string, userName?: string }) {
  const pathname = usePathname()
  return (
    <aside
      className={`h-screen ${open ? "w-64" : "w-20"} bg-white shadow-lg flex flex-col fixed top-0 left-0 z-40 transition-all duration-200`}
    >
      {/* Top: Menu + Logo/Brand */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200 gap-2">
        <button
          className="p-2 rounded hover:bg-gray-100 focus:outline-none mr-2"
          aria-label="Toggle sidebar"
          onClick={onMenuClick || (() => setOpen(!open))}
        >
          <Menu className="h-6 w-6 text-gray-700" />
        </button>
        {open && (
          <>
            <span className="text-2xl font-bold text-blue-600 mr-2">PPC</span>
            <span className="text-xl font-bold text-gray-900">News</span>
          </>
        )}
      </div>
      {/* Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-1">
        {navItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/dashboard")
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-l-full text-base font-medium transition-colors
                ${active ? "bg-red-50 text-red-600" : "text-gray-700 hover:bg-gray-100"}`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-red-600" : "text-gray-400"}`} />
              {open && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>
      {/* User Info at bottom */}
      <div className="mt-auto mb-6 px-4 flex flex-col items-center">
        {userImage ? (
          <Image src={userImage} alt="avatar" width={40} height={40} className="rounded-full border mb-2" />
        ) : (
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-gray-200 text-gray-500 font-bold mb-2">
            {userName?.[0]?.toUpperCase() || "U"}
          </span>
        )}
        {open && userName && <span className="text-sm text-gray-700 font-medium">{userName}</span>}
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-500 hover:bg-gray-100 text-sm mt-2"
        >
          <MessageSquare className="h-4 w-4" />
          {open && <span>Send feedback</span>}
        </Link>
      </div>
    </aside>
  )
} 