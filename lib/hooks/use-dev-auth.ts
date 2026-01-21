/**
 * Development Authentication Hook
 * Bypasses Clerk when NEXT_PUBLIC_DEV_MODE is enabled
 */

'use client'

import { useEffect, useState } from 'react'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const DEV_USER_ID = process.env.DEV_USER_ID || 'demo_2025_2026_000002'

interface DevAuthReturn {
  userId: string | null | undefined
  isLoaded: boolean
  isSignedIn: boolean
}

export function useAuth(): DevAuthReturn {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (DEV_MODE) {
      // Check localStorage for selected team
      const selectedUserId = localStorage.getItem('dev_user_id')
      setUserId(selectedUserId || DEV_USER_ID)
      setIsLoaded(true)
    } else {
      // In production, this would use real Clerk auth
      // For now, just load as not signed in
      setIsLoaded(true)
    }
  }, [])

  if (DEV_MODE) {
    return {
      userId: userId || DEV_USER_ID,
      isLoaded,
      isSignedIn: true,
    }
  }

  // In production, you would import and use Clerk's useAuth here
  // For now, return not signed in
  return {
    userId: null,
    isLoaded,
    isSignedIn: false,
  }
}
