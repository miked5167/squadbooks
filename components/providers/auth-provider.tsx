/**
 * Auth Provider Wrapper
 * Bypasses ClerkProvider in dev mode
 */

'use client'

import { ClerkProvider } from '@clerk/nextjs'
import type { ReactNode } from 'react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export function AuthProvider({ children }: { children: ReactNode }) {
  // In dev mode, skip Clerk entirely
  if (DEV_MODE) {
    return <>{children}</>
  }

  // Otherwise, use ClerkProvider
  return <ClerkProvider>{children}</ClerkProvider>
}
