import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/auth/signin',
    '/auth/register', 
    '/auth/forgot-password',
    '/auth/reset-password',
    '/feed',
    '/writers',
    '/api/auth',
    '/api/check-env',
    '/api/public-article',
    '/api/public-feed'
  ]

  // Check if the route is public or API route
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/feed/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // If no token (not authenticated), redirect to signin
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const userRole = token.role as string

  // Admin/SuperAdmin route protection
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      // Non-admin users trying to access admin routes
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('error', 'access_denied')
      url.searchParams.set('message', 'You need administrator privileges to access this area. Please contact an administrator if you believe you should have access.')
      return NextResponse.redirect(url)
    }
  }

  // Dashboard route protection (prevent admins from accessing user dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
      // Admin users trying to access dashboard routes - redirect to admin
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // Allow access if all checks pass
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth.js API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
