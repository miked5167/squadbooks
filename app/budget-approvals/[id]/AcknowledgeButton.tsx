'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function AcknowledgeButton({ approvalId }: { approvalId: string }) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleAcknowledge = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/budget-approvals/${approvalId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to acknowledge budget')
      }

      toast.success('Budget Acknowledged', {
        description: 'Thank you for acknowledging this budget.',
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to acknowledge budget. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="lg" className="w-full bg-navy hover:bg-navy-medium text-white">
          <CheckCircle2 className="mr-2 h-5 w-5" />
          I Acknowledge Receipt of This Budget
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-navy text-xl">Acknowledge Budget?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-base">
              <p className="text-navy">
                By clicking &ldquo;Acknowledge,&rdquo; you confirm that you have reviewed the budget information
                provided above.
              </p>
              <p className="font-semibold text-orange-600 bg-orange-50 p-3 rounded-md border border-orange-200">
                Important: This action cannot be undone once completed.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleAcknowledge()
            }}
            disabled={loading}
            className="bg-navy hover:bg-navy-medium text-white"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Acknowledge Budget
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
