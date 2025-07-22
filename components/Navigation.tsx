"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Menu, User, LogOut, X } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

export function Navigation({ userImage }: { userImage?: string }) {
  const { data: session, status } = useSession()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSignOut = () => {
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    signOut()
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-30 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <img src="/file.svg" alt="PPC News Logo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">PPC News</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 relative">
            {status === "loading" ? (
              <div className="flex items-center space-x-4">
                <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
              </div>
            ) : session?.user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
                <div className="relative">
                  <button
                    className="focus:outline-none flex items-center space-x-1"
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
                    <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-50">
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <User size={16} />
                          <span>Profile</span>
                        </div>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/signin"
                  className="inline-block px-5 py-2 border border-blue-600 text-blue-600 font-semibold rounded-full transition-all duration-200 hover:bg-blue-600 hover:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-block px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-full shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {status === "authenticated" ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/signin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}