/**
 * Users API Route
 * GET: List all users in the team
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireTreasurerOnly } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'

/**
 * GET /api/settings/users
 * List all users in the team with their roles and status
 */
export async function GET() {
  try {
    const user = await requireTreasurerOnly()

    const users = await prisma.user.findMany({
      where: { teamId: user.teamId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { isActive: 'desc' }, // Active users first
        { role: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ users })
  } catch (error: any) {
    logger.error('GET /api/settings/users error', error as Error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
