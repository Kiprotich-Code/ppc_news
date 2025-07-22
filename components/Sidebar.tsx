"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Pencil, BookOpen, DollarSign, User, MessageSquare, Menu } from "lucide-react"
import { useState } from "react"

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Create", href: "/dashboard/articles/new", icon: Pencil },
  { label: "Content Library", href: "/dashboard/content", icon: BookOpen },
  { label: "Monetization", href: "/dashboard/monetization", icon: DollarSign },
  { label: "Account", href: "/dashboard/profile", icon: User },
]

export function Sidebar({ open, setOpen }: { open: boolean, setOpen: (v: boolean) => void }) {
  const pathname = usePathname()
  return (
    <aside
      className={`h-screen ${open ? "w-64" : "w-20"} bg-white shadow-lg flex flex-col fixed top-0 left-0 z-30 transition-all duration-200`}
    >
      {/* Top: Logo */}
      <div className="flex items-center h-16 px-4 border-gray-200">
        {open && (
          <>
            <span className="text-2xl font-bold text-red-600 mr-2">N</span>
            <span className="text-xl font-bold text-gray-900">Studio</span>
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
      {/* Feedback at bottom */}
      <div className="mt-auto mb-6 px-4">
        <Link
          href="#"
          className="flex items-center gap-3 px-4 py-2 rounded-md text-gray-500 hover:bg-gray-100 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          {open && <span>Send feedback</span>}
        </Link>
      </div>
    </aside>
  )
} 