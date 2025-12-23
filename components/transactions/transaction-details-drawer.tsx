'use client'

/**
 * Transaction Details Drawer Component
 * Shows detailed information about a specific transaction including review history
 */

import { useState } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ExternalLink, User as UserIcon, CheckCircle, XCircle, Clock, FileText, Receipt, Edit, AlertCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { ReceiptViewer } from '@/components/ReceiptViewer'

interface Approval {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt: string | Date | null
  comment?: string | null
  approver: {
    id: string
    name: string
    role: string
  }
}

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  status: 'IMPORTED' | 'VALIDATED' | 'EXCEPTION' | 'RESOLVED' | 'LOCKED' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'APPROVED_AUTOMATIC' | 'REJECTED'
  amount: string | number
  vendor: string
  description: string | null
  transactionDate: string | Date
  receiptUrl: string | null
  category: {
    id: string
    name: string
    heading: string
  } | null
  creator: {
    id: string
    name: string
    role: string
  }
  approvals?: Approval[]
  validation_json?: {
    compliant: boolean
    violations: Array<{
      code: string
      message: string
      severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
      category?: string
    }>
    score: number
  } | null
}

interface TransactionDetailsDrawerProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDetailsDrawer({ transaction, open, onOpenChange }: TransactionDetailsDrawerProps) {
  const [showReceiptViewer, setShowReceiptViewer] = useState(false)

  if (!transaction) return null

  const parsedAmount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount
  const amount = isNaN(parsedAmount) || parsedAmount === null || parsedAmount === undefined ? 0 : parsedAmount

  // Extract date in UTC to avoid timezone shifts
  const getUTCDateString = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      return null
    }
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() // 0-11
    const day = date.getUTCDate()
    return { year, month, day }
  }

  const dateInfo = getUTCDateString(transaction.transactionDate)

  // Format UTC date without timezone conversion
  const formatUTCDate = (info: { year: number; month: number; day: number } | null): string => {
    if (!info) return 'Invalid date'
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[info.month]} ${info.day}, ${info.year}`
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

  // Filter and sort approvals
  const approvedApprovals = (transaction.approvals || [])
    .filter(a => a.status === 'APPROVED')
    .sort((a, b) => {
      const dateA = a.approvedAt ? new Date(a.approvedAt).getTime() : 0
      const dateB = b.approvedAt ? new Date(b.approvedAt).getTime() : 0
      return dateA - dateB // Sort chronologically (first approval first)
    })

  const pendingApprovals = (transaction.approvals || []).filter(a => a.status === 'PENDING')
  const rejectedApprovals = (transaction.approvals || []).filter(a => a.status === 'REJECTED')

  const hasApprovals = (transaction.approvals || []).length > 0

  function getStatusBadge(status: string) {
    const variants = {
      // New validation-first statuses
      IMPORTED: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700', label: 'Imported' },
      VALIDATED: { variant: 'outline' as const, className: 'bg-meadow/10 text-meadow border-meadow/30', label: 'Validated' },
      EXCEPTION: { variant: 'outline' as const, className: 'bg-golden/10 text-golden border-golden/30', label: 'Exception' },
      RESOLVED: { variant: 'outline' as const, className: 'bg-blue-100 text-blue-700 border-blue-300', label: 'Resolved' },
      LOCKED: { variant: 'outline' as const, className: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Locked' },
      // Legacy statuses (backward compatibility)
      DRAFT: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700', label: 'Draft' },
      PENDING: { variant: 'outline' as const, className: 'bg-golden/10 text-golden border-golden/30', label: 'Pending Review' },
      APPROVED: { variant: 'outline' as const, className: 'bg-meadow/10 text-meadow border-meadow/30', label: 'Validated' },
      APPROVED_AUTOMATIC: { variant: 'outline' as const, className: 'bg-meadow/10 text-meadow border-meadow/30', label: 'Auto-Validated' },
      REJECTED: { variant: 'outline' as const, className: 'bg-red-100 text-red-700 border-red-300', label: 'Rejected' },
    }
    return variants[status as keyof typeof variants] || variants.DRAFT
  }

  const statusBadge = getStatusBadge(transaction.status)

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-white">
        <SheetHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-meadow/10">
              <CheckCircle className="w-5 h-5 text-meadow" />
            </div>
            <div className="flex-1">
              <SheetTitle>{transaction.vendor}</SheetTitle>
              <SheetDescription>
                {transaction.type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)} • {formatUTCDate(dateInfo)}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Transaction Details
            </h3>
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span style={{color: '#4B5563'}}>Type</span>
                <Badge
                  variant="outline"
                  className={
                    transaction.type === 'INCOME'
                      ? 'bg-meadow/10 text-meadow border-meadow/30'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {transaction.type}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{color: '#4B5563'}}>Status</span>
                <Badge variant={statusBadge.variant} className={statusBadge.className}>
                  {statusBadge.label}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{color: '#4B5563'}}>Amount</span>
                <span className={`font-semibold ${transaction.type === 'INCOME' ? 'text-meadow' : 'text-red-600'}`}>
                  {transaction.type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{color: '#4B5563'}}>Category</span>
                {transaction.category ? (
                  <span style={{color: '#111827'}}>{transaction.category.heading} → {transaction.category.name}</span>
                ) : (
                  <span className="text-amber-600 italic">Not categorized</span>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span style={{color: '#4B5563'}}>Date</span>
                <span style={{color: '#111827'}}>
                  {formatUTCDate(dateInfo)}
                </span>
              </div>
              {sanitizeDescription(transaction.description) && (
                <div className="pt-2 border-t">
                  <span className="text-sm block mb-1" style={{color: '#4B5563'}}>Description</span>
                  <p className="text-sm" style={{color: '#111827'}}>{sanitizeDescription(transaction.description)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Violations/Exceptions Section */}
          {transaction.validation_json && !transaction.validation_json.compliant && transaction.validation_json.violations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Policy Violations
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 ml-auto">
                  {transaction.validation_json.violations.length} {transaction.validation_json.violations.length === 1 ? 'Issue' : 'Issues'}
                </Badge>
              </h3>
              <div className="space-y-2">
                {transaction.validation_json.violations.map((violation, index) => {
                  const severityConfig = {
                    CRITICAL: { icon: AlertCircle, bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', iconColor: 'text-red-600', badgeBg: 'bg-red-100' },
                    ERROR: { icon: AlertCircle, bgColor: 'bg-red-50', borderColor: 'border-red-300', textColor: 'text-red-700', iconColor: 'text-red-600', badgeBg: 'bg-red-100' },
                    WARNING: { icon: AlertTriangle, bgColor: 'bg-amber-50', borderColor: 'border-amber-300', textColor: 'text-amber-700', iconColor: 'text-amber-600', badgeBg: 'bg-amber-100' },
                    INFO: { icon: AlertCircle, bgColor: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-700', iconColor: 'text-blue-600', badgeBg: 'bg-blue-100' },
                  }
                  const config = severityConfig[violation.severity] || severityConfig.INFO
                  const Icon = config.icon

                  return (
                    <div key={index} className={`${config.bgColor} border ${config.borderColor} rounded-lg p-3`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.badgeBg}`}>
                          <Icon className={`w-3.5 h-3.5 ${config.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className={`text-sm font-medium ${config.textColor}`}>{violation.message}</p>
                            <Badge variant="outline" className={`${config.badgeBg} ${config.textColor} ${config.borderColor} flex-shrink-0 text-xs`}>
                              {violation.severity}
                            </Badge>
                          </div>
                          {violation.code && (
                            <p className="text-xs text-gray-600 font-mono">{violation.code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Created By */}
          {transaction.creator && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Created By
              </h3>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between text-sm">
                  <span style={{color: '#4B5563'}}>Name</span>
                  <span className="font-medium" style={{color: '#111827'}}>{transaction.creator.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{color: '#4B5563'}}>Role</span>
                  <Badge variant="outline" className="capitalize">
                    {transaction.creator.role.replace(/_/g, ' ').toLowerCase()}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Review History Section */}
          {hasApprovals && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Review History
                {approvedApprovals.length > 0 && (
                  <Badge variant="outline" className="bg-meadow/10 text-meadow border-meadow/30 ml-auto">
                    {approvedApprovals.length} Validated
                  </Badge>
                )}
              </h3>

              <div className="space-y-3">
                {/* Validated Reviews */}
                {approvedApprovals.map((approval, index) => (
                  <div key={approval.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold" style={{color: '#111827'}}>
                              {approval.approver.name}
                              {index === 0 && approvedApprovals.length > 1 && (
                                <span className="ml-2 text-xs text-green-600 font-normal">(1st Review)</span>
                              )}
                              {index === 1 && approvedApprovals.length > 1 && (
                                <span className="ml-2 text-xs text-green-600 font-normal">(2nd Review)</span>
                              )}
                            </p>
                            <p className="text-xs capitalize" style={{color: '#4B5563'}}>
                              {approval.approver.role.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 flex-shrink-0">
                            VALIDATED
                          </Badge>
                        </div>
                        {approval.approvedAt && (
                          <p className="text-xs mb-2" style={{color: '#4B5563'}}>
                            {new Date(approval.approvedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(approval.approvedAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        )}
                        {approval.comment && (
                          <div className="bg-white rounded border border-green-200 p-2 mt-2">
                            <p className="text-xs italic" style={{color: '#374151'}}>"{approval.comment}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pending Reviews */}
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="bg-golden/5 border border-golden/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-golden/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4 text-golden" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold" style={{color: '#111827'}}>{approval.approver.name}</p>
                            <p className="text-xs capitalize" style={{color: '#4B5563'}}>
                              {approval.approver.role.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-golden/10 text-golden border-golden/30 flex-shrink-0">
                            PENDING
                          </Badge>
                        </div>
                        <p className="text-xs" style={{color: '#4B5563'}}>Awaiting review...</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Rejected Reviews */}
                {rejectedApprovals.map((approval) => (
                  <div key={approval.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold" style={{color: '#111827'}}>{approval.approver.name}</p>
                            <p className="text-xs capitalize" style={{color: '#4B5563'}}>
                              {approval.approver.role.replace(/_/g, ' ').toLowerCase()}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 flex-shrink-0">
                            REJECTED
                          </Badge>
                        </div>
                        {approval.approvedAt && (
                          <p className="text-xs mb-2" style={{color: '#4B5563'}}>
                            {new Date(approval.approvedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}{' '}
                            at{' '}
                            {new Date(approval.approvedAt).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </p>
                        )}
                        {approval.comment && (
                          <div className="bg-white rounded border border-red-200 p-2 mt-2">
                            <p className="text-xs italic" style={{color: '#374151'}}>"{approval.comment}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Receipt */}
          {transaction.receiptUrl && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Receipt
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowReceiptViewer(true)}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  View Receipt
                </Button>
              </div>
            </div>
          )}

          {/* Edit Button */}
          <div className="pt-4 border-t">
            <Button asChild variant="default" className="w-full bg-navy hover:bg-navy-dark text-white">
              <Link href={`/${transaction.type === 'EXPENSE' ? 'expenses' : 'income'}/${transaction.id}/edit`}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Transaction
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>

    {/* Receipt Viewer */}
    {transaction.receiptUrl && (
      <ReceiptViewer
        receiptUrl={transaction.receiptUrl}
        isOpen={showReceiptViewer}
        onClose={() => setShowReceiptViewer(false)}
      />
    )}
  </>
  )
}
