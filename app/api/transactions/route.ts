import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { CreateTransactionSchema, TransactionFilterSchema } from '@/lib/validations/transaction'
import { createTransaction, getTransactions } from '@/lib/db/transactions'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * GET /api/transactions
 * Get list of transactions with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      perPage: parseInt(searchParams.get('perPage') || '50'),
      sortBy: (searchParams.get('sortBy') || 'date') as 'date' | 'amount' | 'vendor',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
    }

    // Validate filters
    const validatedFilters = TransactionFilterSchema.parse(filters)

    // Get transactions
    const result = await getTransactions(user.teamId, validatedFilters)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    logger.error('GET /api/transactions error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
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

    // Check role - only TREASURER can create transactions
    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can create transactions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateTransactionSchema.parse(body)

    // Verify category belongs to team
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        teamId: user.teamId,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Create transaction
    const result = await createTransaction(validatedData, user.teamId, user.id)

    return NextResponse.json(
      {
        ...result,
        message: result.approvalRequired
          ? 'Transaction created. Approval required from president.'
          : 'Transaction created successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/transactions error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
