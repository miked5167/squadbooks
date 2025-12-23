import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/exceptions
 * Fetch all transactions with validation status for the exceptions inbox
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch transactions with validation status
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        deletedAt: null,
        // Include transactions with any status - filter on client
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            heading: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: [
        // Exceptions first, then by date
        { status: 'desc' },
        { transactionDate: 'desc' },
      ],
    })

    // Transform to include parsed validation JSON
    // Note: Prisma returns validation_json (snake_case) from DB, we need to map to validationJson (camelCase)
    const transformedTransactions = transactions.map((txn) => {
      // @ts-expect-error - Prisma returns snake_case field names
      const validationData = txn.validation_json || txn.validationJson

      return {
        ...txn,
        amount: Number(txn.amount),
        validationJson: validationData ? JSON.parse(JSON.stringify(validationData)) : null,
      }
    })

    return NextResponse.json({
      transactions: transformedTransactions,
    })
  } catch (error) {
    logger.error('GET /api/exceptions error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
