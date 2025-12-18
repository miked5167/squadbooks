/**
 * Transaction status constants and utility functions
 * Single source of truth for status values and labels
 */

import { TransactionStatus } from '@prisma/client'

/**
 * Transaction status definitions with labels and descriptions
 */
export const TRANSACTION_STATUSES = {
  IMPORTED: {
    value: 'IMPORTED' as const,
    label: 'Imported',
    description: 'Bank import received, needs categorization and validation',
    color: 'gray' as const,
    icon: 'download' as const,
  },
  VALIDATED: {
    value: 'VALIDATED' as const,
    label: 'Validated',
    description: 'Passes all compliance checks',
    color: 'green' as const,
    icon: 'check-circle' as const,
  },
  EXCEPTION: {
    value: 'EXCEPTION' as const,
    label: 'Exception',
    description: 'Fails validation rules, needs review',
    color: 'yellow' as const,
    icon: 'alert-circle' as const,
  },
  RESOLVED: {
    value: 'RESOLVED' as const,
    label: 'Resolved',
    description: 'Exception addressed (corrected or overridden)',
    color: 'blue' as const,
    icon: 'check' as const,
  },
  LOCKED: {
    value: 'LOCKED' as const,
    label: 'Locked',
    description: 'Season closed, transaction immutable',
    color: 'purple' as const,
    icon: 'lock' as const,
  },
  DRAFT: {
    value: 'DRAFT' as const,
    label: 'Draft',
    description: 'Manual entry in progress',
    color: 'gray' as const,
    icon: 'edit' as const,
  },
  // Legacy statuses (for backward compatibility)
  PENDING: {
    value: 'PENDING' as const,
    label: 'Pending',
    description: 'Awaiting approval (legacy)',
    color: 'yellow' as const,
    icon: 'clock' as const,
  },
  APPROVED: {
    value: 'APPROVED' as const,
    label: 'Approved',
    description: 'Manually approved (legacy)',
    color: 'green' as const,
    icon: 'check-circle' as const,
  },
  APPROVED_AUTOMATIC: {
    value: 'APPROVED_AUTOMATIC' as const,
    label: 'Auto-Approved',
    description: 'Auto-approved via envelope or threshold (legacy)',
    color: 'green' as const,
    icon: 'check-circle' as const,
  },
  REJECTED: {
    value: 'REJECTED' as const,
    label: 'Rejected',
    description: 'Rejected (legacy)',
    color: 'red' as const,
    icon: 'x-circle' as const,
  },
} as const

/**
 * Status values for type safety
 */
export type TransactionStatusValue = keyof typeof TRANSACTION_STATUSES

/**
 * Get status configuration by value
 */
export function getStatusConfig(status: TransactionStatus) {
  return TRANSACTION_STATUSES[status] || TRANSACTION_STATUSES.DRAFT
}

/**
 * Check if status allows editing
 */
export function isEditableStatus(status: TransactionStatus): boolean {
  return ['DRAFT', 'IMPORTED', 'EXCEPTION'].includes(status)
}

/**
 * Check if status is final (no further changes allowed)
 */
export function isFinalStatus(status: TransactionStatus): boolean {
  return ['LOCKED', 'RESOLVED', 'VALIDATED'].includes(status)
}

/**
 * Check if status requires action
 */
export function requiresAction(status: TransactionStatus): boolean {
  return ['IMPORTED', 'EXCEPTION'].includes(status)
}

/**
 * Check if status is a legacy status
 */
export function isLegacyStatus(status: TransactionStatus): boolean {
  return ['PENDING', 'APPROVED', 'APPROVED_AUTOMATIC', 'REJECTED'].includes(
    status
  )
}

/**
 * Valid status transitions
 */
export const STATUS_TRANSITIONS: Record<
  TransactionStatus,
  TransactionStatus[]
> = {
  // New statuses
  DRAFT: ['IMPORTED', 'VALIDATED', 'EXCEPTION'],
  IMPORTED: ['DRAFT', 'VALIDATED', 'EXCEPTION'],
  EXCEPTION: ['DRAFT', 'VALIDATED', 'RESOLVED'],
  VALIDATED: ['EXCEPTION', 'LOCKED'], // Can be re-validated or locked
  RESOLVED: ['LOCKED'], // Can only be locked after resolution
  LOCKED: [], // Terminal state, no transitions

  // Legacy statuses (for backward compatibility)
  PENDING: ['APPROVED', 'REJECTED', 'EXCEPTION'], // Can transition to new model
  APPROVED: ['LOCKED', 'VALIDATED'], // Can transition to new model
  APPROVED_AUTOMATIC: ['LOCKED', 'VALIDATED'], // Can transition to new model
  REJECTED: [], // Terminal state
}

/**
 * Check if transition is valid
 */
export function isValidTransition(
  from: TransactionStatus,
  to: TransactionStatus
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get next possible statuses from current status
 */
export function getNextPossibleStatuses(
  currentStatus: TransactionStatus
): TransactionStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Get all active (non-legacy) statuses
 */
export function getActiveStatuses(): TransactionStatus[] {
  return ['IMPORTED', 'VALIDATED', 'EXCEPTION', 'RESOLVED', 'LOCKED', 'DRAFT']
}

/**
 * Map legacy status to new status (migration helper)
 */
export function mapLegacyToNewStatus(
  legacyStatus: TransactionStatus
): TransactionStatus {
  const mapping: Partial<Record<TransactionStatus, TransactionStatus>> = {
    APPROVED_AUTOMATIC: 'VALIDATED',
    PENDING: 'EXCEPTION',
    APPROVED: 'RESOLVED',
    REJECTED: 'EXCEPTION',
    DRAFT: 'DRAFT',
  }

  return mapping[legacyStatus] || legacyStatus
}
