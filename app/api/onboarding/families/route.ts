import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, families } = body;

    // Validate input
    if (!teamId || !families || !Array.isArray(families)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user belongs to this team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete existing families for this team (fresh start)
    await prisma.family.deleteMany({
      where: { teamId },
    });

    // Create all families in a single transaction
    const createdFamilies = await prisma.family.createMany({
      data: families.map((family: any) => ({
        teamId,
        familyName: family.familyName.trim(),
        primaryEmail: family.primaryEmail.trim().toLowerCase(),
        secondaryEmail: family.secondaryEmail
          ? family.secondaryEmail.trim().toLowerCase()
          : null,
      })),
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        teamId,
        userId: user.id,
        action: 'FAMILIES_ADDED',
        entityType: 'Family',
        entityId: teamId,
        newValues: {
          count: createdFamilies.count,
          families: families.map((f: any) => ({
            familyName: f.familyName,
            primaryEmail: f.primaryEmail,
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      count: createdFamilies.count,
    });
  } catch (error) {
    console.error('Family creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save families' },
      { status: 500 }
    );
  }
}
