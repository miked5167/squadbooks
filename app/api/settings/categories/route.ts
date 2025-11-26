/**
 * Categories API Route
 * GET: List all categories
 * POST: Create a new category
 * PUT: Update a category
 * DELETE: Archive a category (soft delete)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireTreasurer } from '@/lib/auth/permissions'
import { categorySchema, updateCategorySchema } from '@/lib/validations/settings'
import { z } from 'zod'

/**
 * GET /api/settings/categories
 * List all categories for the team (including inactive)
 */
export async function GET() {
  try {
    const user = await requireTreasurer()

    const categories = await prisma.category.findMany({
      where: { teamId: user.teamId },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        heading: true,
        color: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ categories })
  } catch (error: any) {
    console.error('GET /api/settings/categories error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch categories' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

/**
 * POST /api/settings/categories
 * Create a new category
 * Body: { name, heading, color, sortOrder, isActive? }
 */
export async function POST(request: Request) {
  try {
    const user = await requireTreasurer()
    const body = await request.json()

    // Validate input
    const data = categorySchema.parse(body)

    // Check if category with same name already exists in this team
    const existing = await prisma.category.findFirst({
      where: {
        teamId: user.teamId,
        name: data.name,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        teamId: user.teamId,
        name: data.name,
        heading: data.heading,
        color: data.color,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({
      message: 'Category created successfully',
      category,
    })
  } catch (error: any) {
    console.error('POST /api/settings/categories error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

/**
 * PUT /api/settings/categories
 * Update an existing category
 * Body: { id, name?, heading?, color?, sortOrder?, isActive? }
 */
export async function PUT(request: Request) {
  try {
    const user = await requireTreasurer()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Validate input
    const data = updateCategorySchema.parse(body)

    // Verify category exists and belongs to user's team
    const existing = await prisma.category.findUnique({
      where: { id: body.id },
      select: { id: true, teamId: true, name: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (existing.teamId !== user.teamId) {
      return NextResponse.json(
        { error: 'Cannot modify categories from another team' },
        { status: 403 }
      )
    }

    // Check if new name conflicts with existing category
    if (data.name && data.name !== existing.name) {
      const nameConflict = await prisma.category.findFirst({
        where: {
          teamId: user.teamId,
          name: data.name,
          id: { not: body.id },
        },
      })

      if (nameConflict) {
        return NextResponse.json(
          { error: 'A category with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update the category
    const category = await prisma.category.update({
      where: { id: body.id },
      data: {
        name: data.name,
        heading: data.heading,
        color: data.color,
        sortOrder: data.sortOrder,
        isActive: data.isActive,
      },
    })

    return NextResponse.json({
      message: 'Category updated successfully',
      category,
    })
  } catch (error: any) {
    console.error('PUT /api/settings/categories error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update category' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}

/**
 * DELETE /api/settings/categories
 * Archive a category (soft delete)
 * Body: { id }
 */
export async function DELETE(request: Request) {
  try {
    const user = await requireTreasurer()
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Verify category exists and belongs to user's team
    const existing = await prisma.category.findUnique({
      where: { id: body.id },
      select: { id: true, teamId: true, name: true, isActive: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    if (existing.teamId !== user.teamId) {
      return NextResponse.json(
        { error: 'Cannot delete categories from another team' },
        { status: 403 }
      )
    }

    // Check if category has any budget allocations or transactions
    const [allocations, transactions] = await Promise.all([
      prisma.budgetAllocation.count({
        where: { categoryId: body.id },
      }),
      prisma.transaction.count({
        where: {
          categoryId: body.id,
          deletedAt: null,
        },
      }),
    ])

    if (allocations > 0 || transactions > 0) {
      // Cannot delete category with data - archive it instead
      const archived = await prisma.category.update({
        where: { id: body.id },
        data: { isActive: false },
      })

      return NextResponse.json({
        message: 'Category archived successfully (has existing data)',
        category: archived,
      })
    }

    // No data - safe to hard delete
    await prisma.category.delete({
      where: { id: body.id },
    })

    return NextResponse.json({
      message: 'Category deleted successfully',
    })
  } catch (error: any) {
    console.error('DELETE /api/settings/categories error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to delete category' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
