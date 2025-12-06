import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPendingApprovals, getAllApprovals } from '@/lib/db/approvals'
import { logger } from '@/lib/logger'

/**
 * GET /api/approvals
 * Fetch approvals for the current user
 * Query params:
 * - status: 'pending' | 'all' (default: 'pending')
 */
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') || 'pending'

    let approvals

    if (statusParam === 'all') {
      // Get all approvals for the team (admin/auditor view)
      approvals = await getAllApprovals(user.teamId)
    } else {
      // Get pending approvals for this specific approver
      approvals = await getPendingApprovals(user.teamId, user.id)
    }

    return NextResponse.json({ approvals })
  } catch (error) {
    logger.error('Failed to fetch approvals', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}
