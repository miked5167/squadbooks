import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

const ExceptionRequestSchema = z.object({
  teamId: z.string(),
  requestedDeltaCents: z.number().int().positive(),
  reason: z.string().min(10),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { associationId } = await params
    const body = await req.json()

    // Validate input
    const validationResult = ExceptionRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validationResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { teamId, requestedDeltaCents, reason } = validationResult.data

    // Verify user has access to this team
    const teamUser = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
        teamId,
        role: {
          in: ['TREASURER', 'ASSISTANT_TREASURER'],
        },
      },
    })

    if (!teamUser) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to request exceptions for this team' },
        { status: 403 }
      )
    }

    // Get active coach compensation policy
    const rule = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
        isActive: true,
      },
    })

    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'No active coach compensation policy found' },
        { status: 404 }
      )
    }

    // Check if exception already exists
    const existing = await prisma.teamRuleOverride.findFirst({
      where: {
        teamId,
        ruleId: rule.id,
        isActive: true,
      },
    })

    if (existing) {
      // Update existing exception request
      const config = existing.overrideConfig as any

      const updatedConfig = {
        ...config,
        requestedDeltaCents,
        status: 'PENDING',
        previousStatus: config.status,
        resubmittedAt: new Date().toISOString(),
      }

      const updated = await prisma.teamRuleOverride.update({
        where: { id: existing.id },
        data: {
          overrideReason: reason,
          overrideConfig: updatedConfig as any,
          approvedBy: null,
          approvedAt: null,
        },
      })

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          associationId,
          actorUserId: teamUser.id,
          action: 'RESUBMIT_COACH_COMP_EXCEPTION',
          entityType: 'TeamRuleOverride',
          entityId: updated.id,
          metadata: {
            teamId,
            requestedDeltaCents,
            previousStatus: config.status,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Exception request updated successfully',
      })
    }

    // Create new exception request
    const exception = await prisma.teamRuleOverride.create({
      data: {
        teamId,
        ruleId: rule.id,
        overrideReason: reason,
        overrideConfig: {
          requestedDeltaCents,
          status: 'PENDING',
        } as any,
      },
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: teamUser.id,
        action: 'REQUEST_COACH_COMP_EXCEPTION',
        entityType: 'TeamRuleOverride',
        entityId: exception.id,
        metadata: {
          teamId,
          requestedDeltaCents,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: exception,
      message: 'Exception request submitted successfully',
    })
  } catch (error) {
    console.error('Error processing exception request:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
