/**
 * Details drawer for exception resolution
 */

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
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import type { TransactionWithValidation } from '@/lib/types/exceptions'
import { useResolveException } from '@/lib/hooks/use-exceptions'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { Permission } from '@/lib/permissions/permissions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ExceptionDetailsDrawerProps {
  transaction: TransactionWithValidation | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh: () => void
}

export function ExceptionDetailsDrawer({
  transaction,
  open,
  onOpenChange,
  onRefresh,
}: ExceptionDetailsDrawerProps) {
  const { resolve, loading } = useResolveException()
  const { canResolveException, hasPermission, role } = usePermissions()
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [resolveReason, setResolveReason] = useState('')
  const [resolutionMethod, setResolutionMethod] = useState<'OVERRIDE' | 'CORRECT'>('OVERRIDE')

  if (!transaction) return null

  const validation = transaction.validationJson
  const violations = validation?.violations || []
  const errorViolations = violations.filter(
    (v) => v.severity === 'ERROR' || v.severity === 'CRITICAL'
  )

  // Check resolution permissions based on severity
  const severity = (transaction.exceptionSeverity || 'LOW') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  const resolutionPermissions = canResolveException(severity)
  const canFix = hasPermission(Permission.FIX_EXCEPTION)
  const canView = hasPermission(Permission.VIEW_EXCEPTIONS)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-blue-600" />
    }
  }

  /**
   * Sanitize transaction description by removing approval-first language
   * This handles legacy data that may contain old semantics
   */
  function sanitizeDescription(description: string | null | undefined): string | null {
    if (!description) return null

    // Remove approval-first language patterns
    const approvalPatterns = [
      /\s*-?\s*pending\s+expense\s+awaiting\s+approval\s*/gi,
      /\s*-?\s*awaiting\s+approval\s*/gi,
      /\s*-?\s*pending\s+approval\s*/gi,
      /\s*-?\s*needs\s+approval\s*/gi,
      /\s*-?\s*requires\s+approval\s*/gi,
    ]

    let sanitized = description
    approvalPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })

    // Clean up any double spaces or leading/trailing spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim()

    // If the description is now empty or just punctuation, return null
    if (!sanitized || /^[\s\-,.:;]+$/.test(sanitized)) {
      return null
    }

    return sanitized
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'ERROR':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getActionableItems = () => {
    const items: string[] = []

    violations.forEach((v) => {
      switch (v.code) {
        case 'MISSING_RECEIPT':
          items.push('Attach receipt for this transaction')
          break
        case 'UNAPPROVED_CATEGORY':
        case 'UNCATEGORIZED':
          items.push('Assign to a valid budget category')
          break
        case 'CATEGORY_OVER_LIMIT':
          items.push('Review budget allocation or recategorize')
          break
        case 'THRESHOLD_BREACH':
          items.push('Request budget increase or split transaction')
          break
        case 'CASH_LIKE_TRANSACTION':
          items.push('Provide additional documentation for cash-like payment')
          break
        default:
          if (v.message) items.push(v.message)
      }
    })

    return Array.from(new Set(items)) // Remove duplicates
  }

  const handleResolve = async () => {
    if (!resolveReason.trim()) {
      return
    }

    const success = await resolve({
      transactionId: transaction.id,
      resolution: resolutionMethod,
      reason: resolveReason,
    })

    if (success) {
      setResolveReason('')
      setShowResolveDialog(false)
      setResolutionMethod('OVERRIDE')
      onOpenChange(false)
      onRefresh()
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-2xl text-navy">Transaction Details</SheetTitle>
            <SheetDescription>
              Review validation status and resolve any issues
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6">
            {/* Status Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {transaction.status === 'EXCEPTION' ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : transaction.status === 'VALIDATED' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                )}
                <h3 className="font-semibold text-navy">Validation Status</h3>
              </div>

              <div className="flex gap-2">
                <Badge
                  variant="outline"
                  className={
                    transaction.status === 'EXCEPTION'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : transaction.status === 'VALIDATED'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }
                >
                  {transaction.status}
                </Badge>
                {transaction.exceptionSeverity && (
                  <Badge
                    variant="outline"
                    className={
                      transaction.exceptionSeverity === 'CRITICAL'
                        ? 'bg-red-100 text-red-800 border-red-200'
                        : transaction.exceptionSeverity === 'HIGH'
                        ? 'bg-orange-100 text-orange-800 border-orange-200'
                        : transaction.exceptionSeverity === 'MEDIUM'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }
                  >
                    {transaction.exceptionSeverity} Priority
                  </Badge>
                )}
              </div>

              {validation?.score !== undefined && (
                <div className="text-sm text-navy/70">
                  Compliance Score: <span className="font-semibold">{validation.score}/100</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Transaction Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-navy">Transaction Information</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-navy/70">
                    <Calendar className="h-4 w-4" />
                    Date
                  </div>
                  <div className="font-medium text-navy">
                    {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-navy/70">
                    <DollarSign className="h-4 w-4" />
                    Amount
                  </div>
                  <div className="font-semibold text-navy">
                    {formatCurrency(Number(transaction.amount))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-navy/70">Vendor</div>
                  <div className="font-medium text-navy">{transaction.vendor}</div>
                </div>

                <div className="space-y-1">
                  <div className="text-sm text-navy/70">Category</div>
                  <div>
                    {transaction.category ? (
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${transaction.category.color}20`,
                          borderColor: transaction.category.color,
                          color: transaction.category.color,
                        }}
                      >
                        {transaction.category.name}
                      </Badge>
                    ) : (
                      <span className="text-navy/50">Uncategorized</span>
                    )}
                  </div>
                </div>

                {sanitizeDescription(transaction.description) && (
                  <div className="col-span-2 space-y-1">
                    <div className="text-sm text-navy/70">Description</div>
                    <div className="text-navy">{sanitizeDescription(transaction.description)}</div>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-navy/70">
                    <User className="h-4 w-4" />
                    Created By
                  </div>
                  <div className="text-navy">{transaction.creator.name}</div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-navy/70">
                    <FileText className="h-4 w-4" />
                    Receipt
                  </div>
                  <div>
                    {transaction.receiptUrl ? (
                      <a
                        href={transaction.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View receipt
                      </a>
                    ) : (
                      <span className="text-navy/50 text-sm">No receipt</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Violations Section */}
            {errorViolations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-navy flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    Validation Issues ({errorViolations.length})
                  </h3>

                  <div className="space-y-3">
                    {errorViolations.map((violation, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getSeverityColor(violation.severity)}`}
                      >
                        <div className="flex items-start gap-3">
                          {getSeverityIcon(violation.severity)}
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{violation.message}</div>
                            {violation.code && (
                              <div className="text-xs opacity-75">Code: {violation.code}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* What to Fix Section */}
            {transaction.status === 'EXCEPTION' && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-navy">What to Fix</h3>
                  <ul className="space-y-2">
                    {getActionableItems().map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-navy/80">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {/* Actions */}
            {transaction.status === 'EXCEPTION' && (
              <>
                <Separator />
                <div className="space-y-3">
                  {/* Show permission-based actions */}
                  {resolutionPermissions.canResolve ? (
                    <>
                      {resolutionPermissions.canOverride && (
                        <Button
                          onClick={() => {
                            setResolutionMethod('OVERRIDE')
                            setShowResolveDialog(true)
                          }}
                          className="w-full bg-navy hover:bg-navy/90"
                        >
                          Override Exception
                        </Button>
                      )}
                      {canFix && (
                        <Button
                          onClick={() => {
                            setResolutionMethod('CORRECT')
                            setShowResolveDialog(true)
                          }}
                          variant={resolutionPermissions.canOverride ? 'outline' : 'default'}
                          className={
                            resolutionPermissions.canOverride
                              ? 'w-full border-navy/20'
                              : 'w-full bg-navy hover:bg-navy/90'
                          }
                        >
                          Fix & Revalidate
                        </Button>
                      )}
                      <p className="text-xs text-navy/60 text-center">
                        {resolutionPermissions.canOverride
                          ? 'You can override this exception or fix the underlying issue'
                          : 'Fix the underlying issue to resolve this exception'}
                      </p>
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Permission Required</AlertTitle>
                      <AlertDescription>
                        {resolutionPermissions.reason || 'You do not have permission to resolve this exception'}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show role-specific guidance */}
                  {role === 'TREASURER' && !resolutionPermissions.canOverride && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        As a Treasurer, you can fix issues by attaching receipts or recategorizing. Contact your Assistant Treasurer to override validation rules.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Resolve Dialog */}
      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resolutionMethod === 'OVERRIDE' ? 'Override Exception' : 'Fix Exception'}
            </DialogTitle>
            <DialogDescription>
              {resolutionMethod === 'OVERRIDE'
                ? 'Provide a reason for manually overriding this exception. This will mark the transaction as resolved despite validation errors.'
                : 'Explain how you will fix this exception. You should attach receipts, recategorize, or make other corrections to resolve the underlying issues.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Resolution *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this exception should be resolved (e.g., 'Board approved this expenditure', 'One-time payment authorized by president')..."
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolveReason.trim() || loading}
              className="bg-navy hover:bg-navy/90"
            >
              {loading ? 'Resolving...' : 'Resolve Exception'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
