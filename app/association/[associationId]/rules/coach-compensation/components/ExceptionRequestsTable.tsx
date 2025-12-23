'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Check, X, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { approveException, type ExceptionApprovalInput } from '../actions'
import { formatDistanceToNow } from 'date-fns'

interface Exception {
  id: string
  teamId: string
  teamName: string
  reason: string
  config: any
  status: 'PENDING' | 'APPROVED' | 'DENIED'
  approvedBy?: string | null
  approvedAt?: Date | null
  createdAt: Date
}

interface ExceptionRequestsTableProps {
  associationId: string
  exceptions: Exception[]
  onUpdated?: () => void
}

export function ExceptionRequestsTable({
  associationId,
  exceptions,
  onUpdated,
}: ExceptionRequestsTableProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all')
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean
    exception: Exception | null
  }>({ open: false, exception: null })
  const [approvedAmount, setApprovedAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const filteredExceptions = exceptions.filter((ex) => {
    if (filter === 'all') return true
    return ex.status.toLowerCase() === filter
  })

  const openReviewDialog = (exception: Exception) => {
    setReviewDialog({ open: true, exception })
    setApprovedAmount(formatCents(exception.config.requestedDeltaCents || 0))
    setNotes('')
  }

  const closeReviewDialog = () => {
    setReviewDialog({ open: false, exception: null })
    setApprovedAmount('')
    setNotes('')
  }

  const handleApprove = async (approved: boolean) => {
    if (!reviewDialog.exception) return

    setProcessing(true)
    try {
      const input: ExceptionApprovalInput = {
        exceptionId: reviewDialog.exception.id,
        approved,
        approvedDeltaCents: approved ? parseCents(approvedAmount) : undefined,
        notes: notes.trim() || undefined,
      }

      const result = await approveException(associationId, input)

      if (result.success) {
        toast.success(`Exception ${approved ? 'approved' : 'denied'} successfully`)
        closeReviewDialog()
        onUpdated?.()
      } else {
        toast.error(result.error || 'Failed to process exception')
      }
    } catch (error) {
      console.error('Error processing exception:', error)
      toast.error('Failed to process exception')
    } finally {
      setProcessing(false)
    }
  }

  const formatCents = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const parseCents = (value: string): number => {
    const cleaned = value.replace(/[$,]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : Math.round(num * 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-green-600">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case 'DENIED':
        return (
          <Badge variant="destructive">
            <X className="h-3 w-3 mr-1" />
            Denied
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (exceptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Exception Requests</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          When teams need to exceed their coach compensation caps, they can request an exception.
          Those requests will appear here for review.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex items-center gap-4">
          <Label>Filter:</Label>
          <Select
            value={filter}
            onValueChange={(val) => setFilter(val as any)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredExceptions.length} requests</Badge>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Requested Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExceptions.map((exception) => (
                <TableRow key={exception.id}>
                  <TableCell className="font-medium">{exception.teamName}</TableCell>
                  <TableCell>
                    ${formatCents(exception.config.requestedDeltaCents || 0)}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {exception.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(exception.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(exception.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell className="text-right">
                    {exception.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReviewDialog(exception)}
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={closeReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Review Exception Request</DialogTitle>
            <DialogDescription>
              Approve or deny this team's request to exceed their coach compensation cap
            </DialogDescription>
          </DialogHeader>

          {reviewDialog.exception && (
            <div className="space-y-4 py-4">
              {/* Team Info */}
              <div>
                <Label className="text-muted-foreground">Team</Label>
                <p className="font-medium">{reviewDialog.exception.teamName}</p>
              </div>

              {/* Requested Amount */}
              <div>
                <Label className="text-muted-foreground">Requested Exception Amount</Label>
                <p className="text-2xl font-bold">
                  ${formatCents(reviewDialog.exception.config.requestedDeltaCents || 0)}
                </p>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-muted-foreground">Reason</Label>
                <p className="text-sm">{reviewDialog.exception.reason}</p>
              </div>

              {/* Approved Amount (editable) */}
              <div>
                <Label htmlFor="approvedAmount">Approved Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="approvedAmount"
                    type="text"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    className="pl-7"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  You can approve a different amount than requested
                </p>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes or conditions..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleApprove(false)}
              disabled={processing}
            >
              <X className="h-4 w-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={() => handleApprove(true)}
              disabled={processing}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
