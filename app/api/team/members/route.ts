/**
 * API route for fetching team members
 * GET /api/team/members
 */

import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user and their team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User not found or not in a team' }, { status: 404 })
    }

    // Fetch all team members
    const members = await prisma.user.findMany({
      where: {
        teamId: user.teamId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}
