/**
 * Permission Utilities and Auth Guards
 * Role-based access control helpers for the Settings module
 */

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

/**
 * Gets the current user from Clerk and database
 * @throws {Error} if user is not authenticated or not found
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth()

  if (!clerkId) {
    throw new Error('Unauthorized: No user session found')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      teamId: true,
      isActive: true,
    },
  })

  if (!user) {
    throw new Error('Unauthorized: User not found in database')
  }

  if (!user.isActive) {
    throw new Error('Unauthorized: User account is deactivated')
  }

  return user
}

/**
 * Checks if the current user has one of the required roles
 * @param allowedRoles - Array of roles that are allowed
 * @throws {Error} if user doesn't have required role
 */
export async function requireRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser()

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Forbidden: This action requires one of the following roles: ${allowedRoles.join(', ')}`
    )
  }

  return user
}

/**
 * Requires user to be a Treasurer or Assistant Treasurer
 * Most Settings pages require this level of access
 */
export async function requireTreasurer() {
  return requireRole([UserRole.TREASURER, UserRole.ASSISTANT_TREASURER])
}

/**
 * Requires user to be a Treasurer only (not Assistant)
 * For sensitive operations like user management and season close
 */
export async function requireTreasurerOnly() {
  return requireRole([UserRole.TREASURER])
}

/**
 * Requires user to be an Auditor
 * For audit log access
 */
export async function requireAuditor() {
  return requireRole([UserRole.AUDITOR, UserRole.TREASURER])
}

/**
 * Checks if user has permission to manage other users
 * @param targetUserId - The user being managed
 * @param currentUser - The current user (optional, will fetch if not provided)
 */
export async function canManageUser(
  targetUserId: string,
  currentUser?: Awaited<ReturnType<typeof getCurrentUser>>
) {
  const user = currentUser || await getCurrentUser()

  // Only treasurers can manage users
  if (user.role !== UserRole.TREASURER) {
    return false
  }

  // Get the target user
  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true, teamId: true },
  })

  if (!targetUser) {
    throw new Error('Target user not found')
  }

  // Can only manage users in same team
  if (targetUser.teamId !== user.teamId) {
    return false
  }

  // Treasurers cannot demote themselves
  if (targetUser.id === user.id) {
    return false
  }

  return true
}

/**
 * Gets the team settings for the current user's team
 */
export async function getTeamSettings(teamId?: string) {
  const user = await getCurrentUser()
  const targetTeamId = teamId || user.teamId

  // Verify user has access to this team
  if (targetTeamId !== user.teamId) {
    throw new Error('Forbidden: Cannot access settings for another team')
  }

  const settings = await prisma.teamSettings.findUnique({
    where: { teamId: targetTeamId },
  })

  // Return default settings if none exist
  if (!settings) {
    return {
      id: 'default',
      teamId: targetTeamId,
      dualApprovalEnabled: true,
      dualApprovalThreshold: 200.0,
      receiptRequired: true,
      allowSelfReimbursement: false,
      duplicateDetectionEnabled: true,
      allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
      duplicateDetectionWindow: 7,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  return settings
}

/**
 * Creates default team settings if they don't exist
 */
export async function ensureTeamSettings(teamId: string) {
  const existing = await prisma.teamSettings.findUnique({
    where: { teamId },
  })

  if (existing) {
    return existing
  }

  return await prisma.teamSettings.create({
    data: {
      teamId,
      dualApprovalEnabled: true,
      dualApprovalThreshold: 200.0,
      receiptRequired: true,
      allowSelfReimbursement: false,
      duplicateDetectionEnabled: true,
      allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
      duplicateDetectionWindow: 7,
    },
  })
}

/**
 * Checks if a transaction requires dual approval based on team settings
 * @param amount - Transaction amount in cents
 * @param teamId - Team ID
 * @returns true if dual approval is required
 */
export async function requiresDualApproval(amount: number, teamId: string) {
  const settings = await getTeamSettings(teamId)

  if (!settings.dualApprovalEnabled) {
    return false
  }

  // Convert threshold from dollars to cents for comparison
  const thresholdInCents = Number(settings.dualApprovalThreshold) * 100

  return amount >= thresholdInCents
}

/**
 * Validates if a user can approve their own transaction
 * @param transaction - Transaction to check
 * @param userId - User attempting to approve
 */
export async function canApproveSelfTransaction(
  transactionUserId: string,
  approvingUserId: string,
  teamId: string
) {
  // Cannot approve own transaction
  if (transactionUserId === approvingUserId) {
    return false
  }

  const settings = await getTeamSettings(teamId)

  // Check if self-reimbursement is allowed (this setting applies to approval too)
  return settings.allowSelfReimbursement
}

/**
 * Type guard to check if a string is a valid UserRole
 */
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole)
}
