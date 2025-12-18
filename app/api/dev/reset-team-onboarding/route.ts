import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Dev Mode: Reset Team for Onboarding
 *
 * Deletes a team and all related data to allow re-onboarding through the setup wizard
 */
export async function DELETE(request: Request) {
  console.log('[DEV-TRACE-001] Reset team onboarding: DELETE handler invoked')
  console.log('[DEV-TRACE-002] Request URL:', request.url)
  console.log('[DEV-TRACE-003] Dev mode env var:', process.env.NEXT_PUBLIC_DEV_MODE)

  // Only allow in dev mode
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    console.log('[DEV-TRACE-004] Reset team onboarding: Dev mode not enabled - REJECTED')
    return NextResponse.json(
      { error: 'ERROR-001: Not available in production' },
      { status: 403 }
    )
  }

  console.log('[DEV-TRACE-005] Dev mode check passed')

  try {
    console.log('[DEV-TRACE-006] Entering try block')
    const { searchParams } = new URL(request.url)
    console.log('[DEV-TRACE-007] URL parsed successfully')
    const teamId = searchParams.get('teamId')
    console.log('[DEV-TRACE-008] Reset team onboarding: Received request for teamId:', teamId)

    if (!teamId) {
      console.log('[DEV-TRACE-009] Reset team onboarding: Missing teamId - REJECTED')
      return NextResponse.json(
        { error: 'ERROR-002: Team ID is required' },
        { status: 400 }
      )
    }

    console.log('[DEV-TRACE-010] TeamId validation passed')

    // Verify team exists
    console.log('[DEV-TRACE-011] Looking up team in database...')
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    })

    console.log('[DEV-TRACE-012] Reset team onboarding: Team lookup result:', team)

    if (!team) {
      console.log('[DEV-TRACE-013] Reset team onboarding: Team not found - REJECTED')
      return NextResponse.json(
        { error: 'ERROR-003: Team not found' },
        { status: 404 }
      )
    }

    console.log('[DEV-TRACE-014] Team found:', team.name)
    console.log('[DEV-TRACE-015] Starting deletion transaction for team:', team.name)

    // Delete team and all related data in a transaction
    console.log('[DEV-TRACE-016] Entering transaction')
    await prisma.$transaction(async (tx) => {
      // First, handle PreSeasonBudget activatedTeamId reference
      // This doesn't have onDelete cascade, so we need to manually set it to null
      console.log('[DEV-TRACE-017] Updating PreSeasonBudget.activatedTeamId to null')
      await tx.preSeasonBudget.updateMany({
        where: { activatedTeamId: teamId },
        data: { activatedTeamId: null },
      })
      console.log('[DEV-TRACE-018] PreSeasonBudget updated')

      // Delete transactions first (before budget/envelopes)
      // Transactions reference BudgetEnvelope, and envelopes cascade from Budget deletion
      // If we delete Budget first, it tries to cascade to envelopes, but transactions block it
      await tx.transaction.deleteMany({
        where: { teamId },
      })

      // Delete budget-related items (new budget system)
      // Deleting budgets will cascade to versions, allocations, envelopes
      await tx.budget.deleteMany({
        where: { teamId },
      })

      // Delete legacy budget allocations
      await tx.budgetAllocation.deleteMany({
        where: { teamId },
      })

      // Delete parent invite tokens
      await tx.parentInviteToken.deleteMany({
        where: { teamId },
      })

      // Delete players (will cascade if needed)
      await tx.player.deleteMany({
        where: { teamId },
      })

      // Delete families
      await tx.family.deleteMany({
        where: { teamId },
      })

      // Delete pre-season allocations (must delete before categories due to FK constraint)
      // First, get all category IDs for this team
      const teamCategories = await tx.category.findMany({
        where: { teamId },
        select: { id: true },
      })
      const categoryIds = teamCategories.map(cat => cat.id)

      // Delete pre-season allocations that reference these categories
      if (categoryIds.length > 0) {
        await tx.preSeasonAllocation.deleteMany({
          where: {
            categoryId: {
              in: categoryIds,
            },
          },
        })
      }

      // Delete categories
      await tx.category.deleteMany({
        where: { teamId },
      })

      // Delete invitations
      await tx.invitation.deleteMany({
        where: { teamId },
      })

      // Delete team settings
      await tx.teamSettings.deleteMany({
        where: { teamId },
      })

      // Delete notification settings for this team
      await tx.notificationSettings.deleteMany({
        where: { teamId },
      })

      // Delete bank connections
      await tx.bankConnection.deleteMany({
        where: { teamId },
      })

      // Delete budget approvals
      await tx.budgetApproval.deleteMany({
        where: { teamId },
      })

      // Note: BudgetEnvelopes are cascade deleted when Budget is deleted

      // Delete alerts and snapshots (they're linked to associationTeamId, not teamId)
      // First find the association team for this team
      const associationTeam = await tx.associationTeam.findFirst({
        where: { teamId },
        select: { id: true },
      })

      // Delete alerts if association team exists
      if (associationTeam) {
        await tx.alert.deleteMany({
          where: { associationTeamId: associationTeam.id },
        })

        // Delete team financial snapshots
        await tx.teamFinancialSnapshot.deleteMany({
          where: { associationTeamId: associationTeam.id },
        })
      }

      // Note: Reports are association-level, not team-level, so we don't delete them here

      // Delete rule violations
      await tx.ruleViolation.deleteMany({
        where: { teamId },
      })

      // Delete season closures
      await tx.seasonClosure.deleteMany({
        where: { teamId },
      })

      // Delete team signing authorities
      await tx.teamSigningAuthority.deleteMany({
        where: { teamId },
      })

      // Delete exports
      await tx.export.deleteMany({
        where: { teamId },
      })

      // Delete audit logs
      await tx.auditLog.deleteMany({
        where: { teamId },
      })

      // Delete approvals (must be before users since approvals reference users)
      await tx.approval.deleteMany({
        where: { teamId },
      })

      // Delete users for this team
      await tx.user.deleteMany({
        where: { teamId },
      })

      // Delete association team link (if exists)
      await tx.associationTeam.deleteMany({
        where: { teamId },
      })

      // Finally, delete the team itself
      await tx.team.delete({
        where: { id: teamId },
      })
    })

    console.log('[DEV-TRACE-099] Transaction completed successfully')
    console.log('[DEV] Reset team onboarding: Successfully deleted team and all related data')

    return NextResponse.json({
      success: true,
      message: 'Team reset successfully. Redirecting to onboarding...',
    })
  } catch (error) {
    console.error('═══════════════════════════════════════════════════')
    console.error('[DEV-ERROR] RESET TEAM ONBOARDING FAILED')
    console.error('═══════════════════════════════════════════════════')
    console.error('[DEV-ERROR] Error object:', error)
    console.error('[DEV-ERROR] Error type:', error instanceof Error ? 'Error instance' : typeof error)
    console.error('[DEV-ERROR] Error name:', error instanceof Error ? error.name : 'N/A')
    console.error('[DEV-ERROR] Error message:', error instanceof Error ? error.message : String(error))
    console.error('[DEV-ERROR] Error stack:', error instanceof Error ? error.stack : 'N/A')
    console.error('═══════════════════════════════════════════════════')
    return NextResponse.json(
      {
        error: 'ERROR-999: Failed to reset team for onboarding',
        details: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.name : typeof error,
      },
      { status: 500 }
    )
  }
}
