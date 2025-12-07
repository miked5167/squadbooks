'use server'

import { prisma } from '@/lib/prisma'
import { isDemoMode } from '@/app/lib/demoMode'

// Response types
export type AssociationSettingsResponse = {
  association: {
    id: string
    name: string
    abbreviation: string | null
    provinceState: string | null
    country: string | null
    currency: string
    season: string | null
    logoUrl: string | null
    preSeasonBudgetDeadline: Date | null
    preSeasonBudgetsRequired: number | null
    preSeasonBudgetAutoApprove: boolean
    createdAt: Date
    updatedAt: Date
  }
  users: Array<{
    id: string
    name: string | null
    email: string
    role: string
    lastLoginAt: Date | null
    createdAt: Date
  }>
}

export type UpdateAssociationPayload = {
  name?: string
  abbreviation?: string
  provinceState?: string
  country?: string
  currency?: string
  season?: string
  logoUrl?: string
  preSeasonBudgetDeadline?: string
  preSeasonBudgetsRequired?: string
  preSeasonBudgetAutoApprove?: boolean
}

// Valid role values (based on schema comments)
const VALID_ROLES = ['association_admin', 'board_member', 'auditor', 'treasurer', 'viewer']

/**
 * Fetch association settings including association details and users
 */
export async function getAssociationSettings(
  associationId: string
): Promise<AssociationSettingsResponse> {
  try {
    // Fetch association details
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        provinceState: true,
        country: true,
        currency: true,
        season: true,
        logoUrl: true,
        preSeasonBudgetDeadline: true,
        preSeasonBudgetsRequired: true,
        preSeasonBudgetAutoApprove: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!association) {
      throw new Error(`Association with ID ${associationId} not found`)
    }

    // Fetch all users for this association
    const users = await prisma.associationUser.findMany({
      where: {
        associationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return {
      association,
      users,
    }
  } catch (error) {
    console.error('Error fetching association settings:', error)
    throw error
  }
}

/**
 * Update association details (partial update)
 */
export async function updateAssociation(
  associationId: string,
  data: UpdateAssociationPayload
): Promise<void> {
  // Guard: Skip in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: Skipping association update')
    return
  }

  try {
    // Validate that the association exists
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: { id: true },
    })

    if (!association) {
      throw new Error(`Association with ID ${associationId} not found`)
    }

    // Only include fields that are actually provided
    const updateData: Record<string, any> = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.abbreviation !== undefined) updateData.abbreviation = data.abbreviation
    if (data.provinceState !== undefined) updateData.provinceState = data.provinceState
    if (data.country !== undefined) updateData.country = data.country
    if (data.currency !== undefined) updateData.currency = data.currency
    if (data.season !== undefined) updateData.season = data.season
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl

    // Pre-season budget configuration
    if (data.preSeasonBudgetDeadline !== undefined) {
      updateData.preSeasonBudgetDeadline = data.preSeasonBudgetDeadline
        ? new Date(data.preSeasonBudgetDeadline)
        : null
    }
    if (data.preSeasonBudgetsRequired !== undefined) {
      updateData.preSeasonBudgetsRequired = data.preSeasonBudgetsRequired
        ? parseInt(data.preSeasonBudgetsRequired, 10)
        : null
    }
    if (data.preSeasonBudgetAutoApprove !== undefined) {
      updateData.preSeasonBudgetAutoApprove = data.preSeasonBudgetAutoApprove
    }

    // Perform the update
    await prisma.association.update({
      where: { id: associationId },
      data: updateData,
    })

    console.log(`Successfully updated association ${associationId}`)
  } catch (error) {
    console.error('Error updating association:', error)
    throw error
  }
}

/**
 * Update association user role
 */
export async function updateAssociationUserRole(
  associationUserId: string,
  newRole: string
): Promise<void> {
  // Guard: Skip in demo mode
  if (isDemoMode()) {
    console.log('Demo mode: Skipping user role update')
    return
  }

  try {
    // Validate role value
    if (!VALID_ROLES.includes(newRole.toLowerCase())) {
      throw new Error(`Invalid role: ${newRole}. Must be one of: ${VALID_ROLES.join(', ')}`)
    }

    // Validate that the user exists
    const user = await prisma.associationUser.findUnique({
      where: { id: associationUserId },
      select: { id: true, email: true },
    })

    if (!user) {
      throw new Error(`Association user with ID ${associationUserId} not found`)
    }

    // Update the role
    await prisma.associationUser.update({
      where: { id: associationUserId },
      data: { role: newRole.toLowerCase() },
    })

    console.log(`Successfully updated role for user ${user.email} to ${newRole}`)
  } catch (error) {
    console.error('Error updating user role:', error)
    throw error
  }
}
