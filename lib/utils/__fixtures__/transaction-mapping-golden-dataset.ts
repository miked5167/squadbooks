/**
 * Golden Dataset for Transaction Mapping Calibration
 *
 * This fixture contains ~20 carefully designed test cases to calibrate
 * the transaction-to-UI-state mapper. Each case includes:
 * - Input transaction data
 * - Expected Status chip output
 * - Expected Validation chip output
 * - Description of what the case represents
 */

import type { TransactionStatus } from '../transaction-ui-mapping'

interface GoldenTestCase {
  id: string
  description: string
  input: {
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
  expected: {
    lifecycleState: 'imported' | 'validated' | 'exception' | 'resolved'
    validationState: 'compliant' | 'exception' | 'needs_info'
    statusLabel: string
    validationLabel: string
  }
}

/**
 * GOLDEN DATASET
 * Distribution target:
 * - ~75% Validated/Compliant (normal operations)
 * - ~15% Imported/Needs info (missing data)
 * - ~5-10% Exception (true violations)
 * - ~1-2% Resolved (addressed exceptions)
 */
export const GOLDEN_DATASET: GoldenTestCase[] = [
  // ========================================
  // CATEGORY 1: Normal Expected Expenses (15 cases)
  // These should ALL be Validated/Compliant
  // ========================================
  {
    id: 'normal-01',
    description: 'Recurring referee fee - validated with receipt',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-referees',
      receiptUrl: 'https://example.com/receipt-001.pdf',
      amount: 85.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-02',
    description: 'Ice rental within budget - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-ice',
      receiptUrl: 'https://example.com/receipt-002.pdf',
      amount: 350.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-03',
    description: 'Equipment purchase under limit - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-equipment',
      receiptUrl: 'https://example.com/receipt-003.pdf',
      amount: 125.50,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-04',
    description: 'Small expense under receipt threshold - no receipt needed',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-supplies',
      receiptUrl: null,
      amount: 45.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-05',
    description: 'Tournament fee - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-tournaments',
      receiptUrl: 'https://example.com/receipt-005.pdf',
      amount: 450.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-06',
    description: 'Legacy APPROVED status with all data - should be validated',
    input: {
      status: 'APPROVED',
      categoryId: 'cat-uniforms',
      receiptUrl: 'https://example.com/receipt-006.pdf',
      amount: 200.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-07',
    description: 'Training equipment purchase - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-training',
      receiptUrl: 'https://example.com/receipt-007.pdf',
      amount: 175.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-08',
    description: 'Coach honorarium - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-coaching',
      receiptUrl: 'https://example.com/receipt-008.pdf',
      amount: 500.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-09',
    description: 'Team travel expense - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-travel',
      receiptUrl: 'https://example.com/receipt-009.pdf',
      amount: 320.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-10',
    description: 'First aid supplies - small validated expense',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-medical',
      receiptUrl: 'https://example.com/receipt-010.pdf',
      amount: 65.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-11',
    description: 'Registration income - should default to validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-registration-income',
      receiptUrl: null,
      amount: 1250.00,
      type: 'INCOME',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-12',
    description: 'Fundraiser revenue - income without receipt requirement',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-fundraising',
      receiptUrl: null,
      amount: 850.00,
      type: 'INCOME',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-13',
    description: 'Office supplies - small recurring expense',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-admin',
      receiptUrl: 'https://example.com/receipt-013.pdf',
      amount: 38.50,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-14',
    description: 'Team photo package - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-photos',
      receiptUrl: 'https://example.com/receipt-014.pdf',
      amount: 185.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
  {
    id: 'normal-15',
    description: 'League fees - validated',
    input: {
      status: 'VALIDATED',
      validation: { compliant: true },
      categoryId: 'cat-league',
      receiptUrl: 'https://example.com/receipt-015.pdf',
      amount: 275.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },

  // ========================================
  // CATEGORY 2: Missing Info Cases (3 cases)
  // These should be Imported/Needs info
  // ========================================
  {
    id: 'missing-01',
    description: 'Transaction missing category - needs categorization',
    input: {
      status: 'IMPORTED',
      categoryId: null,
      receiptUrl: 'https://example.com/receipt-m01.pdf',
      amount: 125.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      validationLabel: 'Needs info',
    },
  },
  {
    id: 'missing-02',
    description: 'Missing receipt for large expense - needs documentation',
    input: {
      status: 'IMPORTED',
      categoryId: 'cat-equipment',
      receiptUrl: null,
      amount: 250.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      validationLabel: 'Needs info',
    },
  },
  {
    id: 'missing-03',
    description: 'Legacy DRAFT status - awaiting completion',
    input: {
      status: 'DRAFT',
      categoryId: 'cat-misc',
      receiptUrl: null,
      amount: 75.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      validationLabel: 'Needs info',
    },
  },

  // ========================================
  // CATEGORY 3: True Exceptions (2 cases)
  // These have explicit violations
  // ========================================
  {
    id: 'exception-01',
    description: 'Over budget - explicit violation',
    input: {
      status: 'EXCEPTION',
      validation: {
        compliant: false,
        violations: [
          {
            code: 'BUDGET_OVERRUN',
            message: 'Exceeds team budget by $150',
            severity: 'HIGH',
          },
        ],
      },
      categoryId: 'cat-equipment',
      receiptUrl: 'https://example.com/receipt-e01.pdf',
      amount: 650.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'exception',
      validationState: 'exception',
      statusLabel: 'Exception',
      validationLabel: 'Exception',
    },
  },
  {
    id: 'exception-02',
    description: 'Unapproved category - policy violation',
    input: {
      status: 'EXCEPTION',
      validation: {
        compliant: false,
        violations: [
          {
            code: 'UNAPPROVED_CATEGORY',
            message: 'Category not included in approved budget',
            severity: 'MEDIUM',
          },
        ],
      },
      categoryId: 'cat-unauthorized',
      receiptUrl: 'https://example.com/receipt-e02.pdf',
      amount: 180.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'exception',
      validationState: 'exception',
      statusLabel: 'Exception',
      validationLabel: 'Exception',
    },
  },

  // ========================================
  // CATEGORY 4: Resolved Exception (1 case)
  // Has resolution_json or override metadata
  // ========================================
  {
    id: 'resolved-01',
    description: 'Exception with override justification - resolved',
    input: {
      status: 'EXCEPTION',
      validation: {
        compliant: false,
        violations: [
          {
            code: 'BUDGET_OVERRUN',
            message: 'Exceeded category limit',
            severity: 'HIGH',
          },
        ],
      },
      overrideJustification: 'Emergency equipment replacement approved by board',
      resolvedAt: '2025-01-15T10:30:00Z',
      categoryId: 'cat-equipment',
      receiptUrl: 'https://example.com/receipt-r01.pdf',
      amount: 750.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'resolved',
      validationState: 'exception',
      statusLabel: 'Resolved',
      validationLabel: 'Exception',
    },
  },

  // ========================================
  // EDGE CASES: Important boundary conditions
  // ========================================
  {
    id: 'edge-01',
    description: 'Legacy PENDING status - should NOT be exception without violations',
    input: {
      status: 'PENDING',
      categoryId: 'cat-supplies',
      receiptUrl: 'https://example.com/receipt-edge01.pdf',
      amount: 95.00,
      type: 'EXPENSE',
    },
    expected: {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      validationLabel: 'Needs info',
    },
  },
  {
    id: 'edge-02',
    description: 'Income without category - should still be imported/needs_info',
    input: {
      status: 'IMPORTED',
      categoryId: null,
      receiptUrl: null,
      amount: 500.00,
      type: 'INCOME',
    },
    expected: {
      lifecycleState: 'imported',
      validationState: 'needs_info',
      statusLabel: 'Imported',
      validationLabel: 'Needs info',
    },
  },
  {
    id: 'edge-03',
    description: 'Income with legacy APPROVED - should be validated',
    input: {
      status: 'APPROVED',
      categoryId: 'cat-registration-income',
      receiptUrl: null,
      amount: 1500.00,
      type: 'INCOME',
    },
    expected: {
      lifecycleState: 'validated',
      validationState: 'compliant',
      statusLabel: 'Validated',
      validationLabel: 'Compliant',
    },
  },
]

/**
 * Get distribution statistics for the golden dataset
 */
export function getGoldenDatasetStats() {
  const stats = {
    total: GOLDEN_DATASET.length,
    validated_compliant: 0,
    imported_needs_info: 0,
    exception_exception: 0,
    resolved_exception: 0,
  }

  GOLDEN_DATASET.forEach(testCase => {
    const key = `${testCase.expected.lifecycleState}_${testCase.expected.validationState}` as keyof typeof stats
    if (key in stats) {
      stats[key]++
    }
  })

  return {
    ...stats,
    distribution: {
      validated_compliant_pct: ((stats.validated_compliant / stats.total) * 100).toFixed(1) + '%',
      imported_needs_info_pct: ((stats.imported_needs_info / stats.total) * 100).toFixed(1) + '%',
      exception_exception_pct: ((stats.exception_exception / stats.total) * 100).toFixed(1) + '%',
      resolved_exception_pct: ((stats.resolved_exception / stats.total) * 100).toFixed(1) + '%',
    },
  }
}
