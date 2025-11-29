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
  Upload,
} from 'lucide-react'
import { PendingApprovalWithRisk } from '@/lib/types/approvals'
import { getRiskBadgeClass } from '@/lib/utils/approval-risk'
import { ReceiptViewer } from '@/components/ReceiptViewer'
import { ReceiptUpload } from '@/components/ReceiptUpload'
import { MANDATORY_RECEIPT_THRESHOLD } from '@/lib/constants/validation'
import { TransactionType, UserRole } from '@prisma/client'
import { toast } from 'sonner'

interface ApprovalDetailsDrawerProps {
  approval: PendingApprovalWithRisk | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (approvalId: string, comment?: string) => Promise<void>
  onReject: (approvalId: string, comment: string) => Promise<void>
  processing: boolean
  userRole?: UserRole
  onRefresh?: () => Promise<void>
}

export function ApprovalDetailsDrawer({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
  processing,
  userRole,
  onRefresh,
}: ApprovalDetailsDrawerProps) {
  const [comment, setComment] = useState('')
  const [commentError, setCommentError] = useState('')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  if (!approval) return null

  const amount = Number(approval.transaction.amount)
  const hasReceipt = !!approval.transaction.receiptUrl
  const receiptRequired =
    approval.transaction.type === TransactionType.EXPENSE &&
    amount >= MANDATORY_RECEIPT_THRESHOLD &&
    !hasReceipt

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

  const handleUploadReceipt = async () => {
    if (!uploadFile) {
      toast.error('Please select a receipt file')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('transactionId', approval.transaction.id)

      const res = await fetch('/api/receipts/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to upload receipt')
      }

      toast.success('Receipt uploaded successfully!')
      setUploadFile(null)
      setShowUpload(false)

      // Refresh approval data
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error('Failed to upload receipt:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload receipt'
      toast.error(errorMessage)
    } finally {
      setUploading(false)
    }
  }

  const canUploadReceipt =
    userRole === UserRole.TREASURER || userRole === UserRole.ASSISTANT_TREASURER

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
          {/* Receipt Required Alert */}
          {receiptRequired && (
            <div className="p-4 rounded-lg border bg-red-50 border-red-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Receipt Required</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This expense of ${amount.toFixed(2)} requires a receipt attachment. Expenses $
                    {MANDATORY_RECEIPT_THRESHOLD.toFixed(2)} and above cannot be approved without a
                    receipt for audit compliance.
                  </p>
                </div>
              </div>
            </div>
          )}

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
          <div>
            <h3 className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-navy" />
              Receipt
              {receiptRequired && (
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 ml-2">
                  Required
                </Badge>
              )}
            </h3>
            {approval.transaction.receiptUrl ? (
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
            ) : showUpload && canUploadReceipt ? (
              <div className="space-y-3">
                <ReceiptUpload
                  onFileSelect={setUploadFile}
                  onFileRemove={() => setUploadFile(null)}
                  currentFile={uploadFile}
                  disabled={uploading}
                  maxSizeMB={5}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleUploadReceipt}
                    disabled={!uploadFile || uploading}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Receipt
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUpload(false)
                      setUploadFile(null)
                    }}
                    disabled={uploading}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`rounded-lg p-4 border ${
                  receiptRequired
                    ? 'bg-red-50 border-red-200'
                    : 'bg-navy/5 border-navy/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle
                      className={`w-4 h-4 ${
                        receiptRequired ? 'text-red-600' : 'text-navy/60'
                      }`}
                    />
                    <span
                      className={receiptRequired ? 'text-red-700 font-medium' : 'text-navy/60'}
                    >
                      No receipt attached
                      {receiptRequired && ' - Required for approval'}
                    </span>
                  </div>
                  {canUploadReceipt && (
                    <Button
                      onClick={() => setShowUpload(true)}
                      size="sm"
                      variant={receiptRequired ? 'default' : 'outline'}
                      className={receiptRequired ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Add Receipt
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

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
              disabled={processing || receiptRequired}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                receiptRequired
                  ? `Receipt required for expenses $${MANDATORY_RECEIPT_THRESHOLD.toFixed(2)} and above`
                  : undefined
              }
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : receiptRequired ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Receipt Required
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
