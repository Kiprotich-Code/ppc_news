"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "react-hot-toast"
import { ClientOnly } from "./ClientOnly"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly>
      <SessionProvider>
        <Toaster position="top-right" />
        {children}
      </SessionProvider>
    </ClientOnly>
  )
} 