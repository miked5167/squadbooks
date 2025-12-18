/**
 * Transaction UI Mapping Utilities
 *
 * Maps transaction data to validation-first UI model.
 * Handles backward compatibility with legacy approval-based statuses.
 *
 * IMPORTANT RULES (bias toward normal operations):
 * 1. "Resolved" is ONLY for exceptions with resolution_json/override metadata
 * 2. "Validated" means compliant with policy/budget (no violations)
 * 3. "Exception" means EXPLICIT rule violation (violations array or clear breach)
 * 4. "Imported/Needs info" means missing data or awaiting validation (NOT exception)
 * 5. Legacy statuses (PENDING, DRAFT, APPROVED) help decide Imported vs Validated
 *    but do NOT force Exception unless violations are present
 * 6. Income defaults to Validated/Compliant unless explicitly flagged
 *
 * KEY DISTINCTION:
 * - Missing info (no category, no receipt) = Imported/Needs info (fixable by user)
 * - Policy violation (over budget, wrong category) = Exception (requires review/override)
 */

export type TransactionStatus =
  // New validation-first statuses
  | 'IMPORTED'
  | 'VALIDATED'
  | 'EXCEPTION'
  | 'RESOLVED'
  | 'LOCKED'
  // Legacy approval statuses (backward compatibility)
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

export type ValidationState = 'compliant' | 'exception' | 'needs_info'
export type LifecycleState = 'imported' | 'validated' | 'exception' | 'resolved'
export type Severity = 'low' | 'medium' | 'high'

export interface TransactionUIState {
  lifecycleState: LifecycleState
  validationState: ValidationState
  statusLabel: string
  statusColor: string
  validationLabel: string
  validationColor: string
  validationIcon: string
  severity?: Severity
  reasons?: string[]
}

interface TransactionInput {
  status: TransactionStatus
  validation?: {
    compliant: boolean
    violations?: Array<{
      code?: string
      message?: string
      severity?: string
    }>
  } | null
  exceptionReason?: string | null
  resolvedAt?: Date | string | null
  overrideJustification?: string | null
  resolutionNotes?: string | null
  categoryId?: string | null
  receiptUrl?: string | null
  amount?: number | string
  type?: 'INCOME' | 'EXPENSE'
}

interface MappingOptions {
  receiptRequiredOver?: number // Amount threshold requiring receipt
}

/**
 * Map transaction to UI display state
 * Follows strict validation-first logic order:
 * 1. Check if resolved (exception that was addressed)
 * 2. Check validation result
 * 3. Fallback to legacy status mapping
 */
export function mapTransactionToUIState(
  transaction: TransactionInput,
  options: MappingOptions = {}
): TransactionUIState {
  const { receiptRequiredOver = 100 } = options
  const reasons: string[] = []

  // RULE 1: Check if this is a resolved exception
  // Resolved is ONLY for exceptions that were addressed
  const hasResolution = !!transaction.resolvedAt || !!transaction.overrideJustification || !!transaction.resolutionNotes
  if (hasResolution) {
    return {
      lifecycleState: 'resolved',
      validationState: 'exception', // Was an exception, now resolved
      statusLabel: 'Resolved',
      statusColor: 'bg-meadow/10 text-meadow border-meadow/30',
      validationLabel: 'Exception',
      validationColor: 'bg-green-100 text-green-700 border-green-300',
      validationIcon: '✅',
      reasons: ['Exception resolved']
    }
  }

  // RULE 2: Check validation_json if it exists (preferred)
  if (transaction.validation) {
    if (transaction.validation.compliant === true) {
      // Fully compliant transaction
      return {
        lifecycleState: 'validated',
        validationState: 'compliant',
        statusLabel: 'Validated',
        statusColor: 'bg-meadow/10 text-meadow border-meadow/30',
        validationLabel: 'Compliant',
        validationColor: 'bg-green-100 text-green-700 border-green-300',
        validationIcon: '✅',
      }
    } else {
      // Has violations - this is an exception
      const violations = transaction.validation.violations || []

      // Extract top 1-2 violation messages (max 40 chars each)
      violations.slice(0, 2).forEach(v => {
        const msg = v.message || v.code || 'Rule violation'
        reasons.push(msg.length > 40 ? msg.substring(0, 37) + '...' : msg)
      })

      // Determine severity from violations
      let severity: Severity = 'low'
      if (violations.some(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')) {
        severity = 'high'
      } else if (violations.some(v => v.severity === 'MEDIUM')) {
        severity = 'medium'
      }

      return {
        lifecycleState: 'exception',
        validationState: 'exception',
        statusLabel: 'Exception',
        statusColor: 'bg-amber-100 text-amber-700 border-amber-300',
        validationLabel: 'Exception',
        validationColor: 'bg-red-100 text-red-700 border-red-300',
        validationIcon: '⚠️',
        severity,
        reasons: reasons.length > 0 ? reasons : ['Review required']
      }
    }
  }

  // RULE 3: Legacy fallback - map old status to new semantics
  const status = transaction.status

  // Check for missing required fields first
  const missingCategory = !transaction.categoryId
  const amount = typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : (transaction.amount || 0)
  const receiptRequired = transaction.type === 'EXPENSE' && amount > receiptRequiredOver
  const missingReceipt = receiptRequired && !transaction.receiptUrl

  // If missing category, always show as imported/needs_info
  if (missingCategory) {
    reasons.push('Missing category')
    return {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      validationLabel: 'Needs info',
      validationColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationIcon: '⏳',
      reasons
    }
  }

  // If missing required receipt, this is missing info (not an exception)
  if (missingReceipt) {
    reasons.push('Receipt required')
    return {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      validationLabel: 'Needs info',
      validationColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationIcon: '⏳',
      reasons
    }
  }

  // Legacy status mapping
  if (status === 'APPROVED') {
    // Approved = validated and compliant
    return {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      statusColor: 'bg-meadow/10 text-meadow border-meadow/30',
      validationLabel: 'Compliant',
      validationColor: 'bg-green-100 text-green-700 border-green-300',
      validationIcon: '✅',
    }
  }

  if (status === 'PENDING') {
    // Pending = awaiting validation, not yet an exception
    reasons.push('Pending validation')
    return {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      validationLabel: 'Needs info',
      validationColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationIcon: '⏳',
      reasons
    }
  }

  if (status === 'DRAFT') {
    // Draft = imported, needs validation
    reasons.push('Pending validation')
    return {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      validationLabel: 'Needs info',
      validationColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationIcon: '⏳',
      reasons
    }
  }

  if (status === 'REJECTED') {
    // Rejected = exception
    reasons.push('Review required')
    return {
      lifecycleState: 'exception',
      validationState: 'exception',
      statusLabel: 'Exception',
      statusColor: 'bg-red-100 text-red-700 border-red-300',
      validationLabel: 'Exception',
      validationColor: 'bg-red-100 text-red-700 border-red-300',
      validationIcon: '⚠️',
      reasons
    }
  }

  // Handle new statuses that might come from backend
  if (status === 'VALIDATED') {
    return {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      statusColor: 'bg-meadow/10 text-meadow border-meadow/30',
      validationLabel: 'Compliant',
      validationColor: 'bg-green-100 text-green-700 border-green-300',
      validationIcon: '✅',
    }
  }

  if (status === 'EXCEPTION') {
    const msg = transaction.exceptionReason || 'Review required'
    reasons.push(msg.length > 40 ? msg.substring(0, 37) + '...' : msg)
    return {
      lifecycleState: 'exception',
      validationState: 'exception',
      statusLabel: 'Exception',
      statusColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationLabel: 'Exception',
      validationColor: 'bg-red-100 text-red-700 border-red-300',
      validationIcon: '⚠️',
      reasons
    }
  }

  if (status === 'RESOLVED') {
    // Resolved status from backend
    return {
      lifecycleState: 'resolved',
      validationState: 'exception',
      statusLabel: 'Resolved',
      statusColor: 'bg-meadow/10 text-meadow border-meadow/30',
      validationLabel: 'Exception',
      validationColor: 'bg-green-100 text-green-700 border-green-300',
      validationIcon: '✅',
      reasons: ['Exception resolved']
    }
  }

  if (status === 'IMPORTED') {
    reasons.push('Pending validation')
    return {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      validationLabel: 'Needs info',
      validationColor: 'bg-amber-100 text-amber-700 border-amber-300',
      validationIcon: '⏳',
      reasons
    }
  }

  // Fallback for unknown status
  return {
    lifecycleState: 'imported',
    validationState: 'needs_info',
    statusLabel: 'Imported',
    statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
    validationLabel: 'Needs info',
    validationColor: 'bg-gray-100 text-gray-700 border-gray-300',
    validationIcon: '❓',
    reasons: ['Status unknown']
  }
}

/**
 * Map UI filter value to backend status filter
 * Handles mapping from new validation-first tabs to potentially legacy backend statuses
 */
export function mapUIFilterToBackendStatus(uiFilter: string): string | undefined {
  const mapping: Record<string, string | undefined> = {
    'all': undefined,
    'imported': 'IMPORTED',
    'validated': 'VALIDATED',
    'exceptions': 'EXCEPTION',
    'resolved': 'RESOLVED',
    // Legacy support (if UI accidentally uses old values)
    'approved': 'APPROVED',
    'pending': 'PENDING',
    'draft': 'DRAFT',
  }

  return mapping[uiFilter.toLowerCase()]
}

/**
 * Get tab counts for each filter
 * This would typically be fetched from an API, but here's the structure
 */
export interface TabCounts {
  all: number
  imported: number
  validated: number
  exceptions: number
  resolved: number
}
