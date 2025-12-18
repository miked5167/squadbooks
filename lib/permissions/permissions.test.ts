/**
 * Tests for Role-Based Access Control (RBAC) System
 *
 * Tests the core permission logic to ensure roles have correct permissions
 * and that exception resolution follows the security model.
 */

import { describe, test, expect } from '@jest/globals'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canResolveException,
  canApproveBudgetChange,
  Permission,
} from './permissions'
import type { UserRole } from '@prisma/client'

describe('Permission System', () => {
  describe('hasPermission', () => {
    test('TREASURER can create transactions', () => {
      expect(hasPermission('TREASURER', Permission.CREATE_TRANSACTION)).toBe(true)
    })

    test('TREASURER can fix exceptions', () => {
      expect(hasPermission('TREASURER', Permission.FIX_EXCEPTION)).toBe(true)
    })

    test('TREASURER cannot override exceptions', () => {
      expect(hasPermission('TREASURER', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(false)
    })

    test('ASSISTANT_TREASURER can override exceptions', () => {
      expect(hasPermission('ASSISTANT_TREASURER', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(true)
    })

    test('ASSISTANT_TREASURER can fix exceptions', () => {
      expect(hasPermission('ASSISTANT_TREASURER', Permission.FIX_EXCEPTION)).toBe(true)
    })

    test('PARENT can only view', () => {
      expect(hasPermission('PARENT', Permission.VIEW_TRANSACTIONS)).toBe(true)
      expect(hasPermission('PARENT', Permission.CREATE_TRANSACTION)).toBe(false)
      expect(hasPermission('PARENT', Permission.EDIT_TRANSACTION)).toBe(false)
      expect(hasPermission('PARENT', Permission.DELETE_TRANSACTION)).toBe(false)
    })

    test('COACH can view and comment', () => {
      expect(hasPermission('COACH', Permission.VIEW_TRANSACTIONS)).toBe(true)
      expect(hasPermission('COACH', Permission.VIEW_COMMENTS)).toBe(true)
      expect(hasPermission('COACH', Permission.ADD_COMMENT)).toBe(true)
      expect(hasPermission('COACH', Permission.CREATE_TRANSACTION)).toBe(false)
    })

    test('ASSOCIATION_ADMIN can resolve high severity exceptions', () => {
      expect(hasPermission('ASSOCIATION_ADMIN', Permission.RESOLVE_HIGH_SEVERITY_EXCEPTION)).toBe(true)
      expect(hasPermission('ASSOCIATION_ADMIN', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(true)
    })

    test('ADMIN has all permissions', () => {
      expect(hasPermission('ADMIN', Permission.CREATE_TRANSACTION)).toBe(true)
      expect(hasPermission('ADMIN', Permission.EDIT_ASSOCIATION_RULES)).toBe(true)
      expect(hasPermission('ADMIN', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(true)
    })
  })

  describe('hasAnyPermission', () => {
    test('TREASURER has any transaction permission', () => {
      expect(
        hasAnyPermission('TREASURER', [
          Permission.CREATE_TRANSACTION,
          Permission.EDIT_TRANSACTION,
          Permission.DELETE_TRANSACTION,
        ])
      ).toBe(true)
    })

    test('PARENT does not have any edit permission', () => {
      expect(
        hasAnyPermission('PARENT', [
          Permission.CREATE_TRANSACTION,
          Permission.EDIT_TRANSACTION,
          Permission.DELETE_TRANSACTION,
        ])
      ).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    test('TREASURER has all transaction permissions', () => {
      expect(
        hasAllPermissions('TREASURER', [
          Permission.VIEW_TRANSACTIONS,
          Permission.CREATE_TRANSACTION,
          Permission.EDIT_TRANSACTION,
        ])
      ).toBe(true)
    })

    test('COACH does not have all transaction permissions', () => {
      expect(
        hasAllPermissions('COACH', [
          Permission.VIEW_TRANSACTIONS,
          Permission.CREATE_TRANSACTION,
          Permission.EDIT_TRANSACTION,
        ])
      ).toBe(false)
    })
  })

  describe('canResolveException - Critical/High Severity', () => {
    test('TREASURER can resolve but NOT override CRITICAL exceptions', () => {
      const result = canResolveException('TREASURER', 'CRITICAL')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(false)
      expect(result.reason).toBeDefined()
      expect(result.reason).toContain('assistant treasurer')
    })

    test('TREASURER can resolve but NOT override HIGH exceptions', () => {
      const result = canResolveException('TREASURER', 'HIGH')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(false)
      expect(result.reason).toBeDefined()
    })

    test('ASSISTANT_TREASURER can resolve AND override CRITICAL exceptions', () => {
      const result = canResolveException('ASSISTANT_TREASURER', 'CRITICAL')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    test('ASSISTANT_TREASURER can resolve AND override HIGH exceptions', () => {
      const result = canResolveException('ASSISTANT_TREASURER', 'HIGH')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
    })

    test('ASSOCIATION_ADMIN can resolve AND override CRITICAL exceptions', () => {
      const result = canResolveException('ASSOCIATION_ADMIN', 'CRITICAL')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
    })

    test('COACH cannot resolve CRITICAL exceptions', () => {
      const result = canResolveException('COACH', 'CRITICAL')
      expect(result.canResolve).toBe(false)
      expect(result.canOverride).toBe(false)
      expect(result.reason).toBeDefined()
    })

    test('PARENT cannot resolve HIGH exceptions', () => {
      const result = canResolveException('PARENT', 'HIGH')
      expect(result.canResolve).toBe(false)
      expect(result.canOverride).toBe(false)
    })
  })

  describe('canResolveException - Medium/Low Severity', () => {
    test('TREASURER can resolve but NOT override MEDIUM exceptions', () => {
      const result = canResolveException('TREASURER', 'MEDIUM')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(false)
      expect(result.reason).toContain('cannot override')
    })

    test('TREASURER can resolve but NOT override LOW exceptions', () => {
      const result = canResolveException('TREASURER', 'LOW')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(false)
    })

    test('ASSISTANT_TREASURER can resolve AND override MEDIUM exceptions', () => {
      const result = canResolveException('ASSISTANT_TREASURER', 'MEDIUM')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
    })

    test('ASSISTANT_TREASURER can resolve AND override LOW exceptions', () => {
      const result = canResolveException('ASSISTANT_TREASURER', 'LOW')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
    })

    test('ASSOCIATION_ADMIN can resolve AND override MEDIUM exceptions', () => {
      const result = canResolveException('ASSOCIATION_ADMIN', 'MEDIUM')
      expect(result.canResolve).toBe(true)
      expect(result.canOverride).toBe(true)
    })
  })

  describe('canApproveBudgetChange', () => {
    test('ASSOCIATION_ADMIN can always approve budget changes', () => {
      expect(canApproveBudgetChange('ASSOCIATION_ADMIN', false)).toBe(true)
      expect(canApproveBudgetChange('ASSOCIATION_ADMIN', true)).toBe(true)
    })

    test('TREASURER can always approve budget changes', () => {
      expect(canApproveBudgetChange('TREASURER', false)).toBe(true)
      expect(canApproveBudgetChange('TREASURER', true)).toBe(true)
    })

    test('COACH can approve budget changes only if association allows', () => {
      expect(canApproveBudgetChange('COACH', true)).toBe(true)
      expect(canApproveBudgetChange('COACH', false)).toBe(false)
    })

    test('PARENT cannot approve budget changes', () => {
      expect(canApproveBudgetChange('PARENT', false)).toBe(false)
      expect(canApproveBudgetChange('PARENT', true)).toBe(false)
    })

    test('ASSISTANT_TREASURER cannot approve budget changes', () => {
      expect(canApproveBudgetChange('ASSISTANT_TREASURER', false)).toBe(false)
      expect(canApproveBudgetChange('ASSISTANT_TREASURER', true)).toBe(false)
    })
  })

  describe('Role Separation Tests', () => {
    test('TREASURER and ASSISTANT_TREASURER have distinct permissions', () => {
      // Treasurer can fix but not override
      expect(hasPermission('TREASURER', Permission.FIX_EXCEPTION)).toBe(true)
      expect(hasPermission('TREASURER', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(false)

      // Assistant Treasurer can override
      expect(hasPermission('ASSISTANT_TREASURER', Permission.FIX_EXCEPTION)).toBe(true)
      expect(hasPermission('ASSISTANT_TREASURER', Permission.RESOLVE_EXCEPTION_OVERRIDE)).toBe(true)

      // Treasurer can create/edit transactions, Assistant Treasurer cannot
      expect(hasPermission('TREASURER', Permission.CREATE_TRANSACTION)).toBe(true)
      expect(hasPermission('TREASURER', Permission.EDIT_TRANSACTION)).toBe(true)
      expect(hasPermission('ASSISTANT_TREASURER', Permission.CREATE_TRANSACTION)).toBe(false)
      expect(hasPermission('ASSISTANT_TREASURER', Permission.EDIT_TRANSACTION)).toBe(false)
    })

    test('COACH vs PARENT permissions', () => {
      // Both can view
      expect(hasPermission('COACH', Permission.VIEW_TRANSACTIONS)).toBe(true)
      expect(hasPermission('PARENT', Permission.VIEW_TRANSACTIONS)).toBe(true)

      // Coach can comment, Parent cannot
      expect(hasPermission('COACH', Permission.ADD_COMMENT)).toBe(true)
      expect(hasPermission('PARENT', Permission.ADD_COMMENT)).toBe(false)

      // Coach has budget approval permission (conditional), Parent does not
      expect(hasPermission('COACH', Permission.APPROVE_BUDGET_CHANGE)).toBe(true)
      expect(hasPermission('PARENT', Permission.APPROVE_BUDGET_CHANGE)).toBe(false)
    })
  })

  describe('Security Model Validation', () => {
    test('No role can bypass exception resolution rules', () => {
      // Even ADMIN follows the resolution rules
      const roles: UserRole[] = ['TREASURER', 'ASSISTANT_TREASURER', 'COACH', 'ASSOCIATION_ADMIN', 'PARENT', 'ADMIN']

      roles.forEach((role) => {
        const result = canResolveException(role, 'CRITICAL')

        // Only specific roles can override
        if (role === 'ASSISTANT_TREASURER' || role === 'ASSOCIATION_ADMIN' || role === 'ADMIN') {
          expect(result.canOverride).toBe(true)
        } else if (role === 'TREASURER') {
          expect(result.canResolve).toBe(true)
          expect(result.canOverride).toBe(false)
        } else {
          expect(result.canResolve).toBe(false)
          expect(result.canOverride).toBe(false)
        }
      })
    })

    test('Parents have strictly read-only access', () => {
      const writePermissions = [
        Permission.CREATE_TRANSACTION,
        Permission.EDIT_TRANSACTION,
        Permission.DELETE_TRANSACTION,
        Permission.CATEGORIZE_TRANSACTION,
        Permission.ATTACH_RECEIPT,
        Permission.RESOLVE_EXCEPTION,
        Permission.FIX_EXCEPTION,
        Permission.CREATE_BUDGET,
        Permission.EDIT_BUDGET,
        Permission.ADD_COMMENT,
      ]

      writePermissions.forEach((permission) => {
        expect(hasPermission('PARENT', permission)).toBe(false)
      })
    })
  })
})
