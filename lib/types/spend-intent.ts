/**
 * Spend Intent Types for GTHL Payment Tracking
 *
 * These types support the GTHL Team Bank Account Policy (June 2024)
 * for pre-payment authorization, approval workflows, and payment tracking.
 */

import type { PaymentMethod, AuthorizationType, SpendIntentStatus } from '@prisma/client'

// Core Spend Intent
export interface SpendIntent {
  id: string
  teamId: string
  createdByUserId: string
  amountCents: number
  currency: string
  vendorId?: string | null
  vendorName?: string | null
  budgetLineItemId?: string | null
  paymentMethod: PaymentMethod
  authorizationType: AuthorizationType
  requiresManualApproval: boolean
  status: SpendIntentStatus
  authorizedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Spend Intent with Relations
export interface SpendIntentWithRelations extends SpendIntent {
  creator: {
    id: string
    name: string
    email: string
    role: string
  }
  team: {
    id: string
    name: string
  }
  chequeMetadata?: ChequeMetadata | null
  transaction?: {
    id: string
    status: string
    transactionDate: Date
  } | null
  approvals: Array<{
    id: string
    status: string
    approvedBy: string
    approvedAt?: Date | null
    comment?: string | null
  }>
}

// Cheque Metadata
export interface ChequeMetadata {
  id: string
  spendIntentId: string
  chequeNumber: string
  signer1UserId?: string | null
  signer1Name?: string | null
  signer2UserId?: string | null
  signer2Name?: string | null
  issuedAt: Date
  chequeImageFileId?: string | null
  attestedByUserId?: string | null
  attestedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Cheque Metadata with Relations
export interface ChequeMetadataWithSigners extends ChequeMetadata {
  signer1?: {
    id: string
    name: string
    email: string
  } | null
  signer2?: {
    id: string
    name: string
    email: string
  } | null
  attestedBy?: {
    id: string
    name: string
    email: string
  } | null
}

// Spend Intent Creation
export interface CreateSpendIntentInput {
  teamId: string
  createdByUserId: string
  amountCents: number
  currency?: string
  vendorId?: string
  vendorName?: string
  budgetLineItemId?: string
  paymentMethod: PaymentMethod
  authorizationType?: AuthorizationType
  description?: string
  // For cheque payment method
  chequeNumber?: string
  signer1UserId?: string
  signer1Name?: string
  signer2UserId?: string
  signer2Name?: string
}

// Spend Intent Update
export interface UpdateSpendIntentInput {
  status?: SpendIntentStatus
  authorizedAt?: Date
  vendorId?: string
  vendorName?: string
  amountCents?: number
}

// Authorization Decision
export interface AuthorizationDecision {
  spendIntentId: string
  approved: boolean
  authorizationType: AuthorizationType
  requiresManualApproval: boolean
  reason: string
  checksRun: {
    budgetCheck: boolean
    vendorCheck: boolean
    amountThresholdCheck: boolean
    signingAuthorityCheck: boolean
  }
  violations?: string[]
}

// Spend Intent Summary (for dashboards)
export interface SpendIntentSummary {
  totalProposed: number
  totalAuthorizationPending: number
  totalAuthorized: number
  totalIssued: number
  totalOutstanding: number
  totalSettled: number
  totalReviewed: number
  totalReconciled: number
  amountByStatus: {
    [key in SpendIntentStatus]: number
  }
  amountByPaymentMethod: {
    [key in PaymentMethod]: number
  }
}

// Spend Intent Filter Options
export interface SpendIntentFilters {
  teamId: string
  status?: SpendIntentStatus | SpendIntentStatus[]
  paymentMethod?: PaymentMethod | PaymentMethod[]
  authorizationType?: AuthorizationType | AuthorizationType[]
  createdAfter?: Date
  createdBefore?: Date
  authorizedAfter?: Date
  authorizedBefore?: Date
  amountCentsMin?: number
  amountCentsMax?: number
  vendorId?: string
  createdByUserId?: string
  requiresManualApproval?: boolean
}

// Payment Method Requirements
export interface PaymentMethodRequirements {
  paymentMethod: PaymentMethod
  requiresTwoSigners: boolean
  requiresIndependentReviewer: boolean
  requiresChequeImage: boolean
  minSignersRequired: number
  mustIncludeIndependentParent: boolean
  amountThresholdCents?: number // For different approval thresholds
}

// GTHL Policy Compliance Check
export interface GTHLComplianceCheck {
  spendIntentId: string
  compliant: boolean
  paymentMethod: PaymentMethod
  amountCents: number
  checks: {
    hasRequiredSigners: boolean
    hasIndependentParentSigner: boolean
    hasChequeImage: boolean
    hasReview: boolean
    meetsAmountThresholdRequirements: boolean
  }
  violations: string[]
  warnings: string[]
}

export type SpendIntentStatusTransition =
  | 'propose'
  | 'request_authorization'
  | 'authorize'
  | 'issue_cheque'
  | 'mark_outstanding'
  | 'mark_paid'
  | 'settle'
  | 'review'
  | 'reconcile'
  | 'reject'
