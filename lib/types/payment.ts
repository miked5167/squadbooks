/**
 * Payment Types for GTHL Compliance
 *
 * Types for tracking payment methods, review processes, and compliance
 * with GTHL Team Bank Account Policy.
 */

import type {
  PaymentMethod,
  ReviewStatus,
  PolicyExceptionType,
  AlertSeverity,
} from '@prisma/client'

// Review
export interface Review {
  id: string
  transactionId: string
  reviewerUserId: string
  status: ReviewStatus
  notes?: string | null
  reviewedAt: Date
  createdAt: Date
  updatedAt: Date
}

// Review with Relations
export interface ReviewWithRelations extends Review {
  transaction: {
    id: string
    amount: number
    vendor: string
    transactionDate: Date
    status: string
  }
  reviewer: {
    id: string
    name: string
    email: string
    role: string
  }
}

// Create Review Input
export interface CreateReviewInput {
  transactionId: string
  reviewerUserId: string
  status: ReviewStatus
  notes?: string
  reviewedAt?: Date
}

// Policy Exception
export interface PolicyException {
  id: string
  transactionId: string
  type: PolicyExceptionType
  severity: AlertSeverity
  details: Record<string, any>
  detectedAt: Date
  resolvedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Policy Exception with Relations
export interface PolicyExceptionWithRelations extends PolicyException {
  transaction: {
    id: string
    amount: number
    vendor: string
    transactionDate: Date
    status: string
    spendIntent?: {
      id: string
      paymentMethod: PaymentMethod
      status: string
    } | null
  }
}

// Create Policy Exception Input
export interface CreatePolicyExceptionInput {
  transactionId: string
  type: PolicyExceptionType
  severity: AlertSeverity
  details: Record<string, any>
  detectedAt?: Date
}

// Plaid Bank Transaction
export interface PlaidBankTransaction {
  id: string
  teamId: string
  plaidTransactionId: string
  amountCents: number
  currency: string
  postedAt: Date
  authorizedAt?: Date | null
  merchantName?: string | null
  rawName?: string | null
  paymentChannel?: string | null
  pending: boolean
  raw: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// Plaid Transaction Matching Result
export interface PlaidTransactionMatchResult {
  plaidTransaction: PlaidBankTransaction
  matchedTransaction?: {
    id: string
    amount: number
    vendor: string
    transactionDate: Date
    spendIntentId?: string | null
  }
  matchConfidence: number // 0-100
  matchReason: string
  isAutoMatched: boolean
  suggestedMatches?: Array<{
    transactionId: string
    confidence: number
    reason: string
  }>
}

// Payment Tracking Summary
export interface PaymentTrackingSummary {
  teamId: string
  period: {
    start: Date
    end: Date
  }
  totalPayments: number
  paymentsByMethod: {
    [key in PaymentMethod]: {
      count: number
      totalAmountCents: number
    }
  }
  reviewsPending: number
  reviewsCompleted: number
  exceptionsActive: number
  exceptionsResolved: number
  complianceRate: number // Percentage
}

// Review Requirement Check
export interface ReviewRequirementCheck {
  transactionId: string
  requiresReview: boolean
  reason: string
  paymentMethod: PaymentMethod
  amountCents: number
  isETransferOverThreshold: boolean
  isCashWithdrawal: boolean
  reviewDeadline?: Date
  isOverdue: boolean
}

// Payment Compliance Status
export interface PaymentComplianceStatus {
  transactionId: string
  compliant: boolean
  hasRequiredReview: boolean
  hasRequiredApprovals: boolean
  hasRequiredSignatures: boolean
  hasRequiredDocumentation: boolean
  exceptions: PolicyException[]
  warnings: string[]
  complianceScore: number // 0-100
}

// E-Transfer Approval Requirements (GTHL Policy)
export interface ETransferApprovalRequirements {
  amountCents: number
  requiresTwoSigningAuthorities: boolean
  requiresDocumentedApproval: boolean
  requiresIndependentReview: boolean
  thresholdExceeded: boolean
  thresholdAmountCents: number // $100 = 10000 cents
}

// Cheque Requirements (GTHL Policy)
export interface ChequeRequirements {
  requiresTwoSignatures: boolean
  requiresIndependentParentRep: boolean
  requiresChequeImage: boolean
  requiresReview: boolean
}

// Cash Withdrawal Requirements (GTHL Policy)
export interface CashWithdrawalRequirements {
  requiresIndependentReview: boolean
  requiresDocumentation: boolean
  requiresApprovalEvidence: boolean
}

// Payment Method Validator
export interface PaymentMethodValidator {
  paymentMethod: PaymentMethod
  validate: (transaction: { id: string; amountCents: number; spendIntent?: any }) => Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }>
}

// Review Alert
export interface ReviewAlert {
  id: string
  transactionId: string
  severity: AlertSeverity
  message: string
  type: 'review_required' | 'review_overdue' | 'review_missing'
  dueDate?: Date
  isOverdue: boolean
  createdAt: Date
}

// Policy Exception Resolution
export interface PolicyExceptionResolution {
  exceptionId: string
  resolvedBy: string
  resolutionNotes: string
  resolutionAction: 'corrected' | 'documented' | 'escalated' | 'waived'
  resolvedAt: Date
}

// Reconciliation Status
export interface ReconciliationStatus {
  transactionId: string
  spendIntentId?: string | null
  plaidTransactionId?: string | null
  reconciled: boolean
  reconciliationDate?: Date
  discrepancyCents?: number
  discrepancyReason?: string
  requiresManualReview: boolean
}
