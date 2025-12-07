// Permission utilities for AI Assistant
import { UserRole } from '@prisma/client'
import type { UserPermissions } from '@/lib/types/assistant'

export function getUserPermissions(role: UserRole): UserPermissions {
  const basePermissions: UserPermissions = {
    canCreateTransaction: false,
    canEditTransaction: false,
    canApproveTransaction: false,
    canViewBudget: false,
    canEditBudget: false,
    canSendReminders: false,
    canGenerateReports: false,
    canManageTeam: false,
  }

  switch (role) {
    case 'TREASURER':
    case 'ASSISTANT_TREASURER':
      return {
        canCreateTransaction: true,
        canEditTransaction: true,
        canApproveTransaction: true,
        canViewBudget: true,
        canEditBudget: true,
        canSendReminders: true,
        canGenerateReports: true,
        canManageTeam: true,
      }

    case 'PRESIDENT':
    case 'BOARD_MEMBER':
      return {
        canCreateTransaction: false,
        canEditTransaction: false,
        canApproveTransaction: true,
        canViewBudget: true,
        canEditBudget: false,
        canSendReminders: true,
        canGenerateReports: true,
        canManageTeam: false,
      }

    case 'AUDITOR':
      return {
        canCreateTransaction: false,
        canEditTransaction: false,
        canApproveTransaction: false,
        canViewBudget: true,
        canEditBudget: false,
        canSendReminders: false,
        canGenerateReports: true,
        canManageTeam: false,
      }

    case 'PARENT':
      return {
        canCreateTransaction: false,
        canEditTransaction: false,
        canApproveTransaction: false,
        canViewBudget: true,
        canEditBudget: false,
        canSendReminders: false,
        canGenerateReports: false,
        canManageTeam: false,
      }

    default:
      return basePermissions
  }
}

export function hasPermission(
  permissions: UserPermissions,
  action: keyof UserPermissions
): boolean {
  return permissions[action] === true
}

export function validateToolPermission(
  permissions: UserPermissions,
  toolName: string
): { allowed: boolean; reason?: string } {
  switch (toolName) {
    case 'createTransaction':
      return {
        allowed: permissions.canCreateTransaction,
        reason: permissions.canCreateTransaction
          ? undefined
          : 'You do not have permission to create transactions. Only Treasurers can create transactions.',
      }

    case 'editTransaction':
      return {
        allowed: permissions.canEditTransaction,
        reason: permissions.canEditTransaction
          ? undefined
          : 'You do not have permission to edit transactions. Only Treasurers can edit transactions.',
      }

    case 'approveTransaction':
      return {
        allowed: permissions.canApproveTransaction,
        reason: permissions.canApproveTransaction
          ? undefined
          : 'You do not have permission to approve transactions. Only Treasurers and Board Members can approve transactions.',
      }

    case 'sendParentReminder':
      return {
        allowed: permissions.canSendReminders,
        reason: permissions.canSendReminders
          ? undefined
          : 'You do not have permission to send reminders.',
      }

    case 'generateReport':
      return {
        allowed: permissions.canGenerateReports,
        reason: permissions.canGenerateReports
          ? undefined
          : 'You do not have permission to generate reports.',
      }

    case 'getTeamBudgetStatus':
    case 'getTeamTransactions':
    case 'getAssociationComplianceFlags':
      return {
        allowed: permissions.canViewBudget,
        reason: permissions.canViewBudget
          ? undefined
          : 'You do not have permission to view budget information.',
      }

    case 'openPage':
      return { allowed: true } // Navigation is always allowed

    default:
      return {
        allowed: false,
        reason: `Unknown tool: ${toolName}`,
      }
  }
}
