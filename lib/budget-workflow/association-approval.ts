/**
 * Association Budget Approval Actions
 * Handles association-level budget approvals when governance rules require it
 */

import { prisma } from "@/lib/prisma";
import { BudgetStatus } from "@prisma/client";
import { requiresAssociationApproval } from "@/lib/db/governance";

/**
 * Check if user is an association finance administrator
 */
export async function isAssociationFinanceAdmin(
  userId: string,
  associationId: string
): Promise<boolean> {
  const associationUser = await prisma.associationUser.findFirst({
    where: {
      clerkUserId: userId,
      associationId,
      role: {
        in: ["association_admin", "board_member"], // Finance-related roles
      },
    },
  });

  return associationUser !== null;
}

/**
 * Approve a budget version as an association finance administrator
 * Transitions: ASSOCIATION_REVIEW → TEAM_APPROVED
 */
export async function approveBudgetAsAssociation(params: {
  budgetId: string;
  versionNumber: number;
  userId: string; // Clerk user ID
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { budgetId, versionNumber, userId, notes } = params;

  try {
    // Get budget with team information
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        team: {
          include: {
            associationTeam: true,
          },
        },
        versions: {
          where: { versionNumber },
        },
      },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    const version = budget.versions[0];
    if (!version) {
      return { success: false, error: "Budget version not found" };
    }

    // Get association ID from team
    const associationId = budget.team.associationTeam?.associationId;
    if (!associationId) {
      return {
        success: false,
        error: "Team is not linked to an association",
      };
    }

    // Verify association approval is required
    const requiresApproval = await requiresAssociationApproval(associationId);
    if (!requiresApproval) {
      return {
        success: false,
        error: "Association approval is not required for this association",
      };
    }

    // Verify user is an association finance admin
    const isAdmin = await isAssociationFinanceAdmin(userId, associationId);
    if (!isAdmin) {
      return {
        success: false,
        error: "User is not authorized to approve budgets for this association",
      };
    }

    // Verify budget is in ASSOCIATION_REVIEW state
    if (budget.status !== "ASSOCIATION_REVIEW") {
      return {
        success: false,
        error: `Budget must be in ASSOCIATION_REVIEW status (current: ${budget.status})`,
      };
    }

    // Verify version is coach-approved
    if (!version.coachApprovedAt) {
      return {
        success: false,
        error: "Budget version must be coach-approved first",
      };
    }

    // Get association user ID for tracking
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId,
      },
    });

    if (!associationUser) {
      return {
        success: false,
        error: "Association user not found",
      };
    }

    // Update version with association approval
    await prisma.budgetVersion.update({
      where: { id: version.id },
      data: {
        associationApprovedAt: new Date(),
        associationApprovedBy: associationUser.id,
        associationNotes: notes,
      },
    });

    // Update budget status to TEAM_APPROVED
    await prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: "TEAM_APPROVED" as BudgetStatus,
      },
    });

    // TODO: Update TeamSeason state if it exists
    const teamSeason = await prisma.teamSeason.findFirst({
      where: {
        teamId: budget.teamId,
        seasonLabel: budget.season,
      },
    });

    if (teamSeason) {
      await prisma.teamSeason.update({
        where: { id: teamSeason.id },
        data: {
          state: "TEAM_APPROVED",
          stateUpdatedAt: new Date(),
        },
      });

      // Create state change audit log
      await prisma.teamSeasonStateChange.create({
        data: {
          teamSeasonId: teamSeason.id,
          fromState: "BUDGET_REVIEW",
          toState: "TEAM_APPROVED",
          action: "APPROVE_BUDGET",
          actorUserId: userId,
          actorType: "USER",
          metadata: {
            budgetId,
            versionNumber,
            approvedBy: "association",
            notes,
          },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error approving budget as association:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to approve budget",
    };
  }
}

/**
 * Request changes to a budget as an association finance administrator
 * Transitions: ASSOCIATION_REVIEW → DRAFT (treasurer must revise)
 */
export async function requestBudgetChangesAsAssociation(params: {
  budgetId: string;
  versionNumber: number;
  userId: string; // Clerk user ID
  notes: string; // Required - must explain what needs to change
}): Promise<{ success: boolean; error?: string }> {
  const { budgetId, versionNumber, userId, notes } = params;

  if (!notes || notes.trim().length === 0) {
    return {
      success: false,
      error: "Notes are required when requesting changes",
    };
  }

  try {
    // Get budget with team information
    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        team: {
          include: {
            associationTeam: true,
          },
        },
        versions: {
          where: { versionNumber },
        },
      },
    });

    if (!budget) {
      return { success: false, error: "Budget not found" };
    }

    const version = budget.versions[0];
    if (!version) {
      return { success: false, error: "Budget version not found" };
    }

    // Get association ID from team
    const associationId = budget.team.associationTeam?.associationId;
    if (!associationId) {
      return {
        success: false,
        error: "Team is not linked to an association",
      };
    }

    // Verify association approval is required
    const requiresApproval = await requiresAssociationApproval(associationId);
    if (!requiresApproval) {
      return {
        success: false,
        error: "Association approval is not required for this association",
      };
    }

    // Verify user is an association finance admin
    const isAdmin = await isAssociationFinanceAdmin(userId, associationId);
    if (!isAdmin) {
      return {
        success: false,
        error: "User is not authorized to request changes for this association",
      };
    }

    // Verify budget is in ASSOCIATION_REVIEW state
    if (budget.status !== "ASSOCIATION_REVIEW") {
      return {
        success: false,
        error: `Budget must be in ASSOCIATION_REVIEW status (current: ${budget.status})`,
      };
    }

    // Get association user ID for tracking
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId,
      },
    });

    if (!associationUser) {
      return {
        success: false,
        error: "Association user not found",
      };
    }

    // Store rejection notes in version
    await prisma.budgetVersion.update({
      where: { id: version.id },
      data: {
        associationNotes: notes,
        // Clear any previous association approval
        associationApprovedAt: null,
        associationApprovedBy: null,
      },
    });

    // Update budget status back to DRAFT
    await prisma.budget.update({
      where: { id: budgetId },
      data: {
        status: "DRAFT" as BudgetStatus,
      },
    });

    // Update TeamSeason state if it exists
    const teamSeason = await prisma.teamSeason.findFirst({
      where: {
        teamId: budget.teamId,
        seasonLabel: budget.season,
      },
    });

    if (teamSeason) {
      await prisma.teamSeason.update({
        where: { id: teamSeason.id },
        data: {
          state: "BUDGET_DRAFT",
          stateUpdatedAt: new Date(),
        },
      });

      // Create state change audit log
      await prisma.teamSeasonStateChange.create({
        data: {
          teamSeasonId: teamSeason.id,
          fromState: "BUDGET_REVIEW",
          toState: "BUDGET_DRAFT",
          action: "REQUEST_BUDGET_CHANGES",
          actorUserId: userId,
          actorType: "USER",
          metadata: {
            budgetId,
            versionNumber,
            requestedBy: "association",
            notes,
          },
        },
      });
    }

    // TODO: Send notification to treasurer about requested changes

    return { success: true };
  } catch (error) {
    console.error("Error requesting budget changes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to request changes",
    };
  }
}

/**
 * Get association approval status for a budget version
 */
export async function getAssociationApprovalStatus(
  budgetId: string,
  versionNumber: number
) {
  const version = await prisma.budgetVersion.findFirst({
    where: {
      budgetId,
      versionNumber,
    },
    include: {
      budget: {
        include: {
          team: {
            include: {
              associationTeam: true,
            },
          },
        },
      },
    },
  });

  if (!version) {
    return null;
  }

  const associationId = version.budget.team.associationTeam?.associationId;
  if (!associationId) {
    return null;
  }

  const requiresApproval = await requiresAssociationApproval(associationId);

  let approverDetails = null;
  if (version.associationApprovedBy) {
    const approver = await prisma.associationUser.findUnique({
      where: { id: version.associationApprovedBy },
    });
    approverDetails = approver
      ? {
          id: approver.id,
          name: approver.name,
          email: approver.email,
          role: approver.role,
        }
      : null;
  }

  return {
    requiresApproval,
    isApproved: !!version.associationApprovedAt,
    approvedAt: version.associationApprovedAt,
    approvedBy: approverDetails,
    notes: version.associationNotes,
  };
}
