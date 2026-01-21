/**
 * React hook for checking permissions in UI components
 *
 * Usage:
 * ```tsx
 * const { hasPermission, canResolveException } = usePermissions()
 *
 * if (hasPermission(Permission.CREATE_TRANSACTION)) {
 *   return <Button>Add Transaction</Button>
 * }
 * ```
 */

'use client'

import { useUser } from '@clerk/nextjs'
import { UserRole } from '@prisma/client'
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  canResolveException as checkCanResolveException,
  canApproveBudgetChange as checkCanApproveBudgetChange,
  Permission,
} from '@/lib/permissions/permissions'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

// Mock user for dev mode
const DEV_USER = {
  id: 'dev-user',
  publicMetadata: {
    role: 'ASSISTANT_TREASURER' as UserRole, // Default to ASSISTANT_TREASURER for testing all features
  },
}

export function usePermissions() {
  // In dev mode, skip Clerk entirely and use mock user
  // In production, use Clerk's useUser hook
  const clerkResult = DEV_MODE ? { user: DEV_USER, isLoaded: true } : useUser()
  const { user, isLoaded } = clerkResult

  // Get user role from public metadata or environment variable in dev mode
  let role: UserRole = 'PARENT'

  if (DEV_MODE) {
    // In dev mode, allow role override via env var
    role = (process.env.NEXT_PUBLIC_DEV_ROLE as UserRole) || 'ASSISTANT_TREASURER'
  } else if (user?.publicMetadata?.role) {
    role = user.publicMetadata.role as UserRole
  }

  /**
   * Check if current user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false
    return checkPermission(role, permission)
  }

  /**
   * Check if current user has any of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user) return false
    return checkAnyPermission(role, permissions)
  }

  /**
   * Check if current user has all of the specified permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user) return false
    return checkAllPermissions(role, permissions)
  }

  /**
   * Check if current user can resolve an exception based on severity
   */
  const canResolveException = (severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    if (!user) return { canResolve: false, canOverride: false }
    return checkCanResolveException(role, severity)
  }

  /**
   * Check if current user can approve budget changes
   */
  const canApproveBudgetChange = (associationAllowsCoachApproval: boolean): boolean => {
    if (!user) return false
    return checkCanApproveBudgetChange(role, associationAllowsCoachApproval)
  }

  /**
   * Check if current user has a specific role
   */
  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(role)
  }

  /**
   * Check if current user is a treasurer (includes assistant treasurer)
   */
  const isTreasurer = (): boolean => {
    return hasRole(['TREASURER', 'ASSISTANT_TREASURER'])
  }

  /**
   * Check if current user is read-only (parent)
   */
  const isReadOnly = (): boolean => {
    return role === 'PARENT'
  }

  return {
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canResolveException,
    canApproveBudgetChange,
    hasRole,
    isTreasurer,
    isReadOnly,
  }
}
