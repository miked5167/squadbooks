'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  Receipt,
  Eye,
  AlertTriangle,
} from 'lucide-react'
import { PendingApprovalWithRisk } from '@/lib/types/approvals'
import { getRiskBadgeClass } from '@/lib/utils/approval-risk'
import { ReceiptViewer } from '@/components/ReceiptViewer'

interface ApprovalDetailsDrawerProps {
  approval: PendingApprovalWithRisk | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (approvalId: string, comment?: string) => Promise<void>
  onReject: (approvalId: string, comment: string) => Promise<void>
  processing: boolean
}

export function ApprovalDetailsDrawer({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processing,
}: ApprovalDetailsDrawerProps) {
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)

  if (!approval) return null

  const amount = Number(approval.transaction.amount)

  const handleApprove = async () => {
    await onApprove(approval.id, comment || undefined)
    setComment('')
    setCommentError('')
    onOpenChange(false)
  }

  const handleReject = async () => {
    if (!comment || comment.trim().length === 0) {
      setCommentError('Comment is required when rejecting')
      return
    }
    await onReject(approval.id, comment.trim())
    setComment('')
    setCommentError('')
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-meadow/20 border border-meadow/30">
              <Receipt className="w-5 h-5 text-meadow" />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-navy text-xl">{approval.transaction.vendor}</SheetTitle>
              <SheetDescription className="text-navy/70 font-medium">
                ${amount.toFixed(2)} •{' '}
                {new Date(approval.transaction.transactionDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Risk Alert */}
          {approval.riskLevel !== 'LOW' && (
            <div
              className={`p-4 rounded-lg border ${
                approval.riskLevel === 'HIGH'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    approval.riskLevel === 'HIGH' ? 'text-red-600' : 'text-amber-600'
                  }`}
                />
                <div className="flex-1">
                  <h4
                    className={`font-semibold ${
                      approval.riskLevel === 'HIGH' ? 'text-red-900' : 'text-amber-900'
                    }`}
                  >
                    {approval.riskLevel === 'HIGH' ? 'High Risk Transaction' : 'Medium Risk Transaction'}
                  </h4>
                  <ul
                    className={`text-sm space-y-1 mt-2 ${
                      approval.riskLevel === 'HIGH' ? 'text-red-700' : 'text-amber-700'
                    }`}
                  >
                    {approval.riskReasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-navy" />
              Transaction Details
            </h3>
            <div className="space-y-3 bg-navy/5 rounded-lg p-4 border border-navy/10">
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Type</span>
                <Badge
                  variant="outline"
                  className={
                    approval.transaction.type === 'INCOME'
                      ? 'bg-meadow/10 text-meadow border-meadow/30'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {approval.transaction.type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Status</span>
                <Badge variant="outline" className="bg-golden/10 text-golden border-golden/30">
                  {approval.status}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Amount</span>
                <span
                  className={`font-semibold ${approval.transaction.type === 'INCOME' ? 'text-meadow' : 'text-red-600'}`}
                >
                  {approval.transaction.type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Category</span>
                <span className="text-navy text-right font-medium">
                  {approval.transaction.category.heading} → {approval.transaction.category.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Transaction Date</span>
                <span className="text-navy font-medium">
                  {new Date(approval.transaction.transactionDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Submitted</span>
                <span className="text-navy font-medium">
                  {new Date(approval.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Risk Level</span>
                <Badge variant="outline" className={getRiskBadgeClass(approval.riskLevel)}>
                  {approval.riskLevel}
                </Badge>
              </div>
              {approval.transaction.description && (
                <div className="pt-2 border-t border-navy/10">
                  <span className="text-sm text-navy/70 font-medium block mb-1">Description</span>
                  <p className="text-sm text-navy">{approval.transaction.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Created By */}
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-navy" />
              Created By
            </h3>
            <div className="space-y-2 bg-navy/5 rounded-lg p-4 border border-navy/10">
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Name</span>
                <span className="font-semibold text-navy">{approval.transaction.creator.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Role</span>
                <Badge variant="outline" className="capitalize bg-navy/5 text-navy border-navy/20">
                  {approval.transaction.creator.role.replace(/_/g, ' ').toLowerCase()}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-navy/70 font-medium">Email</span>
                <span className="text-navy text-sm font-medium">{approval.transaction.creator.email}</span>
              </div>
            </div>
          </div>

          {/* Receipt */}
          {approval.transaction.receiptUrl && (
            <div>
              <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-navy" />
                Receipt
              </h3>
              <div className="bg-navy/5 rounded-lg p-4 border border-navy/10">
                <Button
                  variant="outline"
                  className="w-full border-navy/20 hover:bg-navy/5"
                  onClick={() => setShowReceiptModal(true)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Comment Section */}
          <div>
            <Label htmlFor="drawer-comment" className="mb-2 flex items-center gap-2 text-navy font-semibold">
              <span>Comment</span>
              <span className="text-xs text-navy/70 font-normal">(Optional for approval, required for rejection)</span>
            </Label>
            <Textarea
              id="drawer-comment"
              rows={3}
              maxLength={500}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setCommentError('')
              }}
              placeholder="Add a comment or reason for your decision..."
              disabled={processing}
              className={commentError ? 'border-red-500' : ''}
            />
            {commentError && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {commentError}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white pb-4">
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing}
              variant="destructive"
              className="flex-1"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>

      {/* Receipt Viewer Modal */}
      {approval.transaction.receiptUrl && (
        <ReceiptViewer
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          receiptUrl={approval.transaction.receiptUrl}
          transactionVendor={approval.transaction.vendor}
          transactionId={approval.transaction.id}
        />
      )}
    </Sheet>
  )
}
