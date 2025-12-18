import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { requireAssociationAdmin } from '@/lib/auth/permissions'
import { prisma } from '@/lib/prisma'
import { associationReceiptPolicySchema } from '@/lib/validations/receipt-policy'
import { z } from 'zod'

/**
 * GET /api/association/[associationId]/receipt-policy
 * Get receipt policy for an association
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { associationId } = await params

    // Verify user is association admin
    await requireAssociationAdmin(associationId)

    // Fetch association receipt policy
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        receiptsEnabled: true,
        receiptGlobalThresholdCents: true,
        receiptGracePeriodDays: true,
        receiptCategoryThresholdsEnabled: true,
        receiptCategoryOverrides: true,
        allowedTeamThresholdOverride: true,
      },
    })

    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 })
    }

    return NextResponse.json(association)
  } catch (error) {
    console.error('Error fetching receipt policy:', error)

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch receipt policy',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/association/[associationId]/receipt-policy
 * Update receipt policy for an association
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { associationId } = await params

    // Verify user is association admin
    await requireAssociationAdmin(associationId)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = associationReceiptPolicySchema.parse(body)

    // Additional business rule validation: Ensure category overrides are valid
    if (validatedData.receiptCategoryThresholdsEnabled) {
      // Validate that all category IDs in overrides exist in the association
      const categoryIds = Object.keys(validatedData.receiptCategoryOverrides)

      if (categoryIds.length > 0) {
        const categories = await prisma.category.findMany({
          where: {
            id: { in: categoryIds },
            associationId,
          },
          select: { id: true },
        })

        const validCategoryIds = new Set(categories.map(c => c.id))
        const invalidCategoryIds = categoryIds.filter(id => !validCategoryIds.has(id))

        if (invalidCategoryIds.length > 0) {
          return NextResponse.json(
            {
              error: 'Invalid category IDs in overrides',
              invalidIds: invalidCategoryIds,
            },
            { status: 400 }
          )
        }
      }
    }

    // Update association with new receipt policy
    const updatedAssociation = await prisma.association.update({
      where: { id: associationId },
      data: {
        receiptsEnabled: validatedData.receiptsEnabled,
        receiptGlobalThresholdCents: validatedData.receiptGlobalThresholdCents,
        receiptGracePeriodDays: validatedData.receiptGracePeriodDays,
        receiptCategoryThresholdsEnabled: validatedData.receiptCategoryThresholdsEnabled,
        receiptCategoryOverrides: validatedData.receiptCategoryOverrides,
        allowedTeamThresholdOverride: validatedData.allowedTeamThresholdOverride,
      },
      select: {
        id: true,
        name: true,
        receiptsEnabled: true,
        receiptGlobalThresholdCents: true,
        receiptGracePeriodDays: true,
        receiptCategoryThresholdsEnabled: true,
        receiptCategoryOverrides: true,
        allowedTeamThresholdOverride: true,
      },
    })

    return NextResponse.json(updatedAssociation)
  } catch (error) {
    console.error('Error updating receipt policy:', error)

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update receipt policy',
      },
      { status: 500 }
    )
  }
}
