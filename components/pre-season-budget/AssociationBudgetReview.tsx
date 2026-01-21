'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  CheckCircle2,
  XCircle,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Loader2,
  AlertCircle,
  TrendingUp,
  PieChart,
} from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

interface BudgetReviewProps {
  budget: {
    id: string
    proposedTeamName: string
    proposedSeason: string
    teamType?: string
    ageDivision?: string
    competitiveLevel?: string
    totalBudget: number
    projectedPlayers: number
    perPlayerCost: number
    status: string
    createdAt: string
    associationNotes?: string
    allocations: Array<{
      allocated: number
      notes?: string
      category: {
        id: string
        name: string
        heading: string
        color: string
      }
    }>
  }
}

export function AssociationBudgetReview({ budget }: BudgetReviewProps) {
  const router = useRouter()
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const res = await fetch(`/api/pre-season-budget/association/${budget.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: approvalNotes }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to approve budget')
      }

      toast.success('Budget approved successfully!')
      router.push('/association/pre-season-budgets')
      router.refresh()
    } catch (error) {
      console.error('Error approving budget:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve budget')
    } finally {
      setProcessing(false)
      setApproveDialogOpen(false)
    }
  }

  const handleReject = async () => {
    if (!rejectionNotes.trim() || rejectionNotes.length < 10) {
      toast.error('Please provide a detailed reason for rejection (at least 10 characters)')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch(`/api/pre-season-budget/association/${budget.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectionNotes }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to reject budget')
      }

      toast.success('Budget rejected')
      router.push('/association/pre-season-budgets')
      router.refresh()
    } catch (error) {
      console.error('Error rejecting budget:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reject budget')
    } finally {
      setProcessing(false)
      setRejectDialogOpen(false)
    }
  }

  const canReview = budget.status === 'SUBMITTED'

  // Calculate category percentages
  const allocationsWithPercentages = budget.allocations
    .map((alloc) => ({
      ...alloc,
      percentage: (Number(alloc.allocated) / Number(budget.totalBudget)) * 100,
    }))
    .sort((a, b) => Number(b.allocated) - Number(a.allocated))

  const topCategories = allocationsWithPercentages.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl text-navy mb-2">
                {budget.proposedTeamName}
              </CardTitle>
              <CardDescription className="text-base flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {budget.proposedSeason}
                </div>
                {budget.ageDivision && (
                  <>
                    <span>•</span>
                    <span>{budget.ageDivision}</span>
                  </>
                )}
                {budget.competitiveLevel && (
                  <>
                    <span>•</span>
                    <span>{budget.competitiveLevel}</span>
                  </>
                )}
                {budget.teamType && (
                  <>
                    <span>•</span>
                    <span>{budget.teamType}</span>
                  </>
                )}
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={
                budget.status === 'SUBMITTED'
                  ? 'bg-blue-100 text-blue-700 border-blue-300'
                  : budget.status === 'APPROVED'
                  ? 'bg-green-100 text-green-700 border-green-300'
                  : 'bg-red-100 text-red-700 border-red-300'
              }
            >
              {budget.status === 'SUBMITTED' && <Clock className="w-3 h-3 mr-1" />}
              {budget.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {budget.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
              {budget.status}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gold/10 p-3">
                <DollarSign className="w-6 h-6 text-gold" />
              </div>
              <div>
                <p className="text-sm text-navy/60">Total Budget</p>
                <p className="text-2xl font-bold text-navy">
                  {formatCurrency(Number(budget.totalBudget))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-50 p-3">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-navy/60">Projected Players</p>
                <p className="text-2xl font-bold text-navy">
                  {budget.projectedPlayers}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-green-50 p-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-navy/60">Per-Player Cost</p>
                <p className="text-2xl font-bold text-navy">
                  {formatCurrency(Number(budget.perPlayerCost))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-navy" />
            <CardTitle className="text-lg">Top Budget Categories</CardTitle>
          </div>
          <CardDescription>Largest budget allocations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {topCategories.map((allocation) => (
            <div key={allocation.category.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: allocation.category.color }}
                  />
                  <div>
                    <p className="font-medium text-navy">{allocation.category.name}</p>
                    <p className="text-xs text-navy/60">{allocation.category.heading}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">
                    {formatCurrency(Number(allocation.allocated))}
                  </p>
                  <p className="text-xs text-navy/60">
                    {allocation.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
              <Progress
                value={allocation.percentage}
                className="h-2"
                style={{
                  // @ts-ignore
                  '--progress-background': allocation.category.color,
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Full Allocation Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Complete Budget Breakdown</CardTitle>
          <CardDescription>All category allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allocationsWithPercentages.map((allocation) => (
              <div
                key={allocation.category.id}
                className="flex items-center justify-between py-3 border-b border-navy/10 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: allocation.category.color }}
                  />
                  <div>
                    <p className="font-medium text-navy">{allocation.category.name}</p>
                    <p className="text-xs text-navy/60">{allocation.category.heading}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-navy">
                    {formatCurrency(Number(allocation.allocated))}
                  </p>
                  <p className="text-xs text-navy/60">
                    {allocation.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
            <Separator className="my-4" />
            <div className="flex items-center justify-between font-bold text-navy">
              <span>Total Allocated</span>
              <div className="flex items-center gap-2">
                <span>{formatCurrency(Number(budget.totalBudget))}</span>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Notes (if already reviewed) */}
      {budget.associationNotes && (
        <Card className="bg-navy/5 border-navy/10">
          <CardHeader>
            <CardTitle className="text-lg">Review Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-navy/70">{budget.associationNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {canReview && (
        <Card className="bg-cream border-gold/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4 mb-6">
              <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-medium text-navy mb-1">Ready to Review</h3>
                <p className="text-sm text-navy/70">
                  This budget is awaiting your approval. Review the allocations above and
                  either approve or reject with feedback for the coach.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                onClick={() => setRejectDialogOpen(true)}
                disabled={processing}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject Budget
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setApproveDialogOpen(true)}
                disabled={processing}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Budget
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              Approve Budget
            </DialogTitle>
            <DialogDescription>
              Approve this pre-season budget for {budget.proposedTeamName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="approvalNotes">Notes (Optional)</Label>
              <Textarea
                id="approvalNotes"
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="Any feedback or guidance for the coach..."
                className="mt-1.5"
                rows={4}
              />
              <p className="text-xs text-navy/60 mt-1">
                These notes will be sent to the coach
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>What happens next:</strong> The budget will be marked as approved
                and a public link will be generated. The coach can then share this link
                with prospective parents.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? (
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

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Reject Budget
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a detailed reason for rejecting this budget
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionNotes">
                Reason for Rejection <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="rejectionNotes"
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                placeholder="Explain why this budget is being rejected and what changes are needed..."
                className="mt-1.5"
                rows={5}
                required
              />
              <p className="text-xs text-navy/60 mt-1">
                Minimum 10 characters required. Be specific to help the coach improve.
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>What happens next:</strong> The budget will be returned to the
                coach with your feedback. They can make changes and resubmit for review.
              </p>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              disabled={processing || !rejectionNotes.trim() || rejectionNotes.length < 10}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Budget
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
