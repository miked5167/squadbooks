/**
 * Server-side permission utilities for API endpoints
 *
 * Use these in API routes to check permissions before allowing actions
 */

import type { UserRole } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/server-auth'
import type { Permission } from './permissions'
import { hasPermission, PermissionErrors, canResolveException } from './permissions'

/**
 * Get current user with role and team info
 * Updated to support both team users (User table) and association users (AssociationUser table)
 */
export async function getCurrentUser() {
  const { userId } = await auth()

  if (!userId) {
    return null
  }

  // First try to find a team user
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      role: true,
      teamId: true,
      associationUserId: true,
      name: true,
      email: true,
      associationUser: {
        select: {
          associationId: true,
        },
      },
    },
  })

  if (user) {
    // Return team user with associationId at top level for easier access
    return {
      ...user,
      associationId: user.associationUser?.associationId || null,
    }
  }

  // If not found in User table, try AssociationUser table
  const associationUser = await prisma.associationUser.findFirst({
    where: { clerkUserId: userId },
    select: {
      id: true,
      clerkUserId: true,
      role: true,
      associationId: true,
      name: true,
      email: true,
    },
  })

  if (!associationUser) {
    return null
  }

  // Return association user in User-compatible format
  return {
    id: associationUser.id,
    clerkId: associationUser.clerkUserId,
    role: associationUser.role as any, // AssociationUser role is string, User role is enum
    teamId: null as any, // Association users don't have a specific team
    associationUserId: associationUser.id,
    name: associationUser.name || 'Association User',
    email: associationUser.email,
    associationUser: {
      associationId: associationUser.associationId,
    },
    associationId: associationUser.associationId,
  }
}

/**
 * Check if user is an association user (has associationId)
 */
export function isAssociationUser(user: Awaited<ReturnType<typeof getCurrentUser>>): boolean {
  return user !== null && user.associationId !== null
}

/**
 * Get all teams accessible to the current association user
 */
export async function getAccessibleTeams() {
  const user = await getCurrentUser()

  if (!user || !user.associationId) {
    return []
  }

  // Query AssociationTeam junction table to find teams for this association
  const associationTeams = await prisma.associationTeam.findMany({
    where: {
      associationId: user.associationId,
      isActive: true,
    },
    select: {
      teamId: true,
      teamName: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Return teams in consistent format, filtering out any without valid IDs
  return associationTeams
    .map(at => ({
      id: at.teamId || at.team?.id || '',
      name: at.team?.name || at.teamName,
    }))
    .filter(team => team.id !== '') // Only return teams with valid IDs
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new PermissionError('You must be logged in to access this resource', 401)
  }

  return user
}

/**
 * Require specific permission - throws if user doesn't have it
 */
export async function requirePermission(permission: Permission) {
  const user = await requireAuth()

  if (!hasPermission(user.role, permission)) {
    throw new PermissionError(PermissionErrors.PERMISSION_REQUIRED(permission), 403)
  }

  return user
}

/**
 * Require any of the specified permissions - throws if user doesn't have any
 */
export async function requireAnyPermission(permissions: Permission[]) {
  const user = await requireAuth()

  const hasAny = permissions.some(p => hasPermission(user.role, p))

  if (!hasAny) {
    throw new PermissionError(`This action requires one of: ${permissions.join(', ')}`, 403)
  }

  return user
}

/**
 * Require specific role - throws if user doesn't have it
 */
export async function requireRole(role: UserRole | UserRole[]) {
  const user = await requireAuth()

  const roles = Array.isArray(role) ? role : [role]

  if (!roles.includes(user.role)) {
    throw new PermissionError(PermissionErrors.ROLE_REQUIRED(roles.join(' or ')), 403)
  }

  return user
}

/**
 * Check if user can access a specific team's data
 */
export async function requireTeamAccess(teamId: string) {
  const user = await requireAuth()

  // Association admins can access any team in their association
  if (user.role === 'ASSOCIATION_ADMIN') {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        associationTeam: {
          select: {
            associationId: true,
          },
        },
      },
    })

    if (team?.associationTeam?.associationId !== user.associationId) {
      throw new PermissionError('You do not have access to this team', 403)
    }

    return user
  }

  // Other users can only access their own team
  if (user.teamId !== teamId) {
    throw new PermissionError('You do not have access to this team', 403)
  }

  return user
}

/**
 * Check if user can resolve an exception based on severity
 */
export async function requireExceptionResolvePermission(
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
  method: 'OVERRIDE' | 'CORRECT' | 'REVALIDATE'
) {
  const user = await requireAuth()

  const permissions = canResolveException(user.role, severity)

  if (!permissions.canResolve) {
    throw new PermissionError(
      permissions.reason || 'You do not have permission to resolve this exception',
      403
    )
  }

  // Check if trying to override without permission
  if (method === 'OVERRIDE' && !permissions.canOverride) {
    throw new PermissionError(
      permissions.reason ||
        'You do not have permission to override this exception. You can only fix the underlying issue.',
      403
    )
  }

  return user
}

/**
 * Check if user can approve budget changes
 */
export async function requireBudgetApprovalPermission(teamId: string) {
  const user = await requireAuth()

  // Get team and association settings
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      associationTeam: {
        select: {
          associationId: true,
          association: {
            select: {
              // Assuming association has settings for coach approval
              // Note: Association model doesn't have a settings field in the schema
              // This may need to be updated based on actual schema
              id: true,
            },
          },
        },
      },
    },
  })

  if (!team) {
    throw new PermissionError('Team not found', 404)
  }

  // Association admin can always approve
  if (user.role === 'ASSOCIATION_ADMIN') {
    if (team.associationTeam?.associationId !== user.associationId) {
      throw new PermissionError('You do not have access to this team', 403)
    }
    return user
  }

  // Treasurer can approve for their team
  if (user.role === 'TREASURER' && user.teamId === teamId) {
    return user
  }

  // Coach can approve if association allows it
  // Note: Association model doesn't have a settings field in current schema
  // This will always be false for now - may need to add this setting to DashboardConfig
  const associationAllowsCoachApproval =
    (team.associationTeam?.association as any)?.settings?.allowCoachBudgetApproval || false

  if (user.role === 'COACH' && user.teamId === teamId && associationAllowsCoachApproval) {
    return user
  }

  throw new PermissionError('You do not have permission to approve budget changes', 403)
}

/**
 * Custom permission error class
 */
export class PermissionError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number = 403) {
    super(message)
    this.name = 'PermissionError'
    this.statusCode = statusCode
  }
}

/**
 * Handle permission errors in API routes
 *
 * Usage:
 * ```ts
 * try {
 *   const user = await requirePermission(Permission.CREATE_TRANSACTION)
 *   // ... do action
 * } catch (error) {
 *   return handlePermissionError(error)
 * }
 * ```
 */
export function handlePermissionError(error: unknown) {
  if (error instanceof PermissionError) {
    return new Response(JSON.stringify({ error: error.message }), { status: error.statusCode })
  }

  console.error('Unexpected error:', error)
  return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), { status: 500 })
}
