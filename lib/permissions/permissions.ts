/**
 * Role-Based Access Control (RBAC) System
 *
 * Defines permissions for the validation-first transaction model
 */

import { UserRole } from '@prisma/client'

/**
 * Permission types for various actions in the system
 */
export enum Permission {
  // Transaction permissions
  VIEW_TRANSACTIONS = 'VIEW_TRANSACTIONS',
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
  EDIT_TRANSACTION = 'EDIT_TRANSACTION',
  DELETE_TRANSACTION = 'DELETE_TRANSACTION',
  CATEGORIZE_TRANSACTION = 'CATEGORIZE_TRANSACTION',
  ATTACH_RECEIPT = 'ATTACH_RECEIPT',

  // Exception permissions
  VIEW_EXCEPTIONS = 'VIEW_EXCEPTIONS',
  RESOLVE_EXCEPTION = 'RESOLVE_EXCEPTION',
  RESOLVE_EXCEPTION_OVERRIDE = 'RESOLVE_EXCEPTION_OVERRIDE',
  RESOLVE_HIGH_SEVERITY_EXCEPTION = 'RESOLVE_HIGH_SEVERITY_EXCEPTION',
  FIX_EXCEPTION = 'FIX_EXCEPTION', // Fix underlying issue (recategorize, attach receipt, etc.)

  // Budget permissions
  VIEW_BUDGET = 'VIEW_BUDGET',
  CREATE_BUDGET = 'CREATE_BUDGET',
  EDIT_BUDGET = 'EDIT_BUDGET',
  APPROVE_BUDGET = 'APPROVE_BUDGET',
  APPROVE_BUDGET_CHANGE = 'APPROVE_BUDGET_CHANGE',

  // Comment permissions
  VIEW_COMMENTS = 'VIEW_COMMENTS',
  ADD_COMMENT = 'ADD_COMMENT',

  // Association rules permissions
  VIEW_ASSOCIATION_RULES = 'VIEW_ASSOCIATION_RULES',
  EDIT_ASSOCIATION_RULES = 'EDIT_ASSOCIATION_RULES',

  // Reporting permissions
  VIEW_REPORTS = 'VIEW_REPORTS',
  VIEW_ROLLUP_REPORTS = 'VIEW_ROLLUP_REPORTS',
  GENERATE_REPORTS = 'GENERATE_REPORTS',

  // Analytics permissions
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  VIEW_EXCEPTION_ANALYTICS = 'VIEW_EXCEPTION_ANALYTICS',

  // Team management
  MANAGE_TEAM_MEMBERS = 'MANAGE_TEAM_MEMBERS',
  INVITE_PARENTS = 'INVITE_PARENTS',
}

/**
 * Role-to-permissions mapping
 *
 * Defines what each role can do in the system
 */
export const RolePermissions: Record<UserRole, Permission[]> = {
  TREASURER: [
    // Full transaction management
    Permission.VIEW_TRANSACTIONS,
    Permission.CREATE_TRANSACTION,
    Permission.EDIT_TRANSACTION,
    Permission.DELETE_TRANSACTION,
    Permission.CATEGORIZE_TRANSACTION,
    Permission.ATTACH_RECEIPT,

    // Exception handling - can fix issues but NOT override
    Permission.VIEW_EXCEPTIONS,
    Permission.FIX_EXCEPTION,

    // Budget management
    Permission.VIEW_BUDGET,
    Permission.CREATE_BUDGET,
    Permission.EDIT_BUDGET,

    // Comments
    Permission.VIEW_COMMENTS,
    Permission.ADD_COMMENT,

    // Reports and analytics
    Permission.VIEW_REPORTS,
    Permission.GENERATE_REPORTS,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_EXCEPTION_ANALYTICS,

    // Team management
    Permission.MANAGE_TEAM_MEMBERS,
    Permission.INVITE_PARENTS,
  ],

  ASSISTANT_TREASURER: [
    // Transaction viewing and commenting
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_COMMENTS,
    Permission.ADD_COMMENT,

    // Exception handling - can override with justification
    Permission.VIEW_EXCEPTIONS,
    Permission.RESOLVE_EXCEPTION,
    Permission.RESOLVE_EXCEPTION_OVERRIDE,
    Permission.FIX_EXCEPTION,

    // Budget viewing
    Permission.VIEW_BUDGET,

    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_EXCEPTION_ANALYTICS,
  ],

  COACH: [
    // View-only for transactions
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_COMMENTS,
    Permission.ADD_COMMENT,

    // Budget viewing and conditional approval
    Permission.VIEW_BUDGET,
    Permission.APPROVE_BUDGET_CHANGE, // If configured by association

    // Reports
    Permission.VIEW_REPORTS,
  ],

  ASSOCIATION_ADMIN: [
    // Full visibility across all teams
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_EXCEPTIONS,

    // Can resolve high-severity exceptions
    Permission.RESOLVE_HIGH_SEVERITY_EXCEPTION,
    Permission.RESOLVE_EXCEPTION_OVERRIDE,

    // Association rule management
    Permission.VIEW_ASSOCIATION_RULES,
    Permission.EDIT_ASSOCIATION_RULES,

    // Rollup reports across all teams
    Permission.VIEW_ROLLUP_REPORTS,
    Permission.VIEW_REPORTS,

    // Analytics
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_EXCEPTION_ANALYTICS,

    // Budget approval
    Permission.APPROVE_BUDGET,

    // Comments
    Permission.VIEW_COMMENTS,
    Permission.ADD_COMMENT,
  ],

  PARENT: [
    // Read-only access
    Permission.VIEW_TRANSACTIONS,
    Permission.VIEW_BUDGET,
    Permission.VIEW_REPORTS,
    Permission.VIEW_COMMENTS,
  ],

  ADMIN: [
    // System admin has all permissions
    ...Object.values(Permission),
  ],
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = RolePermissions[role]
  return rolePermissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return RolePermissions[role] || []
}

/**
 * Permission error messages
 */
export const PermissionErrors = {
  UNAUTHORIZED: 'You do not have permission to perform this action',
  ROLE_REQUIRED: (requiredRole: string) => `This action requires ${requiredRole} role`,
  PERMISSION_REQUIRED: (permission: string) => `This action requires ${permission} permission`,
}

/**
 * Check exception resolution permissions based on severity
 */
export function canResolveException(
  role: UserRole,
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): {
  canResolve: boolean
  canOverride: boolean
  reason?: string
} {
  // Association admin can resolve high-severity exceptions
  if (severity === 'CRITICAL' || severity === 'HIGH') {
    if (role === 'ASSOCIATION_ADMIN') {
      return { canResolve: true, canOverride: true }
    }
    // Assistant treasurer can override high-severity with justification
    if (role === 'ASSISTANT_TREASURER') {
      return { canResolve: true, canOverride: true }
    }
    // Treasurer cannot override high-severity
    if (role === 'TREASURER') {
      return {
        canResolve: true,
        canOverride: false,
        reason: 'High-severity exceptions require assistant treasurer or association admin approval',
      }
    }
    return {
      canResolve: false,
      canOverride: false,
      reason: 'You do not have permission to resolve high-severity exceptions',
    }
  }

  // For MEDIUM and LOW severity
  // Assistant treasurer can override
  if (role === 'ASSISTANT_TREASURER' || role === 'ASSOCIATION_ADMIN') {
    return { canResolve: true, canOverride: true }
  }

  // Treasurer can fix but not override
  if (role === 'TREASURER') {
    return {
      canResolve: true,
      canOverride: false,
      reason: 'You can fix the underlying issue but cannot override without assistant treasurer approval',
    }
  }

  return {
    canResolve: false,
    canOverride: false,
    reason: 'You do not have permission to resolve exceptions',
  }
}

/**
 * Check budget approval permissions
 */
export function canApproveBudgetChange(role: UserRole, associationAllowsCoachApproval: boolean): boolean {
  if (role === 'ASSOCIATION_ADMIN') return true
  if (role === 'TREASURER') return true
  if (role === 'COACH' && associationAllowsCoachApproval) return true
  return false
}
