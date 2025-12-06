import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logger } from '@/lib/logger'

/**
 * GET /api/categories
 * Get all categories for the user's team
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get categories for team
    const categories = await prisma.category.findMany({
      where: { teamId: user.teamId },
      orderBy: [
        { heading: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    logger.error('GET /api/categories error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  heading: z.string().min(1, 'Heading is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format'),
  type: z.enum(['EXPENSE', 'INCOME']).default('EXPENSE'),
})

/**
 * POST /api/categories
 * Create a new custom category
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
      select: { teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only treasurers can create categories
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can create categories' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateCategorySchema.parse(body)

    // Check if category name already exists for this team
    const existingCategory = await prisma.category.findFirst({
      where: {
        teamId: user.teamId,
        name: validatedData.name,
      },
    })

    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name already exists' },
        { status: 400 }
      )
    }

    // Get max sortOrder for this heading
    const maxSortOrder = await prisma.category.findFirst({
      where: {
        teamId: user.teamId,
        heading: validatedData.heading,
      },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const sortOrder = (maxSortOrder?.sortOrder || 0) + 1

    // Create category
    const category = await prisma.category.create({
      data: {
        teamId: user.teamId,
        name: validatedData.name,
        heading: validatedData.heading,
        color: validatedData.color,
        type: validatedData.type,
        sortOrder,
        isDefault: false, // Custom categories are not default
      },
    })

    return NextResponse.json(
      { category, message: 'Category created successfully' },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/categories error', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
