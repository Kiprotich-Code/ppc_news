"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Users, DollarSign, BookOpen } from "lucide-react"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: Home },
  { label: "Articles", href: "/admin/articles", icon: FileText },
  { label: "Courses", href: "/admin/courses", icon: BookOpen },
  { label: "Members", href: "/admin/members", icon: Users },
  { label: "Transactions", href: "/admin/transactions", icon: DollarSign },
]

export function AdminMobileNav({ userName }: { userName?: string }) {
  const pathname = usePathname()
  return (
    <nav className="bg-white border-t border-gray-200 shadow flex justify-between items-center px-1 py-1">
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center flex-1 py-1 px-1 text-xs font-medium transition-colors ${active ? "text-red-600" : "text-gray-500 hover:text-red-600"}`}
            aria-label={label}
          >
            <Icon className={`h-6 w-6 mb-0.5 ${active ? "text-red-600" : "text-gray-400"}`} />
            <span className="text-[11px] leading-tight">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
} 