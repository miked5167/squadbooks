import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';
import { createDefaultBudgetAllocations } from '@/lib/onboarding/create-allocations';

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, budgetTotal } = body;

    // Validate
    if (!teamId || !budgetTotal) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (budgetTotal < 1000 || budgetTotal > 1000000) {
      return NextResponse.json(
        { error: 'Budget must be between $1,000 and $1,000,000' },
        { status: 400 }
      );
    }

    // Verify user owns this team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (user?.teamId !== teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get team to get season
    const teamData = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!teamData) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    // Update team budget
    const team = await prisma.team.update({
      where: { id: teamId },
      data: {
        budgetTotal: budgetTotal,
      },
    });

    // Create budget allocations across categories
    await createDefaultBudgetAllocations(teamId, teamData.season, budgetTotal);

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        budgetTotal: team.budgetTotal,
      },
    });
  } catch (error) {
    console.error('Budget update error:', error);
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    );
  }
}
