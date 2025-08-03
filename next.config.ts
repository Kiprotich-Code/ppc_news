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

  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'uabarfbaw76zwhe3.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' }, // Configure this to your ngrok URL in production
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
}

export default nextConfig