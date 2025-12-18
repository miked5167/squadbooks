import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireTreasurer } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import {
  teamReceiptOverrideSchema,
  validateTeamOverrideStrictness,
} from '@/lib/validations/receipt-policy'
import { z } from 'zod'

/**
 * GET /api/teams/[teamId]/receipt-override
 * Get receipt override setting for a team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    // Verify user is treasurer
    const user = await requireTreasurer()

    // Verify user's team matches the requested team
    if (user.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only access your own team settings' },
        { status: 403 }
      )
    }

    // Fetch team settings with association policy
    const teamSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
      select: {
        id: true,
        teamId: true,
        receiptGlobalThresholdOverrideCents: true,
        team: {
          select: {
            associationTeam: {
              select: {
                association: {
                  select: {
                    id: true,
                    name: true,
                    receiptsEnabled: true,
                    receiptGlobalThresholdCents: true,
                    receiptGracePeriodDays: true,
                    allowedTeamThresholdOverride: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!teamSettings) {
      return NextResponse.json({ error: 'Team settings not found' }, { status: 404 })
    }

    // Get association info
    const association = teamSettings.team.associationTeam?.association

    if (!association) {
      return NextResponse.json(
        { error: 'Team is not associated with an association' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      teamId,
      receiptGlobalThresholdOverrideCents: teamSettings.receiptGlobalThresholdOverrideCents,
      association: {
        id: association.id,
        name: association.name,
        receiptsEnabled: association.receiptsEnabled,
        receiptGlobalThresholdCents: association.receiptGlobalThresholdCents,
        receiptGracePeriodDays: association.receiptGracePeriodDays,
        allowedTeamThresholdOverride: association.allowedTeamThresholdOverride,
      },
    })
  } catch (error) {
    console.error('Error fetching team receipt override:', error)

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch team receipt override',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/teams/[teamId]/receipt-override
 * Update receipt override setting for a team
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { teamId } = await params

    // Verify user is treasurer
    const user = await requireTreasurer()

    // Verify user's team matches the requested team
    if (user.teamId !== teamId) {
      return NextResponse.json(
        { error: 'Forbidden: You can only modify your own team settings' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = teamReceiptOverrideSchema.parse(body)

    // Fetch association policy to validate override
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        associationTeam: {
          select: {
            association: {
              select: {
                id: true,
                name: true,
                receiptGlobalThresholdCents: true,
                allowedTeamThresholdOverride: true,
              },
            },
          },
        },
      },
    })

    if (!team?.associationTeam?.association) {
      return NextResponse.json(
        { error: 'Team is not associated with an association' },
        { status: 400 }
      )
    }

    const association = team.associationTeam.association

    // Check if association allows team overrides
    if (!association.allowedTeamThresholdOverride) {
      return NextResponse.json(
        {
          error: `Association "${association.name}" does not allow teams to override receipt thresholds`,
        },
        { status: 403 }
      )
    }

    // Validate that team override is stricter (lower or equal) than association
    if (validatedData.receiptGlobalThresholdOverrideCents !== null) {
      const strictnessCheck = validateTeamOverrideStrictness(
        validatedData.receiptGlobalThresholdOverrideCents,
        association.receiptGlobalThresholdCents
      )

      if (!strictnessCheck.valid) {
        return NextResponse.json({ error: strictnessCheck.error }, { status: 400 })
      }
    }

    // Update or create team settings with receipt override
    const updatedSettings = await prisma.teamSettings.upsert({
      where: { teamId },
      update: {
        receiptGlobalThresholdOverrideCents: validatedData.receiptGlobalThresholdOverrideCents,
      },
      create: {
        teamId,
        receiptGlobalThresholdOverrideCents: validatedData.receiptGlobalThresholdOverrideCents,
        dualApprovalEnabled: true,
        dualApprovalThreshold: 200.0,
        receiptRequired: true,
        allowSelfReimbursement: false,
        duplicateDetectionEnabled: true,
        allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
        duplicateDetectionWindow: 7,
      },
      select: {
        id: true,
        teamId: true,
        receiptGlobalThresholdOverrideCents: true,
      },
    })

    return NextResponse.json({
      ...updatedSettings,
      association: {
        id: association.id,
        name: association.name,
        receiptGlobalThresholdCents: association.receiptGlobalThresholdCents,
      },
    })
  } catch (error) {
    console.error('Error updating team receipt override:', error)

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update team receipt override',
      },
      { status: 500 }
    )
  }
}
