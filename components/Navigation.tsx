"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Menu, User, LogOut } from "lucide-react"
import Image from "next/image"
import { useState } from "react"

export function Navigation({ onMenuClick, userImage }: { onMenuClick?: () => void, userImage?: string }) {
  const { data: session, status } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Menu + Logo/Brand */}
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded hover:bg-gray-100 focus:outline-none mr-2"
              aria-label="Toggle sidebar"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6 text-gray-700" />
            </button>
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-red-600">N</span>
              <span className="text-xl font-bold text-gray-900">Studio</span>
            </Link>
          </div>

          {/* User Info/Sign Out */}
          <div className="flex items-center space-x-4 relative">
            {status === "loading" ? (
              <div className="flex items-center space-x-4">
                <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              </div>
            ) : session?.user ? (
              <div className="flex items-center space-x-2">
                <button
                  className="focus:outline-none"
                  onClick={() => setDropdownOpen((v) => !v)}
                  aria-label="Open user menu"
                >
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt="avatar"
                      width={32}
                      height={32}
                      className="rounded-full border"
                    />
                  ) : (
                    <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gray-200 text-gray-500 font-bold">
                      {session.user.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </button>
                {/* Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-12 w-40 bg-white border rounded shadow-lg z-50">
                    <Link
                      href="/dashboard/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); signOut(); }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
} 