import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  
  const { pathname } = request.nextUrl

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

  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(route + '/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/feed/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('.')
  )

  if (isPublicRoute) {
    return NextResponse.next()
  }

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const userRole = token.role as string

  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/signin'
      url.searchParams.set('error', 'access_denied')
      url.searchParams.set('message', 'You need administrator privileges to access this area. Please contact an administrator if you believe you should have access.')
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/dashboard')) {
    if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/api/admin/:path*',
    '/api/admin/courses/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
