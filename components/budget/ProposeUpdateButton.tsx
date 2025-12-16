'use client'

/**
 * Propose Update Button Component
 *
 * Allows treasurer to propose budget updates after it's been presented to parents
 * Opens a modal to create a new version with required change summary
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
import { Edit, Loader2, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { BudgetVersionWithAllocations } from '@/lib/types/budget-workflow'

interface ProposeUpdateButtonProps {
  budgetId: string
  currentVersion: BudgetVersionWithAllocations
}

export function ProposeUpdateButton({ budgetId, currentVersion }: ProposeUpdateButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [changeSummary, setChangeSummary] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleProposeUpdate = () => {
    // Validate change summary
    if (!changeSummary.trim()) {
      setError('Change summary is required')
      return
    }

    if (changeSummary.trim().length < 10) {
      setError('Please provide a more detailed summary (at least 10 characters)')
      return
    }

    setError(null)

    // Store change summary in sessionStorage and redirect to edit page
    sessionStorage.setItem('budgetChangeSummary', changeSummary)
    router.push(`/budget/${budgetId}/edit?mode=propose`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-navy text-navy hover:bg-navy/5">
          <Edit className="w-4 h-4 mr-2" />
          Propose Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Propose Budget Update</DialogTitle>
          <DialogDescription>
            Create a new version of this budget with your proposed changes. Parents who have already
            acknowledged will need to re-approve the new version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Important Notice */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Important: Re-acknowledgement Required
              </p>
              <p className="text-sm text-yellow-800">
                When you create a new version, all existing parent acknowledgements will no longer count
                toward the approval threshold. Parents will be notified and asked to review and re-approve
                the updated budget.
              </p>
            </div>
          </div>

          {/* Change Summary Input */}
          <div className="space-y-2">
            <label htmlFor="changeSummary" className="text-sm font-medium text-navy">
              What changed? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Summarize the changes you&apos;re proposing (1-2 sentences). This will be shown to parents.
            </p>
            <Textarea
              id="changeSummary"
              placeholder="Example: Increased equipment budget by $500 and reduced travel budget by $500 to account for new safety gear requirements."
              value={changeSummary}
              onChange={(e) => {
                setChangeSummary(e.target.value)
                setError(null)
              }}
              rows={4}
              className={error ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>

          {/* Current Version Info */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs font-medium text-navy mb-1">Current Version</p>
            <p className="text-sm text-navy/70">
              Version {currentVersion.versionNumber} •{' '}
              {currentVersion.allocations.length} categories •{' '}
              ${currentVersion.totalBudget.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              total
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false)
              setChangeSummary('')
              setError(null)
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleProposeUpdate} className="bg-navy hover:bg-navy-medium">
            <Edit className="w-4 h-4 mr-2" />
            Continue to Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
