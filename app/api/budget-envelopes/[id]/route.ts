/**
 * Budget Envelope [ID] API
 *
 * Endpoints for managing a specific budget envelope
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma as db } from '@/lib/prisma'
import { hasPermission, Permission } from '@/lib/permissions/permissions'
import { PeriodType, VendorMatchType } from '@prisma/client'
import { z } from 'zod'

// Validation schema for updating envelopes
const updateEnvelopeSchema = z.object({
  vendorMatchType: z.nativeEnum(VendorMatchType).optional(),
  vendorMatch: z.string().max(255).optional().nullable(),
  capAmount: z.number().positive().max(100000).optional(),
  periodType: z.nativeEnum(PeriodType).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  maxSingleTransaction: z.number().positive().max(100000).optional().nullable(),
  isActive: z.boolean().optional(),
})

/**
 * PATCH /api/budget-envelopes/[id]
 * Update an existing envelope
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: envelopeId } = await params
    const body = await request.json()
    const validation = updateEnvelopeSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Get user and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only treasurers can update envelopes
    if (!hasPermission(user.role, Permission.EDIT_BUDGET)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get existing envelope
    const existingEnvelope = await db.budgetEnvelope.findUnique({
      where: { id: envelopeId },
      select: { id: true, teamId: true },
    })

    if (!existingEnvelope) {
      return NextResponse.json({ error: 'Envelope not found' }, { status: 404 })
    }

    if (existingEnvelope.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the envelope
    const envelope = await db.budgetEnvelope.update({
      where: { id: envelopeId },
      data: {
        ...(data.vendorMatchType !== undefined && { vendorMatchType: data.vendorMatchType }),
        ...(data.vendorMatch !== undefined && { vendorMatch: data.vendorMatch }),
        ...(data.capAmount !== undefined && { capAmount: data.capAmount }),
        ...(data.periodType !== undefined && { periodType: data.periodType }),
        ...(data.startDate !== undefined && {
          startDate: data.startDate ? new Date(data.startDate) : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.maxSingleTransaction !== undefined && {
          maxSingleTransaction: data.maxSingleTransaction,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isActive === false && {
          deactivatedAt: new Date(),
          deactivatedBy: user.id,
        }),
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
            email: true,
          },
        },
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        teamId: user.teamId,
        userId: user.id,
        action: 'UPDATE_BUDGET_ENVELOPE',
        entityType: 'BudgetEnvelope',
        entityId: envelope.id,
        newValues: data,
      },
    })

    return NextResponse.json({ envelope })
  } catch (error) {
    console.error('[BUDGET_ENVELOPE_PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/budget-envelopes/[id]
 * Deactivate an envelope (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: envelopeId } = await params

    // Get user and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only treasurers can delete envelopes
    if (!hasPermission(user.role, Permission.EDIT_BUDGET)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get existing envelope
    const existingEnvelope = await db.budgetEnvelope.findUnique({
      where: { id: envelopeId },
      select: { id: true, teamId: true, isActive: true },
    })

    if (!existingEnvelope) {
      return NextResponse.json({ error: 'Envelope not found' }, { status: 404 })
    }

    if (existingEnvelope.teamId !== user.teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Soft delete by deactivating
    const envelope = await db.budgetEnvelope.update({
      where: { id: envelopeId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        deactivatedBy: user.id,
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        teamId: user.teamId,
        userId: user.id,
        action: 'DELETE_BUDGET_ENVELOPE',
        entityType: 'BudgetEnvelope',
        entityId: envelope.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BUDGET_ENVELOPE_DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
