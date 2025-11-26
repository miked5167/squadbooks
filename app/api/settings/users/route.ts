/**
 * Users API Route
 * GET: List all users in the team
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTreasurerOnly } from '@/lib/auth/permissions'

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
    console.error('GET /api/settings/users error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
