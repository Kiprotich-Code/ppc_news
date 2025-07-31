import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // React 19 specific configuration
  experimental: {
    reactCompiler: process.env.REACT_COMPILER === 'true', // Only enable if using React 19
    // Other experimental features if needed
  },

  // Production optimizations
  compiler: {
    styledComponents: true,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Environment-aware settings
  eslint: {
    ignoreDuringBuilds: !!process.env.SKIP_LINT,
  },
}

export default nextConfig