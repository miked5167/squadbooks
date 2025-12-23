'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Income edit error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-card">
        <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6" />
            <CardTitle className="text-2xl">Error Loading Income</CardTitle>
          </div>
          <CardDescription className="text-white/90">
            Something went wrong while loading the income edit page
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {error.message || 'An unexpected error occurred. Please try again.'}
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={reset}
                className="w-full bg-meadow hover:bg-green-600 text-white"
              >
                Try Again
              </Button>

              <Button
                variant="outline"
                onClick={() => router.push('/transactions')}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Transactions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
