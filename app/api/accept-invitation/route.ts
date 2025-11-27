import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

// GET - Validate token and get invitation details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            level: true,
            season: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        team: invitation.team,
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

// POST - Accept invitation
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Missing invitation token' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        team: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if already accepted
    if (invitation.acceptedAt) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 410 }
      );
    }

    // Get or create user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      // Create user from invitation
      await prisma.user.create({
        data: {
          clerkId: userId,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          teamId: invitation.teamId,
        },
      });
    } else {
      // Update existing user
      await prisma.user.update({
        where: { clerkId: userId },
        data: {
          teamId: invitation.teamId,
          role: invitation.role,
        },
      });
    }

    // Mark invitation as accepted
    await prisma.invitation.update({
      where: { token },
      data: {
        acceptedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        teamId: invitation.teamId,
        userId: userId,
        action: 'INVITATION_ACCEPTED',
        entityType: 'Invitation',
        entityId: invitation.id,
        newValues: { role: invitation.role },
      },
    });

    return NextResponse.json({
      success: true,
      team: {
        id: invitation.team.id,
        name: invitation.team.name,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}
