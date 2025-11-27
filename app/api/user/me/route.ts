/**
 * Current User API Route
 * GET: Fetch current authenticated user's data
 */

import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error: any) {
    console.error('GET /api/user/me error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
