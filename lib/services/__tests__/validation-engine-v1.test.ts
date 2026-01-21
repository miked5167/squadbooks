/**
 * Unit tests for Validation Engine V1
 *
 * Tests each of the 5 core validation rules
 */

import { describe, it, expect } from '@jest/globals'
import {
  validateApprovedCategory,
  validateCategoryOverrun,
  validateRequiredReceipt,
  validateTransactionLimit,
  validateCashLike,
  validateCategorized,
  validateTransaction,
  calculateComplianceScore,
  deriveStatus,
} from '../validation-engine-v1'
import { ValidationContext, ViolationSeverity } from '@/lib/types/validation'
import { DEFAULT_ASSOCIATION_RULES } from '@/lib/types/association-rules'

// Helper to create a minimal validation context
function createContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    transaction: {
      amount: 100,
      type: 'EXPENSE',
      categoryId: 'cat-1',
      systemCategoryId: null,
      vendor: 'Test Vendor',
      transactionDate: new Date(),
      receiptUrl: null,
      description: null,
    },
    budget: {
      id: 'budget-1',
      status: 'LOCKED',
      allocations: [
        {
          categoryId: 'cat-1',
          allocated: 1000,
          spent: 0,
        },
      ],
    },
    teamSettings: {
      receiptThreshold: 100,
      largeTransactionThreshold: 200,
    },
    associationRules: DEFAULT_ASSOCIATION_RULES,
    ...overrides,
  }
}

describe('Rule 1: Unapproved Category', () => {
  it('should pass when category exists in budget', () => {
    const context = createContext()
    const violation = validateApprovedCategory(context)
    expect(violation).toBeNull()
  })

  it('should fail when category not in budget', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: 'cat-999', // Not in budget
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateApprovedCategory(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('UNAPPROVED_CATEGORY')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
  })

  it('should skip check when no budget provided', () => {
    const context = createContext({ budget: undefined })
    const violation = validateApprovedCategory(context)
    expect(violation).toBeNull()
  })

  it('should skip check when no category assigned', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: null,
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateApprovedCategory(context)
    expect(violation).toBeNull()
  })
})

describe('Rule 2: Category Overrun', () => {
  it('should pass when transaction fits within budget', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      budget: {
        id: 'budget-1',
        status: 'LOCKED',
        allocations: [
          {
            categoryId: 'cat-1',
            allocated: 1000,
            spent: 0,
          },
        ],
      },
    })
    const violation = validateCategoryOverrun(context)
    expect(violation).toBeNull()
  })

  it('should fail when transaction exceeds budget with 0% tolerance', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      budget: {
        id: 'budget-1',
        status: 'LOCKED',
        allocations: [
          {
            categoryId: 'cat-1',
            allocated: 1000,
            spent: 950, // 950 + 100 = 1050 > 1000
          },
        ],
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        categoryOverrunTolerancePercent: 0,
      },
    })
    const violation = validateCategoryOverrun(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('CATEGORY_OVER_LIMIT')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
    expect(violation?.metadata?.overage).toBe(50)
  })

  it('should pass when transaction within tolerance', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      budget: {
        id: 'budget-1',
        status: 'LOCKED',
        allocations: [
          {
            categoryId: 'cat-1',
            allocated: 1000,
            spent: 950, // 950 + 100 = 1050, which is 5% over
          },
        ],
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        categoryOverrunTolerancePercent: 10, // 10% tolerance
      },
    })
    const violation = validateCategoryOverrun(context)
    expect(violation).toBeNull()
  })

  it('should skip check for income transactions', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'INCOME',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateCategoryOverrun(context)
    expect(violation).toBeNull()
  })
})

describe('Rule 3: Missing Receipt', () => {
  it('should pass when receipt attached for expense >= threshold', () => {
    const context = createContext({
      transaction: {
        amount: 150,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: 'https://example.com/receipt.pdf',
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        receiptRequiredOverAmount: 100,
      },
    })
    const violation = validateRequiredReceipt(context)
    expect(violation).toBeNull()
  })

  it('should fail when receipt missing for expense >= threshold', () => {
    const context = createContext({
      transaction: {
        amount: 150,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null, // No receipt
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        receiptRequiredOverAmount: 100,
      },
    })
    const violation = validateRequiredReceipt(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('MISSING_RECEIPT')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
  })

  it('should pass when receipt not required for small expense', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        receiptRequiredOverAmount: 100,
      },
    })
    const violation = validateRequiredReceipt(context)
    expect(violation).toBeNull()
  })

  it('should skip check for income transactions', () => {
    const context = createContext({
      transaction: {
        amount: 150,
        type: 'INCOME',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateRequiredReceipt(context)
    expect(violation).toBeNull()
  })
})

describe('Rule 4: Transaction Amount Limit', () => {
  it('should pass when transaction under limit', () => {
    const context = createContext({
      transaction: {
        amount: 500,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        transactionAmountLimit: 1000,
      },
    })
    const violation = validateTransactionLimit(context)
    expect(violation).toBeNull()
  })

  it('should fail when transaction exceeds limit', () => {
    const context = createContext({
      transaction: {
        amount: 1500,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        transactionAmountLimit: 1000,
      },
    })
    const violation = validateTransactionLimit(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('THRESHOLD_BREACH')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
    expect(violation?.metadata?.overage).toBe(500)
  })

  it('should pass when transaction exactly at limit', () => {
    const context = createContext({
      transaction: {
        amount: 1000,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        transactionAmountLimit: 1000,
      },
    })
    const violation = validateTransactionLimit(context)
    expect(violation).toBeNull()
  })
})

describe('Rule 5: Cash-Like Transaction', () => {
  it('should fail for cash-like vendor with MEDIUM severity when under limit', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Petty Cash',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        cashLikeRequiresReview: true,
        transactionAmountLimit: 1000,
      },
    })
    const violation = validateCashLike(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('CASH_LIKE_TRANSACTION')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
  })

  it('should fail for cash-like vendor with CRITICAL severity when over limit', () => {
    const context = createContext({
      transaction: {
        amount: 1500,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Gift Card',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        cashLikeRequiresReview: true,
        transactionAmountLimit: 1000,
      },
    })
    const violation = validateCashLike(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('CASH_LIKE_TRANSACTION')
    expect(violation?.severity).toBe(ViolationSeverity.CRITICAL)
  })

  it('should pass for non-cash-like vendor', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Home Depot',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        cashLikeRequiresReview: true,
      },
    })
    const violation = validateCashLike(context)
    expect(violation).toBeNull()
  })

  it('should skip check when cashLikeRequiresReview is false', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Cash',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        cashLikeRequiresReview: false,
      },
    })
    const violation = validateCashLike(context)
    expect(violation).toBeNull()
  })

  it('should detect cash-like in description', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Team Purchase',
        transactionDate: new Date(),
        receiptUrl: null,
        description: 'Bought with gift card',
      },
      associationRules: {
        ...DEFAULT_ASSOCIATION_RULES,
        cashLikeRequiresReview: true,
      },
    })
    const violation = validateCashLike(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('CASH_LIKE_TRANSACTION')
  })
})

describe('Uncategorized Check', () => {
  it('should fail when no category assigned', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: null,
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateCategorized(context)
    expect(violation).not.toBeNull()
    expect(violation?.code).toBe('UNCATEGORIZED')
    expect(violation?.severity).toBe(ViolationSeverity.ERROR)
  })

  it('should pass when categoryId is set', () => {
    const context = createContext()
    const violation = validateCategorized(context)
    expect(violation).toBeNull()
  })

  it('should pass when systemCategoryId is set', () => {
    const context = createContext({
      transaction: {
        amount: 100,
        type: 'EXPENSE',
        categoryId: null,
        systemCategoryId: 'sys-cat-1',
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
    })
    const violation = validateCategorized(context)
    expect(violation).toBeNull()
  })
})

describe('Compliance Score', () => {
  it('should return 100 for no violations', () => {
    const score = calculateComplianceScore([])
    expect(score).toBe(100)
  })

  it('should deduct 15 points for ERROR violation', () => {
    const score = calculateComplianceScore([
      {
        code: 'MISSING_RECEIPT' as any,
        severity: ViolationSeverity.ERROR,
        message: 'Test',
      },
    ])
    expect(score).toBe(85)
  })

  it('should deduct 30 points for CRITICAL violation', () => {
    const score = calculateComplianceScore([
      {
        code: 'CASH_LIKE_TRANSACTION' as any,
        severity: ViolationSeverity.CRITICAL,
        message: 'Test',
      },
    ])
    expect(score).toBe(70)
  })

  it('should deduct correctly for multiple violations', () => {
    const score = calculateComplianceScore([
      {
        code: 'MISSING_RECEIPT' as any,
        severity: ViolationSeverity.ERROR,
        message: 'Test',
      },
      {
        code: 'UNCATEGORIZED' as any,
        severity: ViolationSeverity.ERROR,
        message: 'Test',
      },
    ])
    expect(score).toBe(70) // 100 - 15 - 15 = 70
  })

  it('should not go below 0', () => {
    const score = calculateComplianceScore([
      {
        code: 'CRITICAL1' as any,
        severity: ViolationSeverity.CRITICAL,
        message: 'Test',
      },
      {
        code: 'CRITICAL2' as any,
        severity: ViolationSeverity.CRITICAL,
        message: 'Test',
      },
      {
        code: 'CRITICAL3' as any,
        severity: ViolationSeverity.CRITICAL,
        message: 'Test',
      },
      {
        code: 'CRITICAL4' as any,
        severity: ViolationSeverity.CRITICAL,
        message: 'Test',
      },
    ])
    expect(score).toBe(0) // Would be -20 but clamped to 0
  })
})

describe('Full Validation Integration', () => {
  it('should return compliant for valid transaction', () => {
    const context = createContext({
      transaction: {
        amount: 50,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Home Depot',
        transactionDate: new Date(),
        receiptUrl: null,
        description: null,
      },
      budget: {
        id: 'budget-1',
        status: 'LOCKED',
        allocations: [
          {
            categoryId: 'cat-1',
            allocated: 1000,
            spent: 0,
          },
        ],
      },
    })

    const result = validateTransaction(context)
    expect(result.compliant).toBe(true)
    expect(result.violations).toHaveLength(0)
    expect(result.score).toBe(100)
  })

  it('should return non-compliant for transaction with violations', () => {
    const context = createContext({
      transaction: {
        amount: 150,
        type: 'EXPENSE',
        categoryId: 'cat-1',
        systemCategoryId: null,
        vendor: 'Test Vendor',
        transactionDate: new Date(),
        receiptUrl: null, // Missing receipt
        description: null,
      },
    })

    const result = validateTransaction(context)
    expect(result.compliant).toBe(false)
    expect(result.violations.length).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(100)
  })

  it('should derive VALIDATED status for compliant transaction', () => {
    const result = {
      compliant: true,
      violations: [],
      score: 100,
      validatedAt: new Date(),
      checksRun: {} as any,
    }
    expect(deriveStatus(result)).toBe('VALIDATED')
  })

  it('should derive EXCEPTION status for non-compliant transaction', () => {
    const result = {
      compliant: false,
      violations: [
        {
          code: 'MISSING_RECEIPT' as any,
          severity: ViolationSeverity.ERROR,
          message: 'Test',
        },
      ],
      score: 85,
      validatedAt: new Date(),
      checksRun: {} as any,
    }
    expect(deriveStatus(result)).toBe('EXCEPTION')
  })
})
