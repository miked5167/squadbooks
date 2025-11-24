/**
 * Authentication & Authorization Types
 */

export type AssociationRole = 'association_admin' | 'board_member' | 'auditor'

export type RolePermissions = {
  canViewDashboard: boolean
  canGenerateReports: boolean
  canViewTeamDetails: boolean
  canManageAlerts: boolean
  canManageUsers: boolean
  canManageSettings: boolean
}

export const ROLE_PERMISSIONS: Record<AssociationRole, RolePermissions> = {
  association_admin: {
    canViewDashboard: true,
    canGenerateReports: true,
    canViewTeamDetails: true,
    canManageAlerts: true,
    canManageUsers: true,
    canManageSettings: true,
  },
  board_member: {
    canViewDashboard: true,
    canGenerateReports: false, // Can download, but not generate
    canViewTeamDetails: true,
    canManageAlerts: false,
    canManageUsers: false,
    canManageSettings: false,
  },
  auditor: {
    canViewDashboard: true,
    canGenerateReports: false,
    canViewTeamDetails: true,
    canManageAlerts: false,
    canManageUsers: false,
    canManageSettings: false,
  },
}
