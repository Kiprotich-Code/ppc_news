import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
 
  // Production optimizations
  compiler: {
    styledComponents: true,
    reactRemoveProperties: process.env.NODE_ENV === 'production', // Remove data-testids in prod
  },
  
  // Environment-aware settings
  eslint: {
    ignoreDuringBuilds: !!process.env.SKIP_LINT,
  },
}

export default nextConfig