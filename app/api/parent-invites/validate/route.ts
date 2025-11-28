import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/parentInvites';

/**
 * GET /api/parent-invites/validate?token=xxx
 * Validate a parent invite token
 *
 * Query params:
 * - token: string (the raw token from the URL)
 *
 * Response:
 * {
 *   valid: boolean,
 *   reason?: 'invalid' | 'already_used' | 'expired',
 *   data?: {
 *     player: { ... },
 *     family: { ... },
 *     team: { ... }
 *   }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'invalid',
          error: 'Token parameter is required'
        },
        { status: 400 }
      );
    }

    // Validate the token
    const result = await validateToken(token);

    if (!result.valid) {
      // Return appropriate status code based on reason
      const statusCode = result.reason === 'invalid' ? 404 : 400;

      return NextResponse.json(
        {
          valid: false,
          reason: result.reason,
          message: getErrorMessage(result.reason),
        },
        { status: statusCode }
      );
    }

    // Token is valid - return player, family, and team data
    return NextResponse.json({
      valid: true,
      data: {
        player: {
          id: result.data!.player.id,
          firstName: result.data!.player.firstName,
          lastName: result.data!.player.lastName,
          jerseyNumber: result.data!.player.jerseyNumber,
          position: result.data!.player.position,
          dateOfBirth: result.data!.player.dateOfBirth,
        },
        family: result.data!.family ? {
          id: result.data!.family.id,
          familyName: result.data!.family.familyName,
          primaryEmail: result.data!.family.primaryEmail,
          primaryName: result.data!.family.primaryName,
          primaryPhone: result.data!.family.primaryPhone,
          secondaryName: result.data!.family.secondaryName,
          secondaryEmail: result.data!.family.secondaryEmail,
          secondaryPhone: result.data!.family.secondaryPhone,
          emergencyContactName: result.data!.family.emergencyContactName,
          emergencyContactRelation: result.data!.family.emergencyContactRelation,
          emergencyContactPhone: result.data!.family.emergencyContactPhone,
          medicalNotes: result.data!.family.medicalNotes,
          allergies: result.data!.family.allergies,
          address: result.data!.family.address,
        } : null,
        team: {
          id: result.data!.team.id,
          name: result.data!.team.name,
          season: result.data!.team.season,
          logoUrl: result.data!.team.logoUrl,
          associationName: result.data!.team.associationName,
        },
        invite: {
          id: result.data!.invite.id,
          expiresAt: result.data!.invite.expiresAt.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error'
      },
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
