/**
 * Unit tests for GTHL Authorization Rules Engine
 *
 * Tests cover all edge cases and scenarios for spend intent authorization.
 */

import { describe, it, expect } from 'vitest'
import {
  determineAuthorizationRequirements,
  exceedsDualApprovalThreshold,
  validateAuthorizationInput,
  type AuthorizationRulesInput,
} from './gthl-authorization'

describe('GTHL Authorization Rules Engine', () => {
  describe('Standing Budget Authorization - Happy Path', () => {
    it('should approve budgeted recurring vendor e-transfer ($250) with standing authorization', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 25000, // $250.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_ice_rental',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
      expect(result.requiredApprovalsCount).toBe(0)
      expect(result.minIndependentParentRepCount).toBe(0)
      expect(result.reason).toContain('standing budget authorization')
      expect(result.conditions.hasBudgetLineItem).toBe(true)
      expect(result.conditions.budgetApproved).toBe(true)
      expect(result.conditions.vendorKnown).toBe(true)
      expect(result.conditions.noTreasurerConflict).toBe(true)
    })

    it('should approve budgeted known vendor CASH payment with standing authorization', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 5000, // $50.00
        paymentMethod: 'CASH',
        budgetLineItemId: 'budget_item_referees',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })

    it('should approve budgeted known vendor CHEQUE with standing authorization', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 150000, // $1,500.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_tournament_fees',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })
  })

  describe('Manual Approval Required - Missing Budget', () => {
    it('should require manual approval for unbudgeted e-transfer', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 10000, // $100.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: null, // No budget line item
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.requiredApprovalsCount).toBe(2)
      expect(result.minIndependentParentRepCount).toBe(1)
      expect(result.reason).toContain('no budget line item')
      expect(result.conditions.hasBudgetLineItem).toBe(false)
    })

    it('should require manual approval when budget line item is empty string', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 5000,
        paymentMethod: 'CASH',
        budgetLineItemId: '', // Empty string treated as no budget
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('no budget line item')
    })

    it('should require manual approval when budget is not approved', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 10000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_equipment',
        budgetApproved: false, // Budget not yet approved
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('budget not approved')
      expect(result.conditions.budgetApproved).toBe(false)
    })
  })

  describe('Manual Approval Required - Unknown Vendor', () => {
    it('should require manual approval for new/unknown vendor even if budgeted', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 20000, // $200.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_ice_rental',
        budgetApproved: true,
        vendorIsKnown: false, // New vendor
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.requiredApprovalsCount).toBe(2)
      expect(result.minIndependentParentRepCount).toBe(1)
      expect(result.reason).toContain('unknown vendor')
      expect(result.conditions.vendorKnown).toBe(false)
    })

    it('should require manual approval for first-time vendor on CHEQUE', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 50000, // $500.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_team_gear',
        budgetApproved: true,
        vendorIsKnown: false,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.reason).toContain('unknown vendor')
    })
  })

  describe('Vendor Whitelisting - vendorId vs isWhitelisted', () => {
    it('should require manual approval when vendorId exists but vendor is NOT whitelisted', () => {
      // This tests the behavior when a vendor record exists in the DB
      // but isWhitelisted=false. The API should set vendorIsKnown=false.
      const input: AuthorizationRulesInput = {
        amountCents: 25000, // $250.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_ice_rental',
        budgetApproved: true,
        vendorIsKnown: false, // vendorId exists but isWhitelisted=false
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.requiredApprovalsCount).toBe(2)
      expect(result.minIndependentParentRepCount).toBe(1)
      expect(result.reason).toContain('unknown vendor')
      expect(result.conditions.vendorKnown).toBe(false)
    })

    it('should allow standing authorization when vendor is whitelisted', () => {
      // This tests the behavior when vendorId exists AND isWhitelisted=true
      // The API should set vendorIsKnown=true, enabling standing authorization
      const input: AuthorizationRulesInput = {
        amountCents: 25000, // $250.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_ice_rental',
        budgetApproved: true,
        vendorIsKnown: true, // vendorId exists AND isWhitelisted=true
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
      expect(result.requiredApprovalsCount).toBe(0)
      expect(result.minIndependentParentRepCount).toBe(0)
      expect(result.reason).toContain('standing budget authorization')
      expect(result.conditions.vendorKnown).toBe(true)
    })

    it('should require manual approval when no vendorId (completely unknown vendor)', () => {
      // This tests when vendorId is null - completely unknown vendor
      const input: AuthorizationRulesInput = {
        amountCents: 15000, // $150.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_supplies',
        budgetApproved: true,
        vendorIsKnown: false, // No vendorId at all
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('unknown vendor')
      expect(result.conditions.vendorKnown).toBe(false)
    })

    it('should require manual approval for large amount to non-whitelisted vendor', () => {
      // Even for large amounts, non-whitelisted vendors require manual approval
      const input: AuthorizationRulesInput = {
        amountCents: 100000, // $1,000.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_tournament',
        budgetApproved: true,
        vendorIsKnown: false, // vendorId exists but not whitelisted
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('unknown vendor')
    })

    it('should allow standing authorization for small amount to whitelisted vendor', () => {
      // Even small amounts can use standing authorization if vendor is whitelisted
      const input: AuthorizationRulesInput = {
        amountCents: 5000, // $50.00
        paymentMethod: 'CASH',
        budgetLineItemId: 'budget_item_referees',
        budgetApproved: true,
        vendorIsKnown: true, // Whitelisted vendor
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
      expect(result.conditions.vendorKnown).toBe(true)
    })
  })

  describe('Manual Approval Required - Treasurer Conflict of Interest', () => {
    it('should require manual approval when treasurer is the payee', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 15000, // $150.00
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_item_coaching_fees',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: true, // Conflict of interest
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.requiredApprovalsCount).toBe(2)
      expect(result.minIndependentParentRepCount).toBe(1)
      expect(result.reason).toContain('treasurer is payee')
      expect(result.reason).toContain('conflict of interest')
      expect(result.conditions.noTreasurerConflict).toBe(false)
    })

    it('should require manual approval for treasurer reimbursement even if budgeted', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 3000, // $30.00 - small amount
        paymentMethod: 'CASH',
        budgetLineItemId: 'budget_item_office_supplies',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: true,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.reason).toContain('conflict of interest')
    })
  })

  describe('Manual Approval Required - Multiple Violations', () => {
    it('should list all violations when multiple conditions fail', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 10000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: null, // No budget
        budgetApproved: false, // Not approved
        vendorIsKnown: false, // Unknown vendor
        treasurerIsPayee: true, // Conflict of interest
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('no budget line item')
      expect(result.reason).toContain('budget not approved')
      expect(result.reason).toContain('unknown vendor')
      expect(result.reason).toContain('treasurer is payee')
      expect(result.conditions.hasBudgetLineItem).toBe(false)
      expect(result.conditions.budgetApproved).toBe(false)
      expect(result.conditions.vendorKnown).toBe(false)
      expect(result.conditions.noTreasurerConflict).toBe(false)
    })

    it('should require manual approval when only budget is present but others fail', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 20000,
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_ice',
        budgetApproved: false, // Not approved
        vendorIsKnown: false, // Unknown
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.reason).toContain('budget not approved')
      expect(result.reason).toContain('unknown vendor')
      expect(result.reason).not.toContain('no budget line item')
    })
  })

  describe('Cheque-Specific Cases', () => {
    it('should use standing authorization for budgeted cheque to known vendor', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 75000, // $750.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_ice_rental',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })

    it('should require manual approval for cheque to unknown vendor', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 100000, // $1,000.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_tournament',
        budgetApproved: true,
        vendorIsKnown: false, // First time vendor
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
      expect(result.reason).toContain('unknown vendor')
    })

    it('should require manual approval for unbudgeted cheque', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 25000,
        paymentMethod: 'CHEQUE',
        budgetLineItemId: null,
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(true)
      expect(result.reason).toContain('no budget line item')
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero amount', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 0,
        paymentMethod: 'CASH',
        budgetLineItemId: 'budget_item_petty_cash',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })

    it('should handle very large amount with standing authorization', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 1000000, // $10,000.00
        paymentMethod: 'CHEQUE',
        budgetLineItemId: 'budget_item_major_purchase',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      // Amount doesn't matter for authorization type - only the 4 conditions
      expect(result.requiresManualApproval).toBe(false)
      expect(result.authorizationType).toBe('STANDING_BUDGET_AUTHORIZATION')
    })

    it('should handle small amount but require manual approval if conditions fail', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 100, // $1.00 - tiny amount
        paymentMethod: 'CASH',
        budgetLineItemId: null,
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      // Even small amounts require manual approval if not budgeted
      expect(result.requiresManualApproval).toBe(true)
      expect(result.authorizationType).toBe('MANUAL_SIGNER_APPROVAL')
    })

    it('should use team settings threshold override', () => {
      const amountCents = 25000 // $250

      // Default threshold is $200
      expect(exceedsDualApprovalThreshold(amountCents)).toBe(true)

      // Custom threshold of $500
      expect(
        exceedsDualApprovalThreshold(amountCents, {
          dualApprovalThreshold: 50000,
        })
      ).toBe(false)

      // Custom threshold of $100
      expect(
        exceedsDualApprovalThreshold(amountCents, {
          dualApprovalThreshold: 10000,
        })
      ).toBe(true)
    })

    it('should handle threshold exactly at boundary', () => {
      const amountCents = 20000 // Exactly $200

      expect(exceedsDualApprovalThreshold(amountCents)).toBe(true) // >= threshold
    })
  })

  describe('Input Validation', () => {
    it('should validate complete valid input', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 10000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })

    it('should reject missing amountCents', () => {
      const input = {
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('amountCents is required')
    })

    it('should reject negative amountCents', () => {
      const input = {
        amountCents: -1000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('amountCents must be non-negative')
    })

    it('should reject non-integer amountCents', () => {
      const input = {
        amountCents: 100.5,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('amountCents must be an integer')
    })

    it('should reject invalid payment method', () => {
      const input = {
        amountCents: 10000,
        paymentMethod: 'BITCOIN',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('paymentMethod must be CASH, CHEQUE, or E_TRANSFER')
    })

    it('should reject missing boolean fields', () => {
      const input = {
        amountCents: 10000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors).toContain('budgetApproved is required')
      expect(validation.errors).toContain('vendorIsKnown is required')
      expect(validation.errors).toContain('treasurerIsPayee is required')
    })

    it('should collect multiple validation errors', () => {
      const input = {
        amountCents: 100.5, // Positive but not integer
        paymentMethod: 'INVALID',
      } as any

      const validation = validateAuthorizationInput(input)

      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(3)
      expect(validation.errors).toContain('amountCents must be an integer')
      expect(validation.errors).toContain('paymentMethod must be CASH, CHEQUE, or E_TRANSFER')
      expect(validation.errors).toContain('budgetApproved is required')
      expect(validation.errors).toContain('vendorIsKnown is required')
      expect(validation.errors).toContain('treasurerIsPayee is required')
    })
  })

  describe('Authorization Result Consistency', () => {
    it('should always return requiredApprovalsCount=2 for manual approval', () => {
      const inputs: AuthorizationRulesInput[] = [
        {
          amountCents: 10000,
          paymentMethod: 'E_TRANSFER',
          budgetLineItemId: null,
          budgetApproved: true,
          vendorIsKnown: true,
          treasurerIsPayee: false,
        },
        {
          amountCents: 50000,
          paymentMethod: 'CHEQUE',
          budgetLineItemId: 'budget_123',
          budgetApproved: false,
          vendorIsKnown: true,
          treasurerIsPayee: false,
        },
        {
          amountCents: 5000,
          paymentMethod: 'CASH',
          budgetLineItemId: 'budget_123',
          budgetApproved: true,
          vendorIsKnown: false,
          treasurerIsPayee: false,
        },
      ]

      inputs.forEach(input => {
        const result = determineAuthorizationRequirements(input)
        if (result.requiresManualApproval) {
          expect(result.requiredApprovalsCount).toBe(2)
          expect(result.minIndependentParentRepCount).toBe(1)
        }
      })
    })

    it('should always return 0 approvals for standing authorization', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 25000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.requiresManualApproval).toBe(false)
      expect(result.requiredApprovalsCount).toBe(0)
      expect(result.minIndependentParentRepCount).toBe(0)
    })

    it('should always populate all condition flags', () => {
      const input: AuthorizationRulesInput = {
        amountCents: 10000,
        paymentMethod: 'E_TRANSFER',
        budgetLineItemId: 'budget_123',
        budgetApproved: true,
        vendorIsKnown: true,
        treasurerIsPayee: false,
      }

      const result = determineAuthorizationRequirements(input)

      expect(result.conditions).toBeDefined()
      expect(typeof result.conditions.hasBudgetLineItem).toBe('boolean')
      expect(typeof result.conditions.budgetApproved).toBe('boolean')
      expect(typeof result.conditions.vendorKnown).toBe('boolean')
      expect(typeof result.conditions.noTreasurerConflict).toBe('boolean')
    })
  })
})
