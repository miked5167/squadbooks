/**
 * Validation types for the validation-first transaction lifecycle model
 */

/**
 * Violation severity levels
 */
export enum ViolationSeverity {
  /** Informational only, does not block */
  INFO = 'INFO',

  /** Warning, may require attention but not blocking */
  WARNING = 'WARNING',

  /** Error, blocks validation (transaction becomes EXCEPTION) */
  ERROR = 'ERROR',

  /** Critical error, immediate attention required */
  CRITICAL = 'CRITICAL',
}

/**
 * Violation code taxonomy
 */
export enum ViolationCode {
  // Budget violations
  BUDGET_OVERRUN = 'BUDGET_OVERRUN',
  CATEGORY_OVER_LIMIT = 'CATEGORY_OVER_LIMIT',
  CATEGORY_NOT_ALLOCATED = 'CATEGORY_NOT_ALLOCATED',
  ENVELOPE_CAP_EXCEEDED = 'ENVELOPE_CAP_EXCEEDED',

  // Receipt/documentation violations
  MISSING_RECEIPT = 'MISSING_RECEIPT',
  RECEIPT_AMOUNT_MISMATCH = 'RECEIPT_AMOUNT_MISMATCH',
  MISSING_DESCRIPTION = 'MISSING_DESCRIPTION',

  // Threshold violations
  THRESHOLD_BREACH = 'THRESHOLD_BREACH',
  LARGE_TRANSACTION = 'LARGE_TRANSACTION',

  // Category/classification violations
  UNAPPROVED_CATEGORY = 'UNAPPROVED_CATEGORY',
  INVALID_CATEGORY = 'INVALID_CATEGORY',
  UNCATEGORIZED = 'UNCATEGORIZED',

  // Vendor/payment method violations
  CASH_LIKE_TRANSACTION = 'CASH_LIKE_TRANSACTION', // Venmo, Cash App, etc.
  UNVERIFIED_VENDOR = 'UNVERIFIED_VENDOR',
  SUSPICIOUS_VENDOR = 'SUSPICIOUS_VENDOR',

  // Date/timing violations
  TRANSACTION_TOO_OLD = 'TRANSACTION_TOO_OLD',
  TRANSACTION_TOO_FUTURE = 'TRANSACTION_TOO_FUTURE',
  OUTSIDE_SEASON_DATES = 'OUTSIDE_SEASON_DATES',

  // Association rule violations
  ASSOCIATION_RULE_VIOLATION = 'ASSOCIATION_RULE_VIOLATION',
  PROHIBITED_EXPENSE_TYPE = 'PROHIBITED_EXPENSE_TYPE',

  // Duplicate detection
  POTENTIAL_DUPLICATE = 'POTENTIAL_DUPLICATE',

  // Data quality issues
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_DATE = 'INVALID_DATE',
}

/**
 * Individual rule violation
 */
export interface Violation {
  /** Violation code from taxonomy */
  code: ViolationCode

  /** Severity level */
  severity: ViolationSeverity

  /** Human-readable message */
  message: string

  /** Optional rule ID that was violated */
  ruleId?: string

  /** Additional context data */
  metadata?: Record<string, any>
}

/**
 * Validation checks that can be performed
 */
export interface ValidationChecks {
  budget: boolean
  receipt: boolean
  category: boolean
  envelope: boolean
  threshold: boolean
  associationRules: boolean
  dates: boolean
  vendor: boolean
  duplicates: boolean
}

/**
 * Validation result for a transaction
 */
export interface ValidationResult {
  /** Overall compliance - true if no blocking violations */
  compliant: boolean

  /** List of rule violations found */
  violations: Violation[]

  /** Optional compliance score 0-100 (100 = perfect) */
  score?: number

  /** Timestamp of validation */
  validatedAt: Date

  /** Which checks were performed */
  checksRun: ValidationChecks
}

/**
 * Context needed for validation
 */
export interface ValidationContext {
  transaction: {
    amount: number
    type: 'INCOME' | 'EXPENSE'
    categoryId: string | null
    systemCategoryId: string | null
    vendor: string
    transactionDate: Date
    receiptUrl: string | null
    description: string | null
  }

  budget?: {
    id: string
    status: string
    allocations: Array<{
      categoryId: string
      allocated: number
      spent: number
    }>
  }

  envelopes?: Array<{
    id: string
    categoryId: string
    vendorMatch: string | null
    vendorMatchType: string
    capAmount: number
    spent: number
    maxSingleTransaction: number | null
  }>

  teamSettings: {
    receiptThreshold: number // e.g., 100.00
    largeTransactionThreshold: number // e.g., 200.00
  }

  associationRules?: {
    transactionAmountLimit: number
    categoryOverrunTolerancePercent: number
    receiptRequiredOverAmount: number
    cashLikeRequiresReview: boolean
    requireApprovalOnBudgetChange: boolean
  }

  season?: {
    startDate: Date
    endDate: Date
  }
}

/**
 * Result of attempting to resolve an exception
 */
export interface ResolutionResult {
  success: boolean
  newStatus: 'VALIDATED' | 'RESOLVED' | 'EXCEPTION'
  message: string
  validationResult?: ValidationResult
}

/**
 * Resolution action types
 */
export type ResolutionAction = 'REVALIDATE' | 'OVERRIDE' | 'CORRECT'

/**
 * Resolution request
 */
export interface ResolutionRequest {
  action: ResolutionAction
  notes: string
  overrideJustification?: string
  correctedData?: {
    categoryId?: string
    systemCategoryId?: string
    vendor?: string
    amount?: number
    receiptUrl?: string
    description?: string
  }
}
