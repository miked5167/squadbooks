import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Dev Mode: Reset Association
 *
 * Deletes an association and all related data to allow re-onboarding
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
    const associationId = searchParams.get('associationId')

    if (!associationId) {
      return NextResponse.json(
        { error: 'Association ID is required' },
        { status: 400 }
      )
    }

    // Verify association exists
    const association = await prisma.association.findUnique({
      where: { id: associationId },
    })

    if (!association) {
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      )
    }

    // Delete association and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete dashboard config
      await tx.dashboardConfig.deleteMany({
        where: { associationId },
      })

      // Delete association users (but keep the Clerk users)
      await tx.associationUser.deleteMany({
        where: { associationId },
      })

      // Delete association teams (cascade will handle team users, etc.)
      await tx.associationTeam.deleteMany({
        where: { associationId },
      })

      // Delete association rules
      await tx.associationRule.deleteMany({
        where: { associationId },
      })

      // Delete alerts
      await tx.alert.deleteMany({
        where: { associationId },
      })

      // Delete pre-season budgets
      await tx.preSeasonBudget.deleteMany({
        where: { associationId },
      })

      // Finally, delete the association itself
      await tx.association.delete({
        where: { id: associationId },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Association reset successfully. Redirecting to onboarding...',
    })
  } catch (error) {
    console.error('Reset association error:', error)
    return NextResponse.json(
      { error: 'Failed to reset association' },
      { status: 500 }
    )
  }
}
