'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export interface CoachCompStatus {
  hasPolicy: boolean
  cap: number
  actual: number
  budgeted: number
  percentUsed: number
  hasException: boolean
  exceptionStatus?: 'PENDING' | 'APPROVED' | 'DENIED'
  exceptionDelta?: number
  ageGroup: string | null
  skillLevel: string | null
}

interface CoachCompExceptionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  status: CoachCompStatus | null
  teamId: string
  associationId: string
  onSuccess?: () => void
}

export function CoachCompExceptionDialog({
  open,
  onOpenChange,
  status,
  teamId,
  associationId,
  onSuccess,
}: CoachCompExceptionDialogProps) {
  const [requestedAmount, setRequestedAmount] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!status || !status.hasPolicy) {
    return null
  }

  const handleClose = () => {
    setRequestedAmount('')
    setReason('')
    onOpenChange(false)
  }

  const handleSubmit = async () => {
    if (!requestedAmount || !reason.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    const amountCents = parseCents(requestedAmount)
    if (amountCents <= 0) {
      toast.error('Exception amount must be greater than zero')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(
        `/api/associations/${associationId}/rules/coach-compensation/exceptions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teamId,
            requestedDeltaCents: amountCents,
            reason: reason.trim(),
          }),
        }
      )

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit exception request')
      }

      toast.success('Exception request submitted successfully')
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error('Error submitting exception request:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit exception request')
    } finally {
      setSubmitting(false)
    }
  }

  const parseCents = (value: string): number => {
    const cleaned = value.replace(/[$,]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : Math.round(num * 100)
  }

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const capDollars = formatCents(status.cap)
  const actualDollars = formatCents(status.actual)
  const overage = status.actual - status.cap
  const overageDollars = formatCents(Math.max(0, overage))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Request Coach Compensation Exception</DialogTitle>
          <DialogDescription>
            Request approval to exceed your team&apos;s coach compensation cap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Status Alert */}
          <Alert variant={status.actual > status.cap ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">Current Coach Compensation Status</div>
                <div className="text-sm space-y-0.5">
                  <div>Cap: ${capDollars}{status.ageGroup && status.skillLevel ? ` (${status.ageGroup} ${status.skillLevel})` : ''}</div>
                  <div>Actual Spent: ${actualDollars}</div>
                  <div>Usage: {status.percentUsed.toFixed(1)}%</div>
                  {status.actual > status.cap && (
                    <div className="font-medium text-red-600">
                      Currently exceeding cap by ${overageDollars}
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Existing Exception Warning */}
          {status.hasException && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {status.exceptionStatus === 'PENDING' && (
                  <span>
                    You have a pending exception request awaiting approval. Submitting a new request
                    will replace the pending one.
                  </span>
                )}
                {status.exceptionStatus === 'APPROVED' && (
                  <span>
                    You currently have an approved exception of ${formatCents(status.exceptionDelta || 0)}.
                    Submitting a new request will replace this approval.
                  </span>
                )}
                {status.exceptionStatus === 'DENIED' && (
                  <span>
                    Your previous exception request was denied. You may submit a new request with
                    additional justification.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Requested Exception Amount */}
          <div>
            <Label htmlFor="requestedAmount">
              Requested Exception Amount <span className="text-red-600">*</span>
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                id="requestedAmount"
                type="text"
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(e.target.value)}
                className="pl-7"
                placeholder="0.00"
                disabled={submitting}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              How much additional funding above the cap do you need?
              {status.actual > status.cap && (
                <span className="ml-1 font-medium">
                  (Minimum: ${overageDollars} to cover current overage)
                </span>
              )}
            </p>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">
              Justification <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you need to exceed the coach compensation cap. Be specific about circumstances, coaching needs, or other factors..."
              rows={5}
              className="mt-1.5"
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Provide a clear explanation to help the association review your request
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
