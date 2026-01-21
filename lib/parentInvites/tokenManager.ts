/**
 * Token Management Utilities for Parent Invite System
 * Handles secure token generation, hashing, and validation
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

const TOKEN_LENGTH = 32; // 32 bytes = 256 bits
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Generate a cryptographically secure random token
 * Returns the raw token (to be sent in URL) and its hash (to be stored in DB)
 */
export function generateToken(): { token: string; tokenHash: string } {
  // Generate random bytes
  const rawToken = crypto.randomBytes(TOKEN_LENGTH).toString('base64url');

  // Hash for storage
  const tokenHash = hashToken(rawToken);

  return {
    token: rawToken,
    tokenHash,
  };
}

/**
 * Hash a token using SHA-256
 * Tokens are hashed before storage to prevent exposure if database is compromised
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate token expiry date from now
 */
export function getTokenExpiry(daysFromNow: number = TOKEN_EXPIRY_DAYS): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysFromNow);
  return expiry;
}

/**
 * Validate a token and return the associated player and family data
 * Returns null if token is invalid, expired, or already used
 */
export async function validateToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);

  const invite = await prisma.parentInviteToken.findUnique({
    where: { tokenHash },
    include: {
      player: {
        include: {
          family: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
          season: true,
          logoUrl: true,
          associationName: true,
        },
      },
    },
  });

  // Token not found
  if (!invite) {
    return { valid: false, reason: 'invalid', data: null };
  }

  // Token already used
  if (invite.usedAt) {
    return { valid: false, reason: 'already_used', data: null };
  }

  // Token expired
  if (invite.expiresAt < new Date()) {
    return { valid: false, reason: 'expired', data: null };
  }

  // Token is valid
  return {
    valid: true,
    reason: null,
    data: {
      invite,
      player: invite.player,
      family: invite.player.family,
      team: invite.team,
    },
  };
}

/**
 * Mark a token as used
 */
export async function markTokenAsUsed(tokenHash: string) {
  return await prisma.parentInviteToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  });
}

/**
 * Create a new parent invite token
 */
export async function createInviteToken(params: {
  playerId: string;
  familyId: string;
  teamId: string;
}) {
  const { token, tokenHash } = generateToken();
  const expiresAt = getTokenExpiry();

  const invite = await prisma.parentInviteToken.create({
    data: {
      playerId: params.playerId,
      familyId: params.familyId,
      teamId: params.teamId,
      tokenHash,
      expiresAt,
    },
    include: {
      player: true,
      team: {
        select: {
          name: true,
          season: true,
        },
      },
    },
  });

  return {
    invite,
    token, // Raw token to include in email URL
    expiresAt,
  };
}

/**
 * Get all active (unused, non-expired) invites for a team
 */
export async function getActiveInvitesForTeam(teamId: string) {
  const now = new Date();

  return await prisma.parentInviteToken.findMany({
    where: {
      teamId,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jerseyNumber: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

/**
 * Check if a player already has an active invite
 */
export async function hasActiveInvite(playerId: string): Promise<boolean> {
  const now = new Date();

  const activeInvite = await prisma.parentInviteToken.findFirst({
    where: {
      playerId,
      usedAt: null,
      expiresAt: { gt: now },
    },
  });

  return activeInvite !== null;
}

/**
 * Revoke (delete) an invite token
 */
export async function revokeInvite(tokenId: string) {
  return await prisma.parentInviteToken.delete({
    where: { id: tokenId },
  });
}
