import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/**
 * Admin authentication helper
 * Verifies user is authenticated and has PRESIDENT or TREASURER role
 *
 * @param requireProduction - If false, only allows in development mode (default: true)
 * @returns User object if authorized, NextResponse error if not
 */
export async function authenticateAdmin(requireProduction: boolean = true) {
  // Check environment if this is a development-only endpoint
  if (!requireProduction && process.env.NODE_ENV === 'production') {
    return {
      error: NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      ),
    }
  }

  // Authenticate user
  const { userId } = await auth()
  if (!userId) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // Verify user has admin role (PRESIDENT or TREASURER)
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      clerkId: true,
      email: true,
      name: true,
      role: true,
      teamId: true,
    },
  })

  if (!user) {
    return {
      error: NextResponse.json({ error: 'User not found' }, { status: 404 }),
    }
  }

  if (user.role !== 'PRESIDENT' && user.role !== 'TREASURER') {
    return {
      error: NextResponse.json(
        { error: 'Only PRESIDENT or TREASURER can access admin endpoints' },
        { status: 403 }
      ),
    }
  }

  return { user }
}
