/**
 * Settings API Route
 * GET: Fetch team profile and settings
 * PUT: Update team profile and settings
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireTreasurer } from '@/lib/auth/permissions'
import { teamProfileSchema, teamSettingsSchema } from '@/lib/validations/settings'
import { z } from 'zod'

/**
 * GET /api/settings
 * Fetch team profile and settings for the current user's team
 */
export async function GET() {
  try {
    const user = await requireTreasurer()

    // Fetch team with profile data
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        name: true,
        teamType: true,
        ageDivision: true,
        competitiveLevel: true,
        level: true,
        season: true,
        budgetTotal: true,
        logoUrl: true,
        associationName: true,
        seasonStartDate: true,
        seasonEndDate: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Fetch or create team settings
    let settings = await prisma.teamSettings.findUnique({
      where: { teamId: user.teamId },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.teamSettings.create({
        data: {
          teamId: user.teamId,
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

    return NextResponse.json({
      team,
      settings,
    })
  } catch (error: any) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update team profile and settings
 * Body: { team?: TeamProfileInput, settings?: TeamSettingsInput }
 */
export async function PUT(request: Request) {
  try {
    const user = await requireTreasurer()
    const body = await request.json()

    // Validate inputs
    const updateData: {
      team?: z.infer<typeof teamProfileSchema>
      settings?: z.infer<typeof teamSettingsSchema>
    } = {}

    if (body.team) {
      updateData.team = teamProfileSchema.parse(body.team)
    }

    if (body.settings) {
      updateData.settings = teamSettingsSchema.parse(body.settings)

      // Enforce fraud prevention rules
      // Dual approval cannot be disabled
      if (updateData.settings.dualApprovalEnabled === false) {
        return NextResponse.json(
          { error: 'Dual approval cannot be disabled for fraud prevention' },
          { status: 400 }
        )
      }

      // Receipt requirement cannot be disabled
      if (updateData.settings.receiptRequired === false) {
        return NextResponse.json(
          { error: 'Receipt requirement cannot be disabled for fraud prevention' },
          { status: 400 }
        )
      }
    }

    // Update team profile if provided
    if (updateData.team) {
      await prisma.team.update({
        where: { id: user.teamId },
        data: {
          name: updateData.team.name,
          teamType: updateData.team.teamType,
          ageDivision: updateData.team.ageDivision,
          competitiveLevel: updateData.team.competitiveLevel,
          level: updateData.team.level,
          season: updateData.team.season,
          logoUrl: updateData.team.logoUrl,
          associationName: updateData.team.associationName,
          seasonStartDate: updateData.team.seasonStartDate
            ? new Date(updateData.team.seasonStartDate)
            : null,
          seasonEndDate: updateData.team.seasonEndDate
            ? new Date(updateData.team.seasonEndDate)
            : null,
          contactName: updateData.team.contactName,
          contactEmail: updateData.team.contactEmail,
          contactPhone: updateData.team.contactPhone,
        },
      })
    }

    // Update team settings if provided
    if (updateData.settings) {
      await prisma.teamSettings.upsert({
        where: { teamId: user.teamId },
        create: {
          teamId: user.teamId,
          ...updateData.settings,
        },
        update: updateData.settings,
      })
    }

    // Fetch updated data
    const updatedTeam = await prisma.team.findUnique({
      where: { id: user.teamId },
    })

    const updatedSettings = await prisma.teamSettings.findUnique({
      where: { teamId: user.teamId },
    })

    return NextResponse.json({
      team: updatedTeam,
      settings: updatedSettings,
    })
  } catch (error: any) {
    console.error('PUT /api/settings error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
