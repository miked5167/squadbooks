/**
 * Approval Types for GTHL Compliance
 *
 * Types for managing approval workflows, dual approvals, and signing authority
 * requirements per GTHL Team Bank Account Policy.
 */

import type { ApprovalStatus, PaymentMethod, AuthorizationType } from '@prisma/client'

// Approval
export interface Approval {
  id: string
  transactionId: string
  approvedBy: string
  createdBy: string
  status: ApprovalStatus
  comment?: string | null
  approvedAt?: Date | null
  teamId: string
  createdAt: Date
  updatedAt: Date
  assignedTo?: string | null
  roleRequired?: string | null
}

// Approval with Relations
export interface ApprovalWithRelations extends Approval {
  transaction: {
    id: string
    amount: number
    vendor: string
    transactionDate: Date
    status: string
    spendIntentId?: string | null
  }
  approver: {
    id: string
    name: string
    email: string
    role: string
    isSigningAuthority: boolean
  }
  assignedToUser?: {
    id: string
    name: string
    email: string
    role: string
  } | null
}

// Approval Requirements
export interface ApprovalRequirements {
  transactionId?: string
  spendIntentId?: string
  amountCents: number
  paymentMethod: PaymentMethod
  authorizationType: AuthorizationType
  requiredApprovals: {
    count: number
    requiresIndependentParent: boolean
    requiresTreasurer: boolean
    requiresBoardMember: boolean
  }
  dualApprovalRequired: boolean
  approvalDeadlineHours: number
}

// Approval Request
export interface ApprovalRequest {
  spendIntentId?: string
  transactionId?: string
  requestedBy: string
  assignedTo?: string
  roleRequired?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueBy?: Date
  context: {
    amount: number
    vendor: string
    description?: string
    paymentMethod: PaymentMethod
  }
  requiredDocumentation?: string[]
}

// Approval Decision
export interface ApprovalDecision {
  approvalId: string
  decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'
  approvedBy: string
  comment?: string
  approvedAt: Date
  conditions?: string[]
  nextSteps?: string[]
}

// Dual Approval Status
export interface DualApprovalStatus {
  transactionId?: string
  spendIntentId?: string
  required: boolean
  approvals: Array<{
    approvalId: string
    approverName: string
    approverRole: string
    status: ApprovalStatus
    approvedAt?: Date | null
    isIndependent: boolean
  }>
  requirementsCount: number
  completedApprovals: number
  pendingApprovals: number
  hasIndependentApprover: boolean
  isComplete: boolean
  canProceed: boolean
}

// Signing Authority Approval
export interface SigningAuthorityApproval {
  approvalId: string
  signerId: string
  signerName: string
  signerRole: string
  isIndependentParent: boolean
  hasFinanceExperience: boolean
  backgroundCheckComplete: boolean
  approvedAt: Date
  digitalSignature?: string
  ipAddress?: string
  device?: string
}

// Approval Workflow
export interface ApprovalWorkflow {
  spendIntentId?: string
  transactionId?: string
  paymentMethod: PaymentMethod
  amountCents: number
  currentStep: number
  totalSteps: number
  steps: ApprovalWorkflowStep[]
  status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'EXPIRED'
  startedAt: Date
  completedAt?: Date
}

// Approval Workflow Step
export interface ApprovalWorkflowStep {
  stepNumber: number
  stepName: string
  description: string
  required: boolean
  assignedTo?: string | null
  assignedToRole?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  completedAt?: Date
  completedBy?: string
  canSkip: boolean
  dependencies?: number[] // Step numbers that must complete first
}

// Approval Timeline Event
export interface ApprovalTimelineEvent {
  id: string
  transactionId?: string
  spendIntentId?: string
  eventType:
    | 'CREATED'
    | 'ASSIGNED'
    | 'APPROVED'
    | 'REJECTED'
    | 'COMMENT'
    | 'REASSIGNED'
    | 'ESCALATED'
  performedBy: string
  performedByName: string
  timestamp: Date
  details: Record<string, any>
  visibility: 'PUBLIC' | 'INTERNAL' | 'AUDIT_ONLY'
}

// Approval Summary
export interface ApprovalSummary {
  teamId: string
  period: {
    start: Date
    end: Date
  }
  totalApprovals: number
  approvalsByStatus: {
    [key in ApprovalStatus]: number
  }
  averageApprovalTimeHours: number
  approvalsByPaymentMethod: {
    [key in PaymentMethod]: number
  }
  dualApprovalsRequired: number
  dualApprovalsCompleted: number
  overdueApprovals: number
  approverPerformance: Array<{
    userId: string
    name: string
    totalAssigned: number
    totalCompleted: number
    averageTimeHours: number
  }>
}

// Approval Notification
export interface ApprovalNotification {
  approvalId: string
  recipientUserId: string
  notificationType:
    | 'NEW_APPROVAL_REQUEST'
    | 'APPROVAL_REMINDER'
    | 'APPROVAL_ESCALATION'
    | 'APPROVAL_COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  subject: string
  message: string
  actionUrl: string
  sendAt: Date
  sentAt?: Date
  readAt?: Date
}

// Approval Escalation
export interface ApprovalEscalation {
  approvalId: string
  originalAssignee: string
  escalatedTo: string
  escalatedBy: string
  reason: string
  escalatedAt: Date
  dueBy: Date
  priority: 'HIGH' | 'URGENT'
}

// Approval Audit Trail
export interface ApprovalAuditTrail {
  approvalId: string
  events: Array<{
    eventType: string
    timestamp: Date
    userId: string
    userName: string
    details: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }>
  createdAt: Date
  lastModifiedAt: Date
}

// Create Approval Input
export interface CreateApprovalInput {
  transactionId?: string
  spendIntentId?: string
  createdBy: string
  approvedBy: string
  teamId: string
  assignedTo?: string
  roleRequired?: string
  comment?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}

// Update Approval Input
export interface UpdateApprovalInput {
  status?: ApprovalStatus
  comment?: string
  approvedAt?: Date
  assignedTo?: string
}

// Approval Metrics
export interface ApprovalMetrics {
  teamId: string
  period: {
    start: Date
    end: Date
  }
  totalRequests: number
  approvedCount: number
  rejectedCount: number
  pendingCount: number
  averageApprovalTime: number // in hours
  medianApprovalTime: number // in hours
  approvalRate: number // percentage
  bottlenecks: Array<{
    userId: string
    userName: string
    pendingCount: number
    averageDelayHours: number
  }>
}
