'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Redirect page for backward compatibility
 * This page redirects to /income/new since "payment" was misleading
 * (it suggested paying someone, but actually recorded income)
 */
export default function NewPaymentRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/income/new')
  }, [router])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto mb-4" />
        <p className="text-navy/70">Redirecting to Add Income...</p>
      </div>
    </div>
  )
}
