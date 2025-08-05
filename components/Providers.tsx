"use client";

import { Toaster } from "react-hot-toast";
import { Toaster as SonnerToaster } from "sonner";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="top-right" />
      <SonnerToaster position="top-right" />
    </SessionProvider>
  );
}