'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert,  AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'

interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'approve' | 'reject'
  count: number
  totalAmount: number
  onConfirm: (comment?: string) => Promise<void>
  loading: boolean
}

export function BulkActionDialog({
  open,
  onOpenChange,
  action,
  count,
  totalAmount,
  onConfirm,
  loading,
}: BulkActionDialogProps) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    if (action === 'reject' && (!comment || comment.trim().length === 0)) {
      setError('Comment is required when rejecting transactions')
      return
    }

    setError('')
    await onConfirm(comment || undefined)
    setComment('')
  }

  const handleCancel = () => {
    setComment('')
    setError('')
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-navy">
            {action === 'approve' ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approve {count} Transactions?
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Reject {count} Transactions?
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-navy/70 font-medium">
            You're about to {action} <strong className="text-navy">{count}</strong> transactions totalling{' '}
            <strong className="text-navy">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </strong>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Warning Alerts */}
        <div className="space-y-3">
          {action === 'approve' && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                This action cannot be undone. Once approved, these transactions will be marked as
                approved and impact your budget.
              </AlertDescription>
            </Alert>
          )}
          {action === 'reject' && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                This action cannot be undone. Rejected transactions will be removed from the
                approval queue.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Comment Section */}
        <div className="my-4">
          <Label htmlFor="bulk-comment" className="mb-2 flex items-center gap-2 text-navy font-semibold">
            <span>Comment</span>
            {action === 'reject' && <span className="text-xs text-red-600 font-normal">(Required)</span>}
            {action === 'approve' && <span className="text-xs text-navy/70 font-normal">(Optional)</span>}
          </Label>
          <Textarea
            id="bulk-comment"
            rows={3}
            maxLength={500}
            value={comment}
            onChange={(e) => {
              setComment(e.target.value)
              setError('')
            }}
            placeholder={
              action === 'reject'
                ? 'Provide a reason for rejecting these transactions...'
                : 'Add an optional comment for all approvals...'
            }
            disabled={loading}
            className={error ? 'border-red-500' : ''}
          />
          {error && (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {action === 'approve' ? 'Approve All' : 'Reject All'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
