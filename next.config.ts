import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Modern error handling (Next.js 14+)
  experimental: {
    suppressHydrationWarnings: true, // Primary solution
    missingSuspenseWithCSRBailout: false, // Optional: prevents SSR/CSR mismatch errors
  },
  
  // Production optimizations
  compiler: {
    styledComponents: true,
    reactRemoveProperties: process.env.NODE_ENV === 'production', // Remove data-testids in prod
  },
  
  // Environment-aware settings
  eslint: {
    ignoreDuringBuilds: !!process.env.SKIP_LINT,
  },
  typescript: {
    ignoreBuildErrors: !!process.env.SKIP_TYPE_CHECK,
  },
}

export default nextConfig