/**
 * API Route: Category Variance Details
 *
 * GET /api/budget/category/[categoryId]/variance
 * Returns variance summary and top transactions for a category
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

// Status values that count toward spending
const COUNTED_STATUSES = ['APPROVED', 'VALIDATED', 'RESOLVED']

export async function GET(request: Request, { params }: { params: { categoryId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categoryId = params.categoryId

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        teamId: true,
        role: true,
      },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User not associated with a team' }, { status: 403 })
    }

    // Verify the category belongs to the user's team
    const allocation = await prisma.budgetAllocation.findFirst({
      where: {
        categoryId,
        teamId: user.teamId,
      },
    })

    if (!allocation) {
      return NextResponse.json({ error: 'Category not found or not accessible' }, { status: 404 })
    }

    // Get top 5 largest transactions for this category
    // Order by absolute amount (largest first), then by date (most recent first)
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        categoryId,
        type: 'EXPENSE',
        status: { in: COUNTED_STATUSES },
        deletedAt: null,
      },
      select: {
        id: true,
        transactionDate: true,
        vendor: true,
        amount: true,
        status: true,
        receipt: true,
      },
      orderBy: [
        { amount: 'desc' }, // Largest transactions first
        { transactionDate: 'desc' }, // Most recent first for ties
      ],
      take: 5,
    })

    // Format response
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      date: tx.transactionDate?.toISOString() || new Date().toISOString(),
      merchant: tx.vendor || 'Unknown Merchant',
      amount: Number(tx.amount),
      hasReceipt: !!tx.receipt,
      status: tx.status,
    }))

    return NextResponse.json({
      transactions: formattedTransactions,
    })
  } catch (error) {
    console.error('Error fetching variance details:', error)
    return NextResponse.json({ error: 'Failed to fetch variance details' }, { status: 500 })
  }
}
