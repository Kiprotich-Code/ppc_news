// This configuration applies to all API routes
export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

// Disable static generation for API routes
export const generateStaticParams = () => {
  return []
}