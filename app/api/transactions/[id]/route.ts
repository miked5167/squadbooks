import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { UpdateTransactionSchema } from '@/lib/validations/transaction'
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/db/transactions'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/transactions/[id]
 * Fetch a single transaction for editing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.teamId) {
      return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
    }

    // Check role - only TREASURER and ASSISTANT_TREASURER can edit transactions
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can edit transactions' },
        { status: 403 }
      )
    }

    // Fetch transaction and verify it belongs to user's team
    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        teamId: user.teamId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            heading: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check if transaction can be edited based on lifecycle state
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        season: true,
        associationTeam: {
          select: {
            associationId: true,
          },
        },
      },
    })

    if (team?.season && team.associationTeam?.associationId) {
      const teamSeason = await prisma.teamSeason.findUnique({
        where: {
          teamId_seasonLabel: {
            teamId: user.teamId,
            seasonLabel: team.season,
          },
        },
      })

      // Check if edits are allowed in current state
      if (teamSeason) {
        const { areTransactionsAllowed } = await import('@/lib/services/team-season-lifecycle')

        if (!areTransactionsAllowed(teamSeason.state)) {
          const stateMessages: Record<string, string> = {
            SETUP: 'Team season is in setup. Complete team setup before editing transactions.',
            BUDGET_DRAFT: 'Budget is still in draft. Submit budget for review before editing transactions.',
            BUDGET_REVIEW: 'Budget is under review. Wait for budget approval before editing transactions.',
            TEAM_APPROVED: 'Budget is approved but not yet presented to parents.',
            PRESENTED: 'Waiting for parent approvals.',
            ARCHIVED: 'Season is archived. Transactions cannot be edited for archived seasons.',
          }

          const message =
            stateMessages[teamSeason.state] ||
            `Transactions cannot be edited in current season state: ${teamSeason.state}`

          return NextResponse.json(
            {
              error: 'Edit not allowed',
              message,
              currentState: teamSeason.state,
            },
            { status: 403 }
          )
        }
      }
    }

    // Return transaction data wrapped for consistency with edit forms
    return NextResponse.json({
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        categoryId: transaction.categoryId,
        vendor: transaction.vendor,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
        receiptUrl: transaction.receiptUrl,
        status: transaction.status,
        category: transaction.category,
        creator: transaction.creator,
        approvals: transaction.approvals,
        validation_json: transaction.validation_json,
      },
    })
  } catch (error) {
    logger.error('GET /api/transactions/[id] error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update an existing transaction and re-validate
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.teamId) {
      return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
    }

    // Check role - only TREASURER and ASSISTANT_TREASURER can edit transactions
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can edit transactions' },
        { status: 403 }
      )
    }

    // Fetch existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        teamId: user.teamId,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Check lifecycle state - only allow edits in LOCKED, ACTIVE, or CLOSEOUT states
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        season: true,
        associationTeam: {
          select: {
            associationId: true,
          },
        },
      },
    })

    if (team?.season && team.associationTeam?.associationId) {
      const teamSeason = await prisma.teamSeason.findUnique({
        where: {
          teamId_seasonLabel: {
            teamId: user.teamId,
            seasonLabel: team.season,
          },
        },
      })

      if (teamSeason) {
        const { areTransactionsAllowed } = await import('@/lib/services/team-season-lifecycle')

        if (!areTransactionsAllowed(teamSeason.state)) {
          const stateMessages: Record<string, string> = {
            SETUP: 'Team season is in setup. Complete team setup before editing transactions.',
            BUDGET_DRAFT: 'Budget is still in draft. Submit budget for review before editing transactions.',
            BUDGET_REVIEW: 'Budget is under review. Wait for budget approval before editing transactions.',
            TEAM_APPROVED: 'Budget is approved but not yet presented to parents.',
            PRESENTED: 'Waiting for parent approvals.',
            ARCHIVED: 'Season is archived. Transactions cannot be edited for archived seasons.',
          }

          const message =
            stateMessages[teamSeason.state] ||
            `Transactions cannot be edited in current season state: ${teamSeason.state}`

          return NextResponse.json(
            {
              error: 'Edit not allowed',
              message,
              currentState: teamSeason.state,
            },
            { status: 403 }
          )
        }
      }
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateTransactionSchema.parse(body)

    // If updating category, verify it belongs to team
    if (validatedData.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: validatedData.categoryId,
          teamId: user.teamId,
        },
      })

      if (!category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
    }

    // Update transaction - this function handles validation automatically
    const updatedTransaction = await updateTransaction(id, user.teamId, user.id, validatedData)

    return NextResponse.json(
      {
        message: 'Transaction updated successfully',
        transaction: {
          id: updatedTransaction.id,
          type: updatedTransaction.type,
          amount: Number(updatedTransaction.amount),
          vendor: updatedTransaction.vendor,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('PATCH /api/transactions/[id] error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/transactions/[id]
 * Soft delete a transaction
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const { id } = await params

    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check role - only TREASURER can delete transactions
    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can delete transactions' },
        { status: 403 }
      )
    }

    // Delete transaction
    await deleteTransaction(id, user.teamId, user.id)

    return NextResponse.json(
      { message: 'Transaction deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    logger.error('DELETE /api/transactions/[id] error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
