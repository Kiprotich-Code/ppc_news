"use client"


import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Pencil, BookOpen, DollarSign, User, Menu } from "lucide-react"

const navItems = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Create", href: "/dashboard/articles/new", icon: Pencil },
  { label: "Content", href: "/dashboard/content", icon: BookOpen },
  { label: "Monetize", href: "/dashboard/monetization", icon: DollarSign },
  { label: "Account", href: "/dashboard/profile", icon: User },
  { label: "Academy", href: "/dashboard/academy", icon: BookOpen },
]

type DashboardMobileNavProps = {
  onMenuClick?: () => void;
};

export function DashboardMobileNav({ onMenuClick }: DashboardMobileNavProps) {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-t border-gray-200 shadow flex justify-between items-center px-1 py-1">
      {/* Optional menu button on the left */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex items-center justify-center h-10 w-10 mr-2 text-gray-500 hover:text-red-600 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}
      {/* Navigation items */}
      {navItems.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href);
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
        );
      })}
    </nav>
  );
}