import { auth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/logger'
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { getFinancialSummary } from '@/lib/db/financial-summary'
import { logger } from '@/lib/logger'

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
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get financial summary
    const summary = await getFinancialSummary(user.teamId)

    return NextResponse.json(summary)
  } catch (error) {
    logger.error('Failed to fetch financial summary', error as Error)

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to fetch financial summary' }, { status: 500 })
  }
}
