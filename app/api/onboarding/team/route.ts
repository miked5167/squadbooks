import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createDefaultCategories } from '@/lib/onboarding/create-categories';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, level, season } = body;

    // Validate input
    if (!name || !level || !season) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the database user ID
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create team
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        level,
        season,
        budgetTotal: 0, // Will be set in Step 2
      },
    });

    // Link user to team as treasurer
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        teamId: team.id,
        role: 'TREASURER',
      },
    });

    // Create default categories (26 categories)
    await createDefaultCategories(team.id);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        teamId: team.id,
        userId: dbUser.id,
        action: 'TEAM_CREATED',
        entityType: 'Team',
        entityId: team.id,
        newValues: { name, level, season },
      },
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        level: team.level,
        season: team.season,
      },
    });
  } catch (error) {
    console.error('Team creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
