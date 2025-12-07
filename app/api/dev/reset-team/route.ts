import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * POST /api/dev/reset-team
 * Reset a team to "Day 1" state by clearing all financial data
 * Keeps: Team structure, Players, Families, Categories, Users
 * Clears: Transactions, Approvals, Alerts, Snapshots, resets budget to 0
 * Protected by DEV_MODE check - only works in development
 */
export async function POST(request: NextRequest) {
  try {
    // Check if dev mode is enabled
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Dev mode not enabled' },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId required in request body' },
        { status: 400 }
      )
    }

    // Verify team exists and user has access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, name: true },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Clear all financial data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete transactions
      const deletedTransactions = await tx.transaction.deleteMany({
        where: { teamId },
      })

      // Delete approvals
      const deletedApprovals = await tx.approval.deleteMany({
        where: { teamId },
      })

      // Delete alerts
      const deletedAlerts = await tx.alert.deleteMany({
        where: { teamId },
      })

      // Delete team financial snapshots (if association is monitoring)
      const deletedSnapshots = await tx.teamFinancialSnapshot.deleteMany({
        where: {
          associationTeam: {
            teamId,
          },
        },
      })

      // Reset budget categories to 0
      const updatedCategories = await tx.budgetCategory.updateMany({
        where: { teamId },
        data: {
          budgeted: 0,
          spent: 0,
        },
      })

      // Reset dashboard config thresholds
      await tx.dashboardConfig.updateMany({
        where: { teamId },
        data: {
          budgetWarningThreshold: 0.8,
          budgetCriticalThreshold: 0.95,
          approvalWarningThreshold: 5,
          approvalCriticalThreshold: 10,
        },
      })

      return {
        transactions: deletedTransactions.count,
        approvals: deletedApprovals.count,
        alerts: deletedAlerts.count,
        snapshots: deletedSnapshots.count,
        categoriesReset: updatedCategories.count,
      }
    })

    logger.info(
      `[DEV MODE] Reset team ${teamId} (${team.name}): ${JSON.stringify(result)} by user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        teamId,
        teamName: team.name,
        cleared: result,
        message: `Team reset to Day 1 state - ready for new treasurer demo`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('POST /api/dev/reset-team error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
