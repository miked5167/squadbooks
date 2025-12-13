'use client'

/**
 * Coach Review Actions Component
 *
 * Provides approve and request changes actions for coach budget review
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react'
import { approveBudget } from '@/app/budget/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CoachReviewActionsProps {
  budgetId: string
  versionNumber: number
  userId: string
}

export function CoachReviewActions({
  budgetId,
  versionNumber,
  userId,
}: CoachReviewActionsProps) {
  const router = useRouter()

  // Approve Dialog State
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')

  // Request Changes Dialog State
  const [isRequestChangesOpen, setIsRequestChangesOpen] = useState(false)
  const [isRequestingChanges, setIsRequestingChanges] = useState(false)
  const [changeNotes, setChangeNotes] = useState('')
  const [changeNotesError, setChangeNotesError] = useState<string | null>(null)

  const handleApprove = async () => {
    setIsApproving(true)

    try {
      const result = await approveBudget({
        budgetId,
        versionNumber,
        userId,
        approved: true,
        notes: approvalNotes.trim() || undefined,
      })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to approve budget')
        return
      }

      toast.success('Budget approved successfully!')
      setIsApproveOpen(false)
      router.push('/budget')
      router.refresh()
    } catch (error) {
      console.error('Error approving budget:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsApproving(false)
    }
  }

  const handleRequestChanges = async () => {
    // Validate notes are provided
    if (!changeNotes.trim()) {
      setChangeNotesError('Please explain what changes are needed')
      return
    }

    if (changeNotes.trim().length < 10) {
      setChangeNotesError('Please provide more detail (at least 10 characters)')
      return
    }

    setIsRequestingChanges(true)
    setChangeNotesError(null)

    try {
      const result = await approveBudget({
        budgetId,
        versionNumber,
        userId,
        approved: false,
        notes: changeNotes.trim(),
      })

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to request changes')
        return
      }

      toast.success('Changes requested. Treasurer has been notified.')
      setIsRequestChangesOpen(false)
      router.push('/budget')
      router.refresh()
    } catch (error) {
      console.error('Error requesting changes:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsRequestingChanges(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-navy">
          Review Decision
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Approve Button */}
        <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Approve Budget</DialogTitle>
              <DialogDescription>
                By approving this budget, you confirm that the allocations are appropriate and
                the budget can be presented to parents.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Optional Notes */}
              <div className="space-y-2">
                <label htmlFor="approvalNotes" className="text-sm font-medium text-navy">
                  Notes (Optional)
                </label>
                <p className="text-xs text-muted-foreground">
                  Add any comments or feedback about the budget
                </p>
                <Textarea
                  id="approvalNotes"
                  placeholder="Example: Budget looks good. Appreciate the increased focus on safety equipment."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* What Happens Next */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-2">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  What happens next:
                </p>
                <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                  <li>Budget status changes to &quot;Team Approved&quot;</li>
                  <li>Treasurer can present the budget to parents</li>
                  <li>Parents can view and acknowledge the budget</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsApproveOpen(false)}
                disabled={isApproving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700"
              >
                {isApproving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve Budget
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Changes Button */}
        <Dialog open={isRequestChangesOpen} onOpenChange={setIsRequestChangesOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full border-red-500 text-red-600 hover:bg-red-50">
              <XCircle className="w-4 h-4 mr-2" />
              Request Changes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Request Budget Changes</DialogTitle>
              <DialogDescription>
                The budget will be returned to the treasurer for revisions. Please explain what
                needs to be changed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Required Notes */}
              <div className="space-y-2">
                <label htmlFor="changeNotes" className="text-sm font-medium text-navy">
                  What needs to change? <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-muted-foreground">
                  Be specific about what changes are needed and why
                </p>
                <Textarea
                  id="changeNotes"
                  placeholder="Example: Please reduce travel budget by $1000 and increase equipment budget by $1000. We need more funds for new safety gear based on updated league requirements."
                  value={changeNotes}
                  onChange={(e) => {
                    setChangeNotes(e.target.value)
                    setChangeNotesError(null)
                  }}
                  rows={5}
                  className={changeNotesError ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {changeNotesError && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {changeNotesError}
                  </p>
                )}
              </div>

              {/* What Happens Next */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  What happens next:
                </p>
                <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                  <li>Budget status returns to &quot;Draft&quot;</li>
                  <li>Treasurer receives notification with your notes</li>
                  <li>Treasurer makes changes and resubmits for review</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRequestChangesOpen(false)
                  setChangeNotes('')
                  setChangeNotesError(null)
                }}
                disabled={isRequestingChanges}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestChanges}
                disabled={isRequestingChanges}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isRequestingChanges ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting Changes...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Request Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Help Text */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          Review the budget carefully before making your decision
        </p>
      </CardContent>
    </Card>
  )
}
