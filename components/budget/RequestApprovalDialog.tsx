'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function RequestApprovalDialog({
  teamId,
  budgetTotal,
}: {
  teamId: string
  budgetTotal: number
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [approvalType, setApprovalType] = useState<'INITIAL' | 'REVISION' | 'REPORT'>('INITIAL')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/budget-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          budgetTotal,
          approvalType,
          description,
          expiresAt: deadline || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create approval request')
      }

      toast.success('Approval Request Sent', {
        description: 'Parents have been notified.',
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error('Failed to send approval request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Request Parent Acknowledgment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Request Parent Acknowledgment</DialogTitle>
          <DialogDescription>
            Send this budget to all parents for acknowledgment. They'll receive a notification to view and acknowledge.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <RadioGroup value={approvalType} onValueChange={(v) => setApprovalType(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="INITIAL" id="initial" />
                <Label htmlFor="initial" className="font-normal">
                  Initial Season Budget
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REVISION" id="revision" />
                <Label htmlFor="revision" className="font-normal">
                  Budget Revision
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="REPORT" id="report" />
                <Label htmlFor="report" className="font-normal">
                  Financial Report
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="e.g., Mid-season budget adjustment for additional tournament"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline (Optional)</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Budget Total:</strong> ${budgetTotal.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              All parents will be notified.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
