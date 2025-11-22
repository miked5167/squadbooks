import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { validateSeasonClosure } from '@/lib/season-closure/validation';

/**
 * GET /api/season-closure/validate
 * Validates that a season is ready to be closed
 * Only treasurers can run validation
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only treasurers can validate season closure
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can validate season closure' },
        { status: 403 }
      );
    }

    const teamId = user.teamId;
    const season = user.team.season;

    // Run validation
    const validationResult = await validateSeasonClosure(teamId, season);

    return NextResponse.json({
      success: true,
      validation: validationResult,
      team: {
        id: user.team.id,
        name: user.team.name,
        season: user.team.season,
      },
    });
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate season closure' },
      { status: 500 }
    );
  }
}
