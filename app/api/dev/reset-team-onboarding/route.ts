import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Dev Mode: Reset Team for Onboarding
 *
 * Deletes a team and all related data to allow re-onboarding through the setup wizard
 */
export async function DELETE(request: Request) {
  // Only allow in dev mode
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      )
    }

    // Verify team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      )
    }

    // Delete team and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete budget allocations
      await tx.budgetAllocation.deleteMany({
        where: { teamId },
      })

      // Delete transactions (will cascade to approvals)
      await tx.transaction.deleteMany({
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

      // Delete users for this team
      await tx.user.deleteMany({
        where: { teamId },
      })

      // Finally, delete the team itself
      await tx.team.delete({
        where: { id: teamId },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Team reset successfully. Redirecting to onboarding...',
    })
  } catch (error) {
    console.error('Reset team onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to reset team for onboarding' },
      { status: 500 }
    )
  }
}
