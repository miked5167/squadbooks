import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/categories
 * Get all categories for the user's team
 */
export async function GET() {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get categories for team
    const categories = await prisma.category.findMany({
      where: { teamId: user.teamId },
      orderBy: [
        { heading: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('GET /api/categories error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
