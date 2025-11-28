import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { createInviteToken, markPlayerAsInvited } from '@/lib/parentInvites';
import { hasPermission } from '@/lib/auth/permissions';
import { sendParentInviteEmail } from '@/lib/email';

/**
 * POST /api/parent-invites/create
 * Create a new parent invite token for a player
 *
 * Request body:
 * {
 *   playerId: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   token: string,
 *   invite: { ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user and check permissions
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to manage roster
    if (!hasPermission(user.role, 'manage_roster')) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to create parent invites' },
        { status: 403 }
      );
    }

    // Parse request body
    const { playerId } = await req.json();

    if (!playerId) {
      return NextResponse.json(
        { error: 'playerId is required' },
        { status: 400 }
      );
    }

    // Get player and verify they belong to the user's team
    const player = await prisma.player.findUnique({
      where: { id: playerId },
      include: { family: true },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.teamId !== user.teamId) {
      return NextResponse.json(
        { error: 'Forbidden: Player does not belong to your team' },
        { status: 403 }
      );
    }

    // Check if player has a family
    if (!player.familyId) {
      return NextResponse.json(
        { error: 'Player must have a family record before creating an invite' },
        { status: 400 }
      );
    }

    // Check if player already has an active invite
    const existingInvite = await prisma.parentInviteToken.findFirst({
      where: {
        playerId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Player already has an active invite' },
        { status: 400 }
      );
    }

    // Create the invite token
    const { invite, token, expiresAt } = await createInviteToken({
      playerId: player.id,
      familyId: player.familyId,
      teamId: user.teamId,
    });

    // Update player's onboarding status
    await markPlayerAsInvited(playerId);

    // Send the invitation email
    try {
      await sendParentInviteEmail({
        parentEmail: player.family!.primaryEmail,
        parentName: player.family!.primaryName || undefined,
        playerFirstName: player.firstName,
        playerLastName: player.lastName,
        teamName: user.team.name,
        season: user.team.season,
        inviteToken: token,
        expiresAt,
        teamLogoUrl: user.team.logoUrl || undefined,
        associationName: user.team.associationName || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Don't fail the entire request if email fails - the invite is still created
    }

    // Return the token (to be used in email URL)
    return NextResponse.json({
      success: true,
      token, // Raw token for URL
      invite: {
        id: invite.id,
        playerId: invite.playerId,
        expiresAt: expiresAt.toISOString(),
        player: {
          firstName: invite.player.firstName,
          lastName: invite.player.lastName,
        },
        team: {
          name: invite.team.name,
          season: invite.team.season,
        },
      },
    });
  } catch (error) {
    console.error('Error creating parent invite:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
