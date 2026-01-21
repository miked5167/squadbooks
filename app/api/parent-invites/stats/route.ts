import { logger } from '@/lib/logger'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getOnboardingStats } from '@/lib/parentInvites';
import { hasPermission } from '@/lib/auth/permissions';

/**
 * GET /api/parent-invites/stats
 * Get onboarding statistics for the user's team
 *
 * Response:
 * {
 *   total: number,
 *   notInvited: number,
 *   invited: number,
 *   completed: number,
 *   completionRate: string
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to view roster
    if (!hasPermission(user.role, 'view_roster')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to view onboarding statistics' },
        { status: 403 }
      );
    }

    // Get onboarding statistics
    const stats = await getOnboardingStats(user.teamId);

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('Error fetching onboarding statistics', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
