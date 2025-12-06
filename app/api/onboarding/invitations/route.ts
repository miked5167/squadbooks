import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth/server-auth';
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger'
import { sendInvitationEmail } from '@/lib/onboarding/send-invitation';
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, teamName, email, name, role } = body;

    // Validate
    if (!teamId || !email || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Check if user already exists with this email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    // Create invitation (NOT a full user yet)
    const invitation = await prisma.invitation.create({
      data: {
        teamId,
        email,
        name,
        role,
        token,
        expiresAt,
      },
    });

    // Send invitation email
    await sendInvitationEmail({
      to: email,
      name,
      teamName,
      role,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`,
    });

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
      },
    });
  } catch (error) {
    logger.error('Invitation error', error as Error);
    return NextResponse.json(
      { error: 'Failed to send invitation' },
      { status: 500 }
    );
  }
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
