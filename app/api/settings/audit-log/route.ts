/**
 * Audit Log API Route
 * GET: Fetch audit log entries with filters
 *
 * NOTE: This endpoint requires the AuditLog model to be added to the Prisma schema.
 * The model should include: id, teamId, userId, action, entityType, entityId,
 * changes (JSON), ipAddress, userAgent, createdAt
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { requireAuditor } from '@/lib/auth/permissions'
import { auditLogFilterSchema } from '@/lib/validations/settings'
import { z } from 'zod'

/**
 * GET /api/settings/audit-log
 * Fetch audit log entries with optional filters
 * Query params: startDate?, endDate?, userId?, action?, limit?, offset?
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuditor()
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const filters = auditLogFilterSchema.parse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      userId: searchParams.get('userId') || undefined,
      action: searchParams.get('action') || undefined,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 50,
      offset: searchParams.get('offset')
        ? parseInt(searchParams.get('offset')!)
        : 0,
    })

    const where: any = {
      teamId: user.teamId,
    }

    if (filters.startDate) {
      where.createdAt = {
        ...where.createdAt,
        gte: new Date(filters.startDate),
      }
    }

    if (filters.endDate) {
      where.createdAt = {
        ...where.createdAt,
        lte: new Date(filters.endDate),
      }
    }

    if (filters.userId) {
      where.userId = filters.userId
    }

    if (filters.action) {
      where.action = filters.action
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset,
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      logs,
      total,
      limit: filters.limit,
      offset: filters.offset,
    })
  } catch (error: any) {
    logger.error('GET /api/settings/audit-log error', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch audit log' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
