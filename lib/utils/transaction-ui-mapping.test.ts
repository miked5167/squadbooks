/**
 * Unit tests for transaction UI mapping
 * Tests validation-first logic and legacy status compatibility
 * @vitest-environment node
 */

import { describe, it, expect } from 'vitest'
import { mapTransactionToUIState } from './transaction-ui-mapping'
import { GOLDEN_DATASET, getGoldenDatasetStats } from './__fixtures__/transaction-mapping-golden-dataset'

describe('mapTransactionToUIState', () => {
  describe('RULE 1: Resolved exceptions (priority check)', () => {
    it('should map transaction with resolvedAt to resolved/exception', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        resolvedAt: new Date().toISOString(),
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('resolved')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Resolved')
      expect(result.validationLabel).toBe('Exception')
      expect(result.reasons).toContain('Exception resolved')
    })

    it('should map transaction with overrideJustification to resolved/exception', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        overrideJustification: 'Emergency expense approved by board',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('resolved')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Resolved')
      expect(result.validationLabel).toBe('Exception')
    })

    it('should map transaction with resolutionNotes to resolved/exception', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        resolutionNotes: 'Corrected category assignment',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('resolved')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Resolved')
    })
  })

  describe('RULE 2: Validation JSON (preferred)', () => {
    it('should map compliant validation_json to validated/compliant', () => {
      const result = mapTransactionToUIState({
        status: 'VALIDATED',
        validation: {
          compliant: true,
        },
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
      expect(result.statusLabel).toBe('Validated')
      expect(result.validationLabel).toBe('Compliant')
      expect(result.validationIcon).toBe('✅')
      expect(result.reasons).toBeUndefined()
    })

    it('should map noncompliant validation_json to exception/exception', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [
            {
              code: 'BUDGET_EXCEEDED',
              message: 'Exceeds budget allocation for category',
              severity: 'HIGH',
            },
          ],
        },
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('exception')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Exception')
      expect(result.validationLabel).toBe('Exception')
      expect(result.validationIcon).toBe('⚠️')
      expect(result.reasons).toContain('Exceeds budget allocation for category')
      expect(result.severity).toBe('high')
    })

    it('should include top 2 violation messages in reasons', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [
            { message: 'Budget exceeded', severity: 'HIGH' },
            { message: 'Receipt required', severity: 'MEDIUM' },
            { message: 'Category limit reached', severity: 'LOW' },
          ],
        },
        categoryId: 'cat-1',
      })

      expect(result.reasons).toHaveLength(2)
      expect(result.reasons).toContain('Budget exceeded')
      expect(result.reasons).toContain('Receipt required')
      expect(result.reasons).not.toContain('Category limit reached')
    })

    it('should truncate long violation messages to 40 chars', () => {
      const longMessage = 'This is a very long violation message that exceeds forty characters'
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: longMessage, severity: 'MEDIUM' }],
        },
        categoryId: 'cat-1',
      })

      expect(result.reasons?.[0]).toHaveLength(40)
      expect(result.reasons?.[0]).toMatch(/\.\.\.$/)
    })

    it('should determine severity from violations', () => {
      const resultHigh = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: 'Critical', severity: 'CRITICAL' }],
        },
        categoryId: 'cat-1',
      })
      expect(resultHigh.severity).toBe('high')

      const resultMedium = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: 'Medium', severity: 'MEDIUM' }],
        },
        categoryId: 'cat-1',
      })
      expect(resultMedium.severity).toBe('medium')

      const resultLow = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: 'Low', severity: 'LOW' }],
        },
        categoryId: 'cat-1',
      })
      expect(resultLow.severity).toBe('low')
    })
  })

  describe('RULE 3: Legacy status mapping', () => {
    it('should map APPROVED to validated/compliant', () => {
      const result = mapTransactionToUIState({
        status: 'APPROVED',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
      expect(result.statusLabel).toBe('Validated')
      expect(result.validationLabel).toBe('Compliant')
      // Should NOT contain approval language
      expect(result.statusLabel).not.toMatch(/approv/i)
      expect(result.validationLabel).not.toMatch(/approv/i)
    })

    it('should map PENDING to imported/needs_info', () => {
      const result = mapTransactionToUIState({
        status: 'PENDING',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
      expect(result.validationLabel).toBe('Needs info')
      expect(result.reasons).toContain('Pending validation')
      // Should NOT contain "pending approval" or "exception" language
      expect(result.reasons?.join(' ')).not.toMatch(/pending approval/i)
    })

    it('should map DRAFT to imported/needs_info', () => {
      const result = mapTransactionToUIState({
        status: 'DRAFT',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
      expect(result.validationLabel).toBe('Needs info')
      // Should NOT contain "draft" language
      expect(result.statusLabel).not.toMatch(/draft/i)
    })

    it('should map REJECTED to exception/exception', () => {
      const result = mapTransactionToUIState({
        status: 'REJECTED',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('exception')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Exception')
      // Should NOT contain "rejected" language
      expect(result.statusLabel).not.toMatch(/reject/i)
    })
  })

  describe('Missing required fields', () => {
    it('should map missing category to imported/needs_info', () => {
      const result = mapTransactionToUIState({
        status: 'APPROVED', // Even if approved...
        categoryId: null, // ...missing category overrides
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
      expect(result.validationLabel).toBe('Needs info')
      expect(result.reasons).toContain('Missing category')
    })

    it('should map missing required receipt to imported/needs_info', () => {
      const result = mapTransactionToUIState(
        {
          status: 'IMPORTED',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          amount: '150.00', // Over $100
          receiptUrl: null,
        },
        {
          receiptRequiredOver: 100,
        }
      )

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
      expect(result.validationLabel).toBe('Needs info')
      expect(result.reasons).toContain('Receipt required')
    })

    it('should not require receipt for expense under threshold', () => {
      const result = mapTransactionToUIState(
        {
          status: 'APPROVED',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          amount: '50.00', // Under $100
          receiptUrl: null,
        },
        {
          receiptRequiredOver: 100,
        }
      )

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
      // Reasons should be undefined or not contain 'Receipt required'
      if (result.reasons) {
        expect(result.reasons).not.toContain('Receipt required')
      }
    })

    it('should not require receipt for income transactions', () => {
      const result = mapTransactionToUIState(
        {
          status: 'APPROVED',
          categoryId: 'cat-1',
          type: 'INCOME',
          amount: '500.00',
          receiptUrl: null,
        },
        {
          receiptRequiredOver: 100,
        }
      )

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
    })
  })

  describe('New status values', () => {
    it('should handle VALIDATED status', () => {
      const result = mapTransactionToUIState({
        status: 'VALIDATED',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
      expect(result.statusLabel).toBe('Validated')
    })

    it('should handle EXCEPTION status', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        exceptionReason: 'Over budget',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('exception')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Exception')
      expect(result.reasons).toContain('Over budget')
    })

    it('should handle RESOLVED status', () => {
      const result = mapTransactionToUIState({
        status: 'RESOLVED',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('resolved')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Resolved')
      expect(result.validationLabel).toBe('Exception')
    })

    it('should handle IMPORTED status', () => {
      const result = mapTransactionToUIState({
        status: 'IMPORTED',
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
    })
  })

  describe('Priority and fallback logic', () => {
    it('should prioritize resolution over validation result', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: 'Budget exceeded' }],
        },
        resolvedAt: new Date().toISOString(), // Resolution takes priority
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('resolved')
      expect(result.validationState).toBe('exception')
      expect(result.statusLabel).toBe('Resolved')
    })

    it('should prioritize validation over legacy status', () => {
      const result = mapTransactionToUIState({
        status: 'PENDING', // Legacy status
        validation: {
          // But has validation result
          compliant: true,
        },
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
      expect(result.statusLabel).toBe('Validated')
    })

    it('should prioritize missing category over legacy status', () => {
      const result = mapTransactionToUIState({
        status: 'APPROVED', // Legacy approved
        categoryId: null, // But missing category
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.reasons).toContain('Missing category')
    })
  })

  describe('No approval language in output', () => {
    it('should not contain "approved" in any labels', () => {
      const statuses: Array<'APPROVED' | 'PENDING' | 'DRAFT' | 'REJECTED'> = [
        'APPROVED',
        'PENDING',
        'DRAFT',
        'REJECTED',
      ]

      statuses.forEach((status) => {
        const result = mapTransactionToUIState({
          status,
          categoryId: 'cat-1',
        })

        const allText = [
          result.statusLabel,
          result.validationLabel,
          ...(result.reasons || []),
        ].join(' ')

        expect(allText.toLowerCase()).not.toMatch(/approv/)
        expect(allText.toLowerCase()).not.toMatch(/draft/)
        expect(allText.toLowerCase()).not.toMatch(/reject/)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle unknown status gracefully', () => {
      const result = mapTransactionToUIState({
        status: 'UNKNOWN_STATUS' as any,
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
      expect(result.statusLabel).toBe('Imported')
      expect(result.reasons).toContain('Status unknown')
    })

    it('should handle amount as string', () => {
      const result = mapTransactionToUIState(
        {
          status: 'IMPORTED',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          amount: '150.50',
          receiptUrl: null,
        },
        { receiptRequiredOver: 100 }
      )

      expect(result.validationState).toBe('needs_info')
      expect(result.reasons).toContain('Receipt required')
    })

    it('should handle amount as number', () => {
      const result = mapTransactionToUIState(
        {
          status: 'IMPORTED',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          amount: 150.5,
          receiptUrl: null,
        },
        { receiptRequiredOver: 100 }
      )

      expect(result.validationState).toBe('needs_info')
      expect(result.reasons).toContain('Receipt required')
    })

    it('should handle empty violations array', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [],
        },
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('exception')
      expect(result.reasons).toContain('Review required')
    })
  })

  describe('Golden Dataset Calibration', () => {
    it('should pass all golden dataset test cases', () => {
      const failures: Array<{ id: string; description: string; error: string }> = []

      GOLDEN_DATASET.forEach((testCase: any) => {
        try {
          const result = mapTransactionToUIState(testCase.input, { receiptRequiredOver: 100 })

          // Assert lifecycle state
          if (result.lifecycleState !== testCase.expected.lifecycleState) {
            failures.push({
              id: testCase.id,
              description: testCase.description,
              error: `lifecycleState mismatch: expected "${testCase.expected.lifecycleState}", got "${result.lifecycleState}"`,
            })
          }

          // Assert validation state
          if (result.validationState !== testCase.expected.validationState) {
            failures.push({
              id: testCase.id,
              description: testCase.description,
              error: `validationState mismatch: expected "${testCase.expected.validationState}", got "${result.validationState}"`,
            })
          }

          // Assert status label
          if (result.statusLabel !== testCase.expected.statusLabel) {
            failures.push({
              id: testCase.id,
              description: testCase.description,
              error: `statusLabel mismatch: expected "${testCase.expected.statusLabel}", got "${result.statusLabel}"`,
            })
          }

          // Assert validation label
          if (result.validationLabel !== testCase.expected.validationLabel) {
            failures.push({
              id: testCase.id,
              description: testCase.description,
              error: `validationLabel mismatch: expected "${testCase.expected.validationLabel}", got "${result.validationLabel}"`,
            })
          }
        } catch (error: any) {
          failures.push({
            id: testCase.id,
            description: testCase.description,
            error: `Exception thrown: ${error.message}`,
          })
        }
      })

      if (failures.length > 0) {
        const errorReport = failures
          .map(f => `\n  [${f.id}] ${f.description}\n    ❌ ${f.error}`)
          .join('\n')
        throw new Error(`Golden dataset test failures (${failures.length}/${GOLDEN_DATASET.length}):${errorReport}`)
      }
    })

    it('should produce correct distribution of status/validation states', () => {
      const stats = getGoldenDatasetStats()

      // Expected distribution:
      // - Most should be Validated/Compliant (~70-80%)
      // - Some Imported/Needs info (~10-20%)
      // - Few Exceptions (~5-10%)
      // - Very few Resolved (~1-5%)

      expect(stats.validated_compliant).toBeGreaterThanOrEqual(15) // At least 15 normal cases
      expect(stats.imported_needs_info).toBeGreaterThanOrEqual(3) // At least 3 missing info
      expect(stats.exception_exception).toBeGreaterThanOrEqual(2) // At least 2 true exceptions
      expect(stats.resolved_exception).toBeGreaterThanOrEqual(1) // At least 1 resolved

      // Log distribution for manual verification
      console.log('\n📊 Golden Dataset Distribution:')
      console.log(`   Total test cases: ${stats.total}`)
      console.log(`   ✅ Validated/Compliant: ${stats.validated_compliant} (${stats.distribution.validated_compliant_pct})`)
      console.log(`   ⏳ Imported/Needs info: ${stats.imported_needs_info} (${stats.distribution.imported_needs_info_pct})`)
      console.log(`   ⚠️  Exception/Exception: ${stats.exception_exception} (${stats.distribution.exception_exception_pct})`)
      console.log(`   ✅ Resolved/Exception: ${stats.resolved_exception} (${stats.distribution.resolved_exception_pct})`)
    })
  })

  describe('Bias toward normal operations (regression prevention)', () => {
    it('should NOT mark missing receipt as exception', () => {
      const result = mapTransactionToUIState(
        {
          status: 'IMPORTED',
          categoryId: 'cat-1',
          type: 'EXPENSE',
          amount: 150.0,
          receiptUrl: null,
        },
        { receiptRequiredOver: 100 }
      )

      expect(result.lifecycleState).not.toBe('exception')
      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
    })

    it('should NOT mark legacy PENDING as exception without violations', () => {
      const result = mapTransactionToUIState({
        status: 'PENDING',
        categoryId: 'cat-1',
        receiptUrl: 'https://example.com/receipt.pdf',
        amount: 100.0,
        type: 'EXPENSE',
      })

      expect(result.lifecycleState).not.toBe('exception')
      expect(result.lifecycleState).toBe('imported')
      expect(result.validationState).toBe('needs_info')
    })

    it('should ONLY mark as exception when explicit violations exist', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [
            {
              code: 'BUDGET_OVERRUN',
              message: 'Exceeds budget',
              severity: 'HIGH',
            },
          ],
        },
        categoryId: 'cat-1',
      })

      expect(result.lifecycleState).toBe('exception')
      expect(result.validationState).toBe('exception')
    })

    it('should default income to validated when no issues', () => {
      const result = mapTransactionToUIState({
        status: 'VALIDATED',
        validation: { compliant: true },
        categoryId: 'cat-income',
        type: 'INCOME',
        amount: 1000.0,
        receiptUrl: null,
      })

      expect(result.lifecycleState).toBe('validated')
      expect(result.validationState).toBe('compliant')
    })

    it('should NOT mark as resolved without resolution metadata', () => {
      const result = mapTransactionToUIState({
        status: 'EXCEPTION',
        validation: {
          compliant: false,
          violations: [{ message: 'Some issue', severity: 'MEDIUM' }],
        },
        categoryId: 'cat-1',
        // No resolvedAt, no overrideJustification, no resolutionNotes
      })

      expect(result.lifecycleState).not.toBe('resolved')
      expect(result.lifecycleState).toBe('exception')
    })
  })
})
