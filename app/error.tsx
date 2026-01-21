'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { captureException } from '@/lib/sentry'

/**
 * Root Error Boundary
 *
 * This component catches all unhandled errors in the application
 * and provides a user-friendly error page with recovery options.
 *
 * Automatically reports errors to Sentry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to Sentry
    captureException(error, {
      digest: error.digest,
      errorBoundary: 'root',
    })
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-red-500" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error. Our team has been notified and will look into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-medium text-red-800 mb-2">Error Details (Development Only):</p>
              <pre className="text-xs text-red-700 overflow-auto max-h-40">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
              {error.digest && (
                <p className="text-xs text-red-600 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={reset}
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              onClick={() => window.location.href = '/'}
              className="flex-1"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
