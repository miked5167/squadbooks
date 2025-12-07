import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';
import { createDefaultCategories } from '@/lib/onboarding/create-categories';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, teamType, ageDivision, competitiveLevel, season } = body;

    // Validate input
    if (!name || !teamType || !ageDivision || !competitiveLevel || !season) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the database user or prepare to create one
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, email: true, name: true },
    });

    // If user doesn't exist, we'll create them along with their team
    // This happens during onboarding when a user signs up but hasn't been added to DB yet
    if (!dbUser) {
      // Get user info from Clerk - fetch from the request context
      const email = body.email || 'user@example.com'; // Clerk should provide this
      const userName = body.userName || 'User'; // Clerk should provide this

      // Create team and user together in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // First create the team
        const newTeam = await tx.team.create({
          data: {
            name: name.trim(),
            teamType,
            ageDivision,
            competitiveLevel,
            season,
            budgetTotal: 0, // Will be set in Step 2
          },
        });

        // Then create the user linked to the team
        const newUser = await tx.user.create({
          data: {
            clerkId: userId,
            email,
            name: userName,
            role: 'TREASURER',
            teamId: newTeam.id,
          },
        });

        return { team: newTeam, user: newUser };
      });

      dbUser = { id: result.user.id, email: result.user.email, name: result.user.name };
      const team = result.team;

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
          newValues: { name, teamType, ageDivision, competitiveLevel, season },
        },
      });

      return NextResponse.json({
        success: true,
        team: {
          id: team.id,
          name: team.name,
          teamType: team.teamType,
          ageDivision: team.ageDivision,
          competitiveLevel: team.competitiveLevel,
          season: team.season,
        },
      });
    }

    // User exists - just create the team and link it
    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        teamType,
        ageDivision,
        competitiveLevel,
        season,
        budgetTotal: 0, // Will be set in Step 2
      },
    });

    // Link existing user to new team
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
        newValues: { name, teamType, ageDivision, competitiveLevel, season },
      },
    });

    return NextResponse.json({
      success: true,
      team: {
        id: team.id,
        name: team.name,
        teamType: team.teamType,
        ageDivision: team.ageDivision,
        competitiveLevel: team.competitiveLevel,
        season: team.season,
      },
    });
  } catch (error) {
    logger.error('Team creation error', error as Error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}
