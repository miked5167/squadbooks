import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken, markTokenAsUsed, markPlayerAsCompleted } from '@/lib/parentInvites';

/**
 * POST /api/parent-invites/complete
 * Complete the parent onboarding process
 *
 * Request body:
 * {
 *   token: string,
 *   familyData: {
 *     primaryName?: string,
 *     primaryEmail: string,
 *     primaryPhone?: string,
 *     secondaryName?: string,
 *     secondaryEmail?: string,
 *     secondaryPhone?: string,
 *     emergencyContactName?: string,
 *     emergencyContactRelation?: string,
 *     emergencyContactPhone?: string,
 *     medicalNotes?: string,
 *     allergies?: string,
 *     address?: string
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   familyId: string,
 *   playerId: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const { token, familyData } = await req.json();

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    if (!familyData || !familyData.primaryEmail) {
      return NextResponse.json(
        { error: 'Primary email is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const validationResult = await validateToken(token);

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          error: getErrorMessage(validationResult.reason),
          reason: validationResult.reason,
        },
        { status: 400 }
      );
    }

    const { invite, player, family, team } = validationResult.data!;

    // Update the family record with the provided data
    const updatedFamily = await prisma.family.update({
      where: { id: family!.id },
      data: {
        primaryName: familyData.primaryName || family!.primaryName,
        primaryEmail: familyData.primaryEmail,
        primaryPhone: familyData.primaryPhone || family!.primaryPhone,
        secondaryName: familyData.secondaryName || family!.secondaryName,
        secondaryEmail: familyData.secondaryEmail || family!.secondaryEmail,
        secondaryPhone: familyData.secondaryPhone || family!.secondaryPhone,
        emergencyContactName: familyData.emergencyContactName || family!.emergencyContactName,
        emergencyContactRelation: familyData.emergencyContactRelation || family!.emergencyContactRelation,
        emergencyContactPhone: familyData.emergencyContactPhone || family!.emergencyContactPhone,
        medicalNotes: familyData.medicalNotes || family!.medicalNotes,
        allergies: familyData.allergies || family!.allergies,
        address: familyData.address || family!.address,
      },
    });

    // Mark the token as used
    await markTokenAsUsed(invite.tokenHash);

    // Mark the player's onboarding as completed
    await markPlayerAsCompleted(player.id);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        familyId: updatedFamily.id,
        playerId: player.id,
        teamName: team.name,
      },
    });
  } catch (error) {
    logger.error('Error completing onboarding', error as Error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get user-friendly error message for token validation failure
 */
function getErrorMessage(reason: string | null): string {
  switch (reason) {
    case 'invalid':
      return 'This invitation link is not valid. Please contact your team administrator.';
    case 'already_used':
      return 'This invitation has already been used.';
    case 'expired':
      return 'This invitation has expired. Please contact your team administrator for a new invitation.';
    default:
      return 'Unable to validate invitation.';
  }
}
