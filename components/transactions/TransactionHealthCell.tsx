'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckCircle2, AlertTriangle, FileText, Clock, Info } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import type { TransactionUIState } from '@/lib/utils/transaction-ui-mapping'

interface TransactionHealthCellProps {
  transaction: {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: string | number
    receiptUrl: string | null
    validation?: {
      compliant: boolean
      violations?: Array<{
        code?: string
        message?: string
        severity?: string
      }>
    } | null
    exceptionReason?: string | null
    resolvedAt?: string | null
  }
  uiState: TransactionUIState
  receiptRequiredOver?: number
  canAddReceipt?: boolean
  onAddReceipt?: () => void
}

type ReceiptState = 'present' | 'missing_required' | 'missing_optional'

export function TransactionHealthCell({
  transaction,
  uiState,
  receiptRequiredOver = 100,
  canAddReceipt = false,
  onAddReceipt,
}: TransactionHealthCellProps) {
  // Compute health indicators
  const healthData = useMemo(() => {
    const hasReceipt = !!transaction.receiptUrl
    const amount =
      typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount

    // Receipt logic
    const receiptRequired = transaction.type === 'EXPENSE' && amount > receiptRequiredOver
    const receiptState: ReceiptState = hasReceipt
      ? 'present'
      : receiptRequired
        ? 'missing_required'
        : 'missing_optional'

    // Exception logic
    const isFlaggedException = uiState.validationState === 'exception' && !transaction.resolvedAt
    const exceptionCount = transaction.validation?.violations?.length || 0
    const exceptionReasons =
      transaction.validation?.violations
        ?.slice(0, 2)
        .map(v => v.message || v.code || 'Rule violation') ||
      (transaction.exceptionReason ? [transaction.exceptionReason] : [])

    // Validation logic
    const isValidated =
      uiState.validationState === 'compliant' || uiState.lifecycleState === 'validated'
    const validationRequired = uiState.validationState === 'needs_info'

    // Determine if needs attention
    // Only flag for actionable issues: missing required receipt or active exceptions
    // "Pending validation" is informational, not actionable by user
    const needsAttention = receiptState === 'missing_required' || isFlaggedException

    return {
      needsAttention,
      receiptState,
      hasReceipt,
      receiptRequired,
      isFlaggedException,
      exceptionCount,
      exceptionReasons,
      isValidated,
      validationRequired,
    }
  }, [transaction, uiState, receiptRequiredOver])

  // Receipt icon and tooltip
  const receiptIcon = useMemo(() => {
    const { receiptState } = healthData

    if (receiptState === 'present') {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        tooltip: 'Receipt attached',
        ariaLabel: 'Receipt present',
      }
    }

    if (receiptState === 'missing_required') {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
        tooltip: 'Receipt required (over $' + receiptRequiredOver + ')',
        ariaLabel: 'Receipt required but missing',
      }
    }

    // missing_optional
    return {
      icon: <FileText className="h-4 w-4 text-gray-400" />,
      tooltip: 'No receipt attached (optional)',
      ariaLabel: 'No receipt attached',
    }
  }, [healthData, receiptRequiredOver])

  // Validation icon and tooltip
  const validationIcon = useMemo(() => {
    const { isValidated, validationRequired } = healthData

    if (isValidated) {
      return {
        icon: <CheckCircle2 className="h-4 w-4 text-green-600" />,
        tooltip: 'Validated and compliant',
        ariaLabel: 'Transaction validated',
      }
    }

    return {
      icon: <Clock className="h-4 w-4 text-blue-600" />,
      tooltip: validationRequired ? 'Pending validation' : 'Not yet validated',
      ariaLabel: 'Validation pending',
    }
  }, [healthData])

  // Exception icon and tooltip (only show if flagged)
  const exceptionIcon = useMemo(() => {
    const { isFlaggedException, exceptionCount, exceptionReasons } = healthData

    if (!isFlaggedException) return null

    const tooltipText =
      exceptionCount > 0
        ? exceptionCount > 1
          ? `${exceptionCount} issues: ${exceptionReasons.slice(0, 2).join(', ')}${exceptionCount > 2 ? '...' : ''}`
          : exceptionReasons[0] || 'Review required'
        : transaction.exceptionReason || 'Review required'

    return {
      icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
      tooltip: tooltipText,
      ariaLabel: `Exception: ${tooltipText}`,
    }
  }, [healthData, transaction.exceptionReason])

  return (
    <div className="flex items-center gap-2">
      {/* Primary Health Badge */}
      <Badge
        variant="outline"
        className={
          healthData.needsAttention
            ? 'border-amber-300 bg-amber-50 text-amber-700'
            : 'border-green-300 bg-green-50 text-green-700'
        }
      >
        {healthData.needsAttention ? 'Needs attention' : 'OK'}
      </Badge>

      {/* Icon Row */}
      <TooltipProvider>
        <div className="flex items-center gap-1.5">
          {/* Receipt Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span aria-label={receiptIcon.ariaLabel}>{receiptIcon.icon}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{receiptIcon.tooltip}</p>
            </TooltipContent>
          </Tooltip>

          {/* Validation Icon */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span aria-label={validationIcon.ariaLabel}>{validationIcon.icon}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{validationIcon.tooltip}</p>
            </TooltipContent>
          </Tooltip>

          {/* Exception Icon (only if flagged) */}
          {exceptionIcon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span aria-label={exceptionIcon.ariaLabel}>{exceptionIcon.icon}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{exceptionIcon.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Details Sheet Trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-navy/10 h-6 w-6 p-0"
                onClick={e => e.stopPropagation()}
              >
                <Info className="text-navy/60 h-3.5 w-3.5" />
                <span className="sr-only">View health details</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              onClick={e => e.stopPropagation()}
              className="text-navy overflow-y-auto bg-white"
            >
              <SheetHeader>
                <SheetTitle className="text-navy">Transaction Health Details</SheetTitle>
                <SheetDescription className="text-navy/60">
                  Detailed status information for this transaction
                </SheetDescription>
              </SheetHeader>

              <div className="text-navy mt-6 space-y-6">
                {/* Receipt Status */}
                <div className="space-y-2">
                  <h4 className="text-navy flex items-center gap-2 text-sm font-semibold">
                    <FileText className="text-navy h-4 w-4" />
                    Receipt
                  </h4>
                  <div className="space-y-1 pl-6">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{' '}
                      {healthData.hasReceipt ? (
                        <span className="text-green-600">Attached</span>
                      ) : (
                        <span
                          className={
                            healthData.receiptRequired ? 'text-amber-600' : 'text-gray-600'
                          }
                        >
                          {healthData.receiptRequired
                            ? 'Required but missing'
                            : 'Not attached (optional)'}
                        </span>
                      )}
                    </p>
                    {healthData.receiptRequired && !healthData.hasReceipt && (
                      <p className="text-navy/60 text-sm">
                        Receipts are required for expenses over ${receiptRequiredOver}
                      </p>
                    )}
                    {!healthData.hasReceipt && canAddReceipt && onAddReceipt && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-navy text-navy hover:bg-navy/10 mt-2"
                        onClick={e => {
                          e.stopPropagation()
                          onAddReceipt()
                        }}
                      >
                        Add Receipt
                      </Button>
                    )}
                  </div>
                </div>

                {/* Validation Status */}
                <div className="space-y-2">
                  <h4 className="text-navy flex items-center gap-2 text-sm font-semibold">
                    {healthData.isValidated ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-600" />
                    )}
                    Validation
                  </h4>
                  <div className="space-y-1 pl-6">
                    <p className="text-sm">
                      <span className="font-medium">Status:</span>{' '}
                      {healthData.isValidated ? (
                        <span className="text-green-600">Validated and compliant</span>
                      ) : (
                        <span className="text-blue-600">
                          {healthData.validationRequired
                            ? 'Pending validation'
                            : 'Not yet validated'}
                        </span>
                      )}
                    </p>
                    {uiState.reasons && uiState.reasons.length > 0 && (
                      <div className="mt-2">
                        <p className="text-navy/70 text-sm font-medium">Info:</p>
                        <ul className="text-navy/60 ml-2 list-inside list-disc text-sm">
                          {uiState.reasons.map((reason, idx) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Exception Status */}
                {healthData.isFlaggedException && (
                  <div className="space-y-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-red-900">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      Exceptions
                    </h4>
                    <div className="space-y-1 pl-6">
                      <p className="text-sm">
                        <span className="font-medium">Count:</span>{' '}
                        <span className="text-red-600">
                          {healthData.exceptionCount > 0
                            ? `${healthData.exceptionCount} issue${healthData.exceptionCount !== 1 ? 's' : ''}`
                            : '1 issue'}
                        </span>
                      </p>
                      {healthData.exceptionReasons.length > 0 && (
                        <div className="mt-2">
                          <p className="text-navy/70 text-sm font-medium">Issues:</p>
                          <ul className="ml-2 list-inside list-disc text-sm text-red-600">
                            {healthData.exceptionReasons.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                            {healthData.exceptionCount > 2 && (
                              <li className="text-navy/60">
                                +{healthData.exceptionCount - 2} more issue
                                {healthData.exceptionCount - 2 !== 1 ? 's' : ''}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                      <p className="text-navy/60 mt-2 text-sm">
                        This transaction requires review and resolution by a treasurer.
                      </p>
                    </div>
                  </div>
                )}

                {/* Overall Health Summary */}
                <div className="border-navy/20 border-t pt-4">
                  <p className="text-navy mb-2 text-sm">
                    <span className="font-medium">Overall Health:</span>{' '}
                    {healthData.needsAttention ? (
                      <span className="font-semibold text-amber-600">Needs attention</span>
                    ) : (
                      <span className="text-green-600">Everything looks good</span>
                    )}
                  </p>
                  {healthData.needsAttention && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                      <p className="mb-1 text-sm font-medium text-amber-900">Action Required:</p>
                      <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
                        {healthData.receiptState === 'missing_required' && (
                          <li>Add receipt (required for expenses over ${receiptRequiredOver})</li>
                        )}
                        {healthData.isFlaggedException && (
                          <li>
                            Review and resolve{' '}
                            {healthData.exceptionCount > 1
                              ? `${healthData.exceptionCount} exceptions`
                              : 'exception'}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </TooltipProvider>
    </div>
  )
}
