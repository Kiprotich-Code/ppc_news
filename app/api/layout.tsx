import { dynamic } from './config'

// This layout ensures all API routes inherit dynamic configuration
export default function ApiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

// Export dynamic configuration
export { dynamic }