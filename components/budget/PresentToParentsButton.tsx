'use client'

/**
 * Present To Parents Button Component
 *
 * Allows treasurer/coach to present approved budget to parents
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
import { Users, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react'
import { presentToParents } from '@/app/budget/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PresentToParentsButtonProps {
  budgetId: string
}

export function PresentToParentsButton({ budgetId }: PresentToParentsButtonProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePresent = async () => {
    setIsSubmitting(true)

    try {
      const result = await presentToParents(budgetId)

      if (!result.success) {
        toast.error(result.error?.message || 'Failed to present to parents')
        return
      }

      toast.success('Budget presented to parents! They can now view and acknowledge it.')
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Error presenting to parents:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-navy hover:bg-navy-medium text-white">
          <Users className="w-4 h-4 mr-2" />
          Present to Parents
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Present Budget to Parents</DialogTitle>
          <DialogDescription>
            This will make the budget available for parents to view and acknowledge. They&apos;ll receive
            a notification with a link to review the budget.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Before presenting, confirm:
            </p>
            <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>Budget allocations are accurate and final</li>
              <li>Coach has approved this version</li>
              <li>All category details are complete</li>
            </ul>
          </div>

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm font-medium text-navy mb-2">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              What happens next:
            </p>
            <ul className="text-sm text-navy/70 list-disc list-inside space-y-1">
              <li>Parents will receive email notifications</li>
              <li>They can view and acknowledge the budget</li>
              <li>Progress will be tracked until threshold is met</li>
              <li>You can propose updates if changes are needed</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handlePresent} disabled={isSubmitting} className="bg-navy hover:bg-navy-medium">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Presenting...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Present to Parents
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
