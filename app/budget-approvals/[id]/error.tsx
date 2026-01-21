'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Budget approval error:', error)
  }, [error])

  return (
    <div className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-navy">Something went wrong</CardTitle>
                <CardDescription>
                  We encountered an error loading this budget approval
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-navy/70">
              This could be due to a network issue or the budget approval may no longer be available.
            </p>
            <div className="flex gap-3">
              <Button onClick={reset} className="bg-navy hover:bg-navy-medium">
                Try again
              </Button>
              <Button variant="outline" onClick={() => window.history.back()}>
                Go back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
