import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { UpdateTransactionSchema } from '@/lib/validations/transaction'
import { getTransactionById, updateTransaction, deleteTransaction } from '@/lib/db/transactions'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/transactions/[id]
 * Fetch a single transaction (for viewing or editing)
 * - Association users can view transactions from any team in their association
 * - Team users (treasurers) can view/edit transactions from their own team
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authenticate user (supports both team users and association users)
    const { getCurrentUser, isAssociationUser } =
      await import('@/lib/permissions/server-permissions')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build transaction query based on user type
    let transactionQuery: any = { id }

    if (isAssociationUser(user)) {
      // Association users can view transactions from any team in their association
      if (!user.associationId) {
        return NextResponse.json({ error: 'Association user not linked to association' }, { status: 400 })
      }

      // Join through AssociationTeam to verify transaction belongs to a team in this association
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          team: {
            associationTeam: {
              associationId: user.associationId,
              isActive: true,
            },
          },
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
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      // Return transaction for association user (read-only access)
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
    }

    // Team user path - verify team membership
    if (!user.teamId) {
      return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
    }

    // All team members can view transactions (parents, treasurers, etc.)
    const canView = ['TREASURER', 'ASSISTANT_TREASURER', 'PARENT', 'MANAGER', 'COACH'].includes(user.role || '')
    if (!canView) {
      return NextResponse.json({ error: 'You do not have permission to view transactions' }, { status: 403 })
    }

    // Only treasurers can edit - but all team members can view
    const canEdit = user.role === 'TREASURER' || user.role === 'ASSISTANT_TREASURER'

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
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Determine if editing is allowed (only for treasurers, and only in certain lifecycle states)
    let editingAllowed = canEdit
    let editingMessage: string | null = null

    if (canEdit) {
      // Check lifecycle state for treasurers who might want to edit
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
            editingAllowed = false
            const stateMessages: Record<string, string> = {
              SETUP: 'Team season is in setup.',
              BUDGET_DRAFT: 'Budget is still in draft.',
              BUDGET_REVIEW: 'Budget is under review.',
              TEAM_APPROVED: 'Budget is approved but not yet presented.',
              PRESENTED: 'Waiting for parent approvals.',
              ARCHIVED: 'Season is archived.',
            }
            editingMessage = stateMessages[teamSeason.state] || `Current state: ${teamSeason.state}`
          }
        }
      }
    }

    // Return transaction data - all team members can view, editing permission included in response
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
      canEdit: editingAllowed,
      editingMessage,
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
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Authenticate user
    const { getCurrentUser, isAssociationUser } =
      await import('@/lib/permissions/server-permissions')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Defense-in-depth: Explicitly reject association users (read-only access)
    if (isAssociationUser(user)) {
      return NextResponse.json(
        { error: 'Association users have read-only access to team data' },
        { status: 403 }
      )
    }

    if (!user.teamId) {
      return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
    }

    // Check role - only TREASURER and ASSISTANT_TREASURER can edit transactions
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json({ error: 'Only treasurers can edit transactions' }, { status: 403 })
    }

    // Fetch existing transaction
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        teamId: user.teamId,
      },
    })

    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
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
            BUDGET_DRAFT:
              'Budget is still in draft. Submit budget for review before editing transactions.',
            BUDGET_REVIEW:
              'Budget is under review. Wait for budget approval before editing transactions.',
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
    const { getCurrentUser, isAssociationUser } =
      await import('@/lib/permissions/server-permissions')
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Defense-in-depth: Explicitly reject association users (read-only access)
    if (isAssociationUser(user)) {
      return NextResponse.json(
        { error: 'Association users have read-only access to team data' },
        { status: 403 }
      )
    }

    if (!user.teamId) {
      return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
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

    return NextResponse.json({ message: 'Transaction deleted successfully' }, { status: 200 })
  } catch (error) {
    logger.error('DELETE /api/transactions/[id] error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
