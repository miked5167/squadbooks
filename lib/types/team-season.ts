/**
 * Team Season Lifecycle Types
 */

import { TeamSeasonState, TeamSeasonAction } from '@prisma/client'

export type { TeamSeasonState, TeamSeasonAction }

/**
 * Transition result
 */
export interface TransitionResult {
  success: boolean
  newState: TeamSeasonState
  error?: string
  metadata?: Record<string, any>
}

/**
 * Actor type for transitions
 */
export type ActorType = 'USER' | 'SYSTEM'

/**
 * Permission check context
 */
export interface PermissionContext {
  userId: string
  userRole: string
  teamId: string
  associationId?: string
}

/**
 * Transition guard result
 */
export interface GuardResult {
  allowed: boolean
  reason?: string
}

/**
 * Team Season with related data for transitions
 */
export interface TeamSeasonWithRelations {
  id: string
  teamId: string
  associationId: string
  seasonLabel: string
  state: TeamSeasonState
  presentedVersionId: string | null
  lockedVersionId: string | null
  eligibleFamiliesCount: number | null
  approvalsCountForPresentedVersion: number | null
  team?: {
    id: string
    budgets: {
      id: string
      status: string
      presentedVersionNumber: number | null
      versions: {
        id: string
        versionNumber: number
        approvals: any[]
      }[]
    }[]
  }
}
