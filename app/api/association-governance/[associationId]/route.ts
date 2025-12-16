import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import {
  getGovernanceRulesWithDefaults,
  upsertGovernanceRules,
  type GovernanceRuleInput,
} from "@/lib/db/governance";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/association-governance/[associationId]
 * Get governance rules for an association
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    console.log("[Governance API] Starting GET request");

    const { userId } = await auth();
    console.log("[Governance API] User ID:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { associationId } = await params;
    console.log("[Governance API] Association ID:", associationId);

    // Check if user is an association user
    console.log("[Governance API] Checking association user...");
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        associationId,
        clerkUserId: userId,
      },
    });
    console.log("[Governance API] Association user found:", !!associationUser);

    // If not an association user, check if they're a team user in this association
    if (!associationUser) {
      console.log("[Governance API] Checking team user...");
      const teamUser = await prisma.user.findFirst({
        where: {
          clerkId: userId,
          team: {
            associationTeam: {
              associationId,
            },
          },
        },
      });
      console.log("[Governance API] Team user found:", !!teamUser);

      if (!teamUser) {
        console.log("[Governance API] No access - returning 403");
        return NextResponse.json(
          { error: "Forbidden - No access to this association" },
          { status: 403 }
        );
      }
    }

    console.log("[Governance API] Fetching governance rules...");
    const rules = await getGovernanceRulesWithDefaults(associationId);
    console.log("[Governance API] Rules fetched successfully:", rules);

    return NextResponse.json(rules);
  } catch (error) {
    console.error("[Governance API] ERROR:", error);
    console.error("[Governance API] Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      {
        error: "Failed to fetch governance rules",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/association-governance/[associationId]
 * Update governance rules for an association
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { associationId } = await params;

    // Verify user is an association admin
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        associationId,
        clerkUserId: userId,
        role: "association_admin", // Only admins can update governance rules
      },
    });

    if (!associationUser) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = (await request.json()) as GovernanceRuleInput;

    // Upsert the rules (validation happens in the function)
    const rules = await upsertGovernanceRules(associationId, body);

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error updating governance rules:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update governance rules",
      },
      { status: 500 }
    );
  }
}
