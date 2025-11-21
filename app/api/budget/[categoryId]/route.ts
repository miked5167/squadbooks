import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createOrUpdateBudgetAllocation, deleteBudgetAllocation } from '@/lib/db/budget'

/**
 * PUT /api/budget/[categoryId]
 * Create or update budget allocation for a category
 * Body: { allocated: number, season?: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        teamId: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only TREASURER and ASSISTANT_TREASURER can manage budgets
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can manage budgets' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { categoryId } = resolvedParams

    // Parse request body
    const body = await request.json()
    const { allocated, season } = body

    if (typeof allocated !== 'number' || allocated < 0) {
      return NextResponse.json(
        { error: 'Invalid allocated amount' },
        { status: 400 }
      )
    }

    // Verify category belongs to user's team
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        teamId: user.teamId,
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Create or update budget allocation
    const budgetAllocation = await createOrUpdateBudgetAllocation(
      user.teamId,
      categoryId,
      allocated,
      season
    )

    return NextResponse.json({
      message: 'Budget allocation updated successfully',
      budgetAllocation,
    })
  } catch (error) {
    console.error('Failed to update budget allocation:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update budget allocation' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/budget/[categoryId]
 * Delete budget allocation for a category
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        teamId: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only TREASURER and ASSISTANT_TREASURER can manage budgets
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can manage budgets' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { categoryId } = resolvedParams

    // Delete budget allocation
    await deleteBudgetAllocation(user.teamId, categoryId)

    return NextResponse.json({
      message: 'Budget allocation deleted successfully',
    })
  } catch (error) {
    console.error('Failed to delete budget allocation:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete budget allocation' },
      { status: 500 }
    )
  }
}
