'use client'

/**
 * Submit For Review Button Component
 *
 * Allows treasurer to submit draft budget for coach review
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Send, Loader2 } from 'lucide-react'
import { submitForReview } from '@/app/budget/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface SubmitForReviewButtonProps {
  budgetId: string
}

export function SubmitForReviewButton({ budgetId }: SubmitForReviewButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      const result = await submitForReview({ budgetId })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to submit for review')
        return
      }

      toast.success('Budget submitted for coach review!')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error submitting for review:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy hover:bg-navy-medium text-white">
          <Send className="w-4 h-4 mr-2" />
          Submit for Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Budget for Coach Review</DialogTitle>
          <DialogDescription>
            This will send the budget to your coach for approval. You won&apos;t be able to make changes
            while it&apos;s under review.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>What happens next:</strong>
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside mt-2 space-y-1">
              <li>Coach will be notified to review the budget</li>
              <li>Coach can approve or request changes</li>
              <li>You&apos;ll be notified of their decision</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-navy hover:bg-navy-medium text-white">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit for Review
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
