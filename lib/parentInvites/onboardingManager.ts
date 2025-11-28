/**
 * Onboarding Status Management for Players
 * Handles updating player onboarding status and family linkage
 */

import { prisma } from '@/lib/prisma';
import { OnboardingStatus } from '@prisma/client';

/**
 * Update player's onboarding status to INVITED
 */
export async function markPlayerAsInvited(playerId: string) {
  return await prisma.player.update({
    where: { id: playerId },
    data: {
      onboardingStatus: OnboardingStatus.INVITED,
      inviteSentAt: new Date(),
    },
  });
}

/**
 * Update player's onboarding status to COMPLETED
 */
export async function markPlayerAsCompleted(playerId: string) {
  return await prisma.player.update({
    where: { id: playerId },
    data: {
      onboardingStatus: OnboardingStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

/**
 * Increment reminder count for a player
 */
export async function incrementReminderCount(playerId: string) {
  return await prisma.player.update({
    where: { id: playerId },
    data: {
      reminderCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Get all players in a team with their onboarding status
 */
export async function getPlayersWithOnboardingStatus(teamId: string) {
  return await prisma.player.findMany({
    where: { teamId },
    include: {
      family: {
        select: {
          id: true,
          familyName: true,
          primaryEmail: true,
          primaryName: true,
        },
      },
    },
    orderBy: [
      { lastName: 'asc' },
      { firstName: 'asc' },
    ],
  });
}

/**
 * Get players who need reminders (invited but not completed)
 * Optionally filter by max reminder count
 */
export async function getPlayersNeedingReminders(
  teamId: string,
  maxReminders: number = 3
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days since last invite

  return await prisma.player.findMany({
    where: {
      teamId,
      onboardingStatus: OnboardingStatus.INVITED,
      reminderCount: { lt: maxReminders },
      inviteSentAt: { lt: cutoffDate },
    },
    include: {
      family: {
        select: {
          id: true,
          primaryEmail: true,
          primaryName: true,
        },
      },
      inviteTokens: {
        where: {
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });
}

/**
 * Get onboarding statistics for a team
 */
export async function getOnboardingStats(teamId: string) {
  const players = await prisma.player.findMany({
    where: { teamId },
    select: {
      onboardingStatus: true,
    },
  });

  const total = players.length;
  const notInvited = players.filter(p => p.onboardingStatus === OnboardingStatus.NOT_INVITED).length;
  const invited = players.filter(p => p.onboardingStatus === OnboardingStatus.INVITED).length;
  const completed = players.filter(p => p.onboardingStatus === OnboardingStatus.COMPLETED).length;

  return {
    total,
    notInvited,
    invited,
    completed,
    completionRate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
  };
}

/**
 * Link a player to a family (used during onboarding)
 */
export async function linkPlayerToFamily(playerId: string, familyId: string) {
  return await prisma.player.update({
    where: { id: playerId },
    data: { familyId },
  });
}
