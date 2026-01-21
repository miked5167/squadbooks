/**
 * GTHL Policy Types
 *
 * Types for Greater Toronto Hockey League (GTHL) Team Bank Account Policy (June 2024)
 * Defines approval structures, signing authority requirements, and compliance checks.
 */

import type { PaymentMethod, AuthorizationType } from '@prisma/client'

// GTHL Policy Constants
export const GTHL_POLICY_CONSTANTS = {
  // E-Transfer thresholds (in cents)
  ETRANSFER_TWO_SIGNER_THRESHOLD: 10_000, // $100.00

  // Payment method requirements
  PAYMENT_METHODS: {
    E_TRANSFER: {
      requiresTwoSignersAbove: 10_000, // $100
      requiresDocumentedApproval: true,
      requiresIndependentReview: true,
    },
    CHEQUE: {
      requiresTwoSignatures: true,
      requiresIndependentParentRep: true,
      requiresChequeImage: true,
    },
    CASH: {
      requiresIndependentReview: true,
      requiresDocumentation: true,
    },
  },

  // Review deadlines (in days)
  REVIEW_DEADLINE_DAYS: 7,

  // Signing authority requirements
  MIN_SIGNING_AUTHORITIES: 2,
  MIN_INDEPENDENT_PARENTS: 1,
} as const

// GTHL Signing Authority Type
export type GTHLSigningAuthorityType =
  | 'TREASURER'
  | 'ASSISTANT_TREASURER'
  | 'INDEPENDENT_PARENT_REP'
  | 'BOARD_MEMBER'

// Signing Authority
export interface GTHLSigningAuthority {
  id: string
  userId: string
  teamId: string
  type: GTHLSigningAuthorityType
  name: string
  email: string
  isIndependentParent: boolean
  hasFinanceExperience: boolean
  backgroundCheckComplete: boolean
  appointedDate: Date
  removedDate?: Date | null
  isActive: boolean
}

// Approval Structure
export interface GTHLApprovalStructure {
  paymentMethod: PaymentMethod
  amountCents: number
  requiredSigners: number
  requiresIndependentParentSigner: boolean
  requiresDocumentedEvidence: boolean
  requiresIndependentReview: boolean
  authorizationType: AuthorizationType
}

// E-Transfer Policy Rules
export interface GTHLETransferPolicy {
  amountCents: number
  requiresTwoSigningAuthorities: boolean
  requiredSigners: GTHLSigningAuthority[]
  requiresDocumentedApproval: boolean
  requiresIndependentReview: boolean
  approvalDeadlineHours: number
  evidenceRequired: {
    emailApproval: boolean
    boardMinutes: boolean
    budgetReference: boolean
  }
}

// Cheque Policy Rules
export interface GTHLChequePolicy {
  requiresTwoSignatures: boolean
  requiredSigners: GTHLSigningAuthority[]
  mustIncludeIndependentParent: boolean
  requiresChequeImage: boolean
  requiresReview: boolean
  evidenceRequired: {
    signedChequeImage: boolean
    paymentApproval: boolean
  }
}

// Cash Withdrawal Policy Rules
export interface GTHLCashWithdrawalPolicy {
  requiresIndependentReview: boolean
  requiresDocumentation: boolean
  evidenceRequired: {
    withdrawalReceipt: boolean
    purposeDocumentation: boolean
    reviewerSignOff: boolean
  }
}

// Policy Compliance Check Result
export interface GTHLPolicyComplianceResult {
  compliant: boolean
  paymentMethod: PaymentMethod
  amountCents: number
  checksPerformed: {
    signingAuthorityCheck: boolean
    independentParentCheck: boolean
    documentationCheck: boolean
    reviewCheck: boolean
    approvalTimingCheck: boolean
  }
  violations: GTHLPolicyViolation[]
  warnings: string[]
  complianceScore: number // 0-100
  timestamp: Date
}

// Policy Violation
export interface GTHLPolicyViolation {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  policyReference: string // Section of GTHL policy
  remediation: string // How to fix
  detectedAt: Date
}

// Payment Authorization Requirements
export interface GTHLPaymentAuthorizationRequirements {
  paymentMethod: PaymentMethod
  amountCents: number
  requiredApprovals: {
    signingAuthorities: number
    independentParents: number
    boardApproval: boolean
  }
  requiredDocumentation: string[]
  requiredReviews: {
    prePaymentReview: boolean
    postPaymentReview: boolean
    reviewerMustBeIndependent: boolean
  }
  timeline: {
    approvalWindowHours: number
    reviewDeadlineDays: number
  }
}

// Signing Authority Composition Requirements
export interface GTHLSigningAuthorityComposition {
  minimumTotal: number
  minimumIndependentParents: number
  allowedTypes: GTHLSigningAuthorityType[]
  backgroundCheckRequired: boolean
  financeExperiencePreferred: boolean
}

// Transaction Approval Evidence
export interface GTHLTransactionApprovalEvidence {
  transactionId: string
  spendIntentId?: string
  paymentMethod: PaymentMethod
  amountCents: number
  evidence: {
    emailApprovals: Array<{
      from: string
      to: string
      subject: string
      date: Date
      fileId?: string
    }>
    boardMinutes: Array<{
      meetingDate: Date
      motionNumber?: string
      excerpt: string
      fileId?: string
    }>
    chequeImages: Array<{
      chequeNumber: string
      imageFileId: string
      uploadedAt: Date
      uploadedBy: string
    }>
    signerAttestation: Array<{
      signerId: string
      signerName: string
      attestedAt: Date
      signature?: string
    }>
  }
  evidenceComplete: boolean
  evidenceGaps: string[]
}

// Review Process
export interface GTHLReviewProcess {
  transactionId: string
  paymentMethod: PaymentMethod
  amountCents: number
  reviewRequired: boolean
  reviewType: 'PRE_PAYMENT' | 'POST_PAYMENT' | 'BOTH'
  reviewer: {
    userId: string
    name: string
    isIndependent: boolean
    qualifications: string[]
  }
  reviewDeadline: Date
  reviewStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  reviewChecklist: GTHLReviewChecklist
}

// Review Checklist
export interface GTHLReviewChecklist {
  items: Array<{
    id: string
    description: string
    required: boolean
    completed: boolean
    completedAt?: Date
    completedBy?: string
    notes?: string
  }>
  allRequiredComplete: boolean
  completionPercentage: number
}

// Policy Violation Report
export interface GTHLPolicyViolationReport {
  teamId: string
  reportPeriod: {
    start: Date
    end: Date
  }
  totalTransactions: number
  totalViolations: number
  violationsByType: {
    [key: string]: number
  }
  violationsBySeverity: {
    LOW: number
    MEDIUM: number
    HIGH: number
    CRITICAL: number
  }
  complianceRate: number // Percentage
  topViolations: Array<{
    type: string
    count: number
    totalAmountCents: number
  }>
  recommendations: string[]
  generatedAt: Date
}

// Policy Configuration
export interface GTHLPolicyConfiguration {
  teamId: string
  effectiveDate: Date
  eTransferThresholdCents: number
  signingAuthorityComposition: GTHLSigningAuthorityComposition
  paymentMethodRules: {
    [key in PaymentMethod]: {
      enabled: boolean
      requiresApproval: boolean
      requiresReview: boolean
      customRules?: Record<string, any>
    }
  }
  reviewDeadlineDays: number
  enforceStrictCompliance: boolean
  allowExceptions: boolean
  customPolicies?: Record<string, any>
  updatedAt: Date
  updatedBy: string
}

// Compliance Dashboard Summary
export interface GTHLComplianceDashboard {
  teamId: string
  period: {
    start: Date
    end: Date
  }
  overallComplianceRate: number
  metrics: {
    totalPayments: number
    compliantPayments: number
    pendingReviews: number
    overdueReviews: number
    activeViolations: number
    resolvedViolations: number
  }
  byPaymentMethod: {
    [key in PaymentMethod]: {
      count: number
      compliant: number
      complianceRate: number
    }
  }
  recentViolations: GTHLPolicyViolation[]
  upcomingReviews: Array<{
    transactionId: string
    dueDate: Date
    daysUntilDue: number
  }>
  recommendations: string[]
}
