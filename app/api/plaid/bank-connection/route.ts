import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

/**
 * Bank Connection Check API
 *
 * GET /api/plaid/bank-connection?teamId=xxx
 * Returns whether the team has an active bank connection
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing teamId parameter' },
        { status: 400 }
      );
    }

    // Verify user belongs to this team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if team has an active bank connection
    const bankConnection = await prisma.bankConnection.findFirst({
      where: {
        teamId,
        isActive: true,
      },
    });

    return NextResponse.json({
      hasConnection: !!bankConnection,
      institutionName: bankConnection?.institutionName || null,
      lastSyncedAt: bankConnection?.lastSyncedAt || null,
    });
  } catch (error) {
    console.error('Bank connection check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
