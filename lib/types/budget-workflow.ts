/**
 * Budget Versioning Workflow Type Definitions
 *
 * Implements the complete budget lifecycle from DRAFT to LOCKED
 * with versioning, parent approvals, and threshold-based locking.
 */

import { BudgetStatus, ThresholdMode } from '@prisma/client'

// ============================================
// BUDGET WORKFLOW TYPES
// ============================================

export { BudgetStatus, ThresholdMode }

export interface BudgetWithVersion {
  id: string
  teamId: string
  season: string
  status: BudgetStatus
  currentVersionNumber: number
  presentedVersionNumber: number | null
  createdBy: string
  createdAt: Date
  updatedAt: Date
  lockedAt: Date | null
  lockedBy: string | null
  currentVersion?: BudgetVersionWithAllocations
  presentedVersion?: BudgetVersionWithAllocations
  thresholdConfig?: ThresholdConfig
}

export interface BudgetVersionWithAllocations {
  id: string
  budgetId: string
  versionNumber: number
  totalBudget: number
  changeSummary: string | null
  createdBy: string
  createdAt: Date
  coachApprovedAt: Date | null
  coachApprovedBy: string | null
  coachNotes: string | null
  allocations: BudgetAllocationDetail[]
  approvals?: BudgetVersionApprovalDetail[]
  approvalProgress?: ApprovalProgress
}

export interface BudgetAllocationDetail {
  id: string
  budgetVersionId: string
  categoryId: string
  categoryName: string
  categoryHeading: string
  allocated: number
  notes: string | null
}

export interface BudgetVersionApprovalDetail {
  id: string
  budgetVersionId: string
  familyId: string
  familyName: string
  acknowledgedAt: Date
  acknowledgedBy: string
  acknowledgedByName: string
  comment: string | null
  hasQuestions: boolean
}

export interface ThresholdConfig {
  id: string
  budgetId: string
  mode: ThresholdMode
  countThreshold: number | null
  percentThreshold: number | null
  eligibleFamilyCount: number
}

export interface ApprovalProgress {
  approvedCount: number
  eligibleCount: number
  percentApproved: number
  thresholdMet: boolean
  thresholdMode: ThresholdMode
  thresholdValue: number // Either count or percentage
}

// ============================================
// STATE TRANSITION TYPES
// ============================================

export interface SubmitForReviewInput {
  budgetId: string
  userId: string
}

export interface CoachReviewInput {
  budgetId: string
  versionNumber: number
  userId: string
  approved: boolean
  notes?: string
}

export interface PresentToParentsInput {
  budgetId: string
  versionNumber: number
  userId: string
}

export interface ProposeUpdateInput {
  budgetId: string
  userId: string
  changeSummary: string
  allocations: Array<{
    categoryId: string
    allocated: number
    notes?: string
  }>
}

export interface AcknowledgeBudgetInput {
  budgetVersionId: string
  familyId: string
  userId: string
  comment?: string
  hasQuestions?: boolean
  ipAddress?: string
  userAgent?: string
}

// ============================================
// VALIDATION & ERROR TYPES
// ============================================

export type BudgetWorkflowError =
  | 'BUDGET_NOT_FOUND'
  | 'VERSION_NOT_FOUND'
  | 'INVALID_STATUS_TRANSITION'
  | 'UNAUTHORIZED'
  | 'BUDGET_LOCKED'
  | 'ALREADY_ACKNOWLEDGED'
  | 'VERSION_MISMATCH'
  | 'MISSING_CHANGE_SUMMARY'
  | 'INVALID_ALLOCATIONS'
  | 'THRESHOLD_NOT_MET'

export interface BudgetWorkflowResult<T = void> {
  success: boolean
  data?: T
  error?: {
    code: BudgetWorkflowError
    message: string
    details?: Record<string, unknown>
  }
}

// ============================================
// ALLOWED TRANSITIONS
// ============================================

export const ALLOWED_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
  [BudgetStatus.DRAFT]: [BudgetStatus.REVIEW],
  [BudgetStatus.REVIEW]: [BudgetStatus.DRAFT, BudgetStatus.ASSOCIATION_REVIEW, BudgetStatus.TEAM_APPROVED],
  [BudgetStatus.ASSOCIATION_REVIEW]: [BudgetStatus.DRAFT, BudgetStatus.TEAM_APPROVED], // Association can approve or request changes
  [BudgetStatus.TEAM_APPROVED]: [BudgetStatus.PRESENTED, BudgetStatus.REVIEW],
  [BudgetStatus.PRESENTED]: [BudgetStatus.APPROVED, BudgetStatus.REVIEW], // Can go back to review if edits needed
  [BudgetStatus.APPROVED]: [BudgetStatus.LOCKED],
  [BudgetStatus.LOCKED]: [], // Final state, no transitions
}

export function canTransition(from: BudgetStatus, to: BudgetStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

// ============================================
// UI HELPERS
// ============================================

export interface BudgetStatusBadge {
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
  description: string
}

export function getBudgetStatusBadge(status: BudgetStatus): BudgetStatusBadge {
  switch (status) {
    case BudgetStatus.DRAFT:
      return {
        label: 'Draft',
        variant: 'outline',
        description: 'Budget is being edited by treasurer',
      }
    case BudgetStatus.REVIEW:
      return {
        label: 'In Review',
        variant: 'warning',
        description: 'Awaiting coach approval',
      }
    case BudgetStatus.ASSOCIATION_REVIEW:
      return {
        label: 'Association Review',
        variant: 'warning',
        description: 'Awaiting association approval',
      }
    case BudgetStatus.TEAM_APPROVED:
      return {
        label: 'Team Approved',
        variant: 'success',
        description: 'Approved by coach, ready to present',
      }
    case BudgetStatus.PRESENTED:
      return {
        label: 'Presented to Parents',
        variant: 'secondary',
        description: 'Awaiting parent approvals',
      }
    case BudgetStatus.APPROVED:
      return {
        label: 'Approved',
        variant: 'success',
        description: 'Threshold met, ready to lock',
      }
    case BudgetStatus.LOCKED:
      return {
        label: 'Locked',
        variant: 'default',
        description: 'Budget is final and immutable',
      }
  }
}

export function getThresholdDescription(config: ThresholdConfig): string {
  if (config.mode === ThresholdMode.COUNT) {
    return `Locks after ${config.countThreshold} ${config.countThreshold === 1 ? 'family approves' : 'families approve'}`
  } else {
    return `Locks at ${config.percentThreshold}% parent approval`
  }
}
