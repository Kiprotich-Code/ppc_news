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

  // Webpack config to prevent duplicate React versions
  webpack: (config) => {
    config.resolve ??= {}
    config.resolve.alias ??= {}
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'react': require.resolve('react'),
      'react-dom': require.resolve('react-dom'),
      'react/jsx-runtime': require.resolve('react/jsx-runtime'),
    }

    return config
  }
}

export default nextConfig