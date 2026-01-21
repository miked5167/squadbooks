'use client'

/**
 * Parent Acknowledge Button Component
 *
 * Allows parents to acknowledge and approve a budget version
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle2, MessageSquare, Loader2 } from 'lucide-react'
import { acknowledgeBudget } from '@/app/budget/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ParentAcknowledgeButtonProps {
  budgetVersionId: string
  familyId: string
  userId: string
  isAlreadyAcknowledged: boolean
  budgetId: string
}

export function ParentAcknowledgeButton({
  budgetVersionId,
  familyId,
  userId,
  isAlreadyAcknowledged,
  _budgetId,
}: ParentAcknowledgeButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [comment, setComment] = useState('')
  const [hasQuestions, setHasQuestions] = useState(false)

  if (isAlreadyAcknowledged) {
    return (
      <Button disabled size="lg" className="w-full">
        <CheckCircle2 className="w-5 h-5 mr-2" />
        Already Acknowledged
      </Button>
    )
  }

  const handleAcknowledge = async () => {
    setIsSubmitting(true)

    try {
      const result = await acknowledgeBudget({
        budgetVersionId,
        familyId,
        userId,
        comment: comment.trim() || undefined,
        hasQuestions,
      })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to acknowledge budget')
        return
      }

      // Success!
      if (result.data?.locked) {
        toast.success('Budget acknowledged! Approval threshold met - budget is now locked.')
      } else {
        toast.success('Budget acknowledged successfully!')
      }

      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error acknowledging budget:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full bg-navy hover:bg-navy-medium text-white">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Acknowledge & Approve Budget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Acknowledge & Approve Budget</DialogTitle>
          <DialogDescription>
            By acknowledging this budget, you confirm that you have reviewed the allocations and
            approve them for the season.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Optional Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Comments or Questions (Optional)
            </label>
            <Textarea
              placeholder="Add any comments or questions about the budget..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Has Questions Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hasQuestions"
              checked={hasQuestions}
              onCheckedChange={(checked) => setHasQuestions(checked as boolean)}
            />
            <label
              htmlFor="hasQuestions"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I have questions about this budget
            </label>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: Questions do not block budget approval. Your treasurer will be able to see your
            comments and follow up with you.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcknowledge}
            disabled={isSubmitting}
            className="bg-navy hover:bg-navy-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Acknowledging...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Acknowledge & Approve
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
