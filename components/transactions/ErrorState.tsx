import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

/**
 * Reusable error state component for inline error replacement.
 *
 * Replaces content area with error message and retry button.
 * Used when primary content fetch fails (not for background operations).
 */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="text-destructive h-12 w-12" />
      <p className="text-foreground mt-4 text-sm">{message}</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  )
}
