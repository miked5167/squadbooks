/**
 * Budget Envelopes API
 *
 * Endpoints for managing pre-authorized budget envelopes
 */

import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/auth/permissions";
import { BudgetStatus, PeriodType, VendorMatchType } from "@prisma/client";
import { z } from "zod";
import { getEnvelopeSpendingSummary } from "@/lib/services/envelope-matcher";

// Validation schema for creating envelopes
const createEnvelopeSchema = z.object({
  budgetId: z.string().cuid(),
  categoryId: z.string().cuid(),
  vendorMatchType: z.nativeEnum(VendorMatchType),
  vendorMatch: z.string().max(255).optional().nullable(),
  capAmount: z.number().positive().max(100000),
  periodType: z.nativeEnum(PeriodType),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  maxSingleTransaction: z.number().positive().max(100000).optional().nullable(),
});

/**
 * GET /api/budget-envelopes
 * List all active envelopes for a team's budget
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const budgetId = searchParams.get("budgetId");
    const teamId = searchParams.get("teamId");

    if (!budgetId || !teamId) {
      return NextResponse.json(
        { error: "budgetId and teamId are required" },
        { status: 400 }
      );
    }

    // Check user has access to this team
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get budget to ensure it's locked
    const budget = await db.budget.findUnique({
      where: { id: budgetId },
      select: { status: true, teamId: true },
    });

    if (!budget || budget.teamId !== teamId) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    // Get envelopes with spending summary
    const envelopes = await db.budgetEnvelope.findMany({
      where: {
        budgetId,
        teamId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            heading: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get spending summary
    const summary = await getEnvelopeSpendingSummary(teamId, budgetId);

    // Merge envelope data with spending summary
    const enrichedEnvelopes = envelopes.map((envelope) => {
      const spendingData = summary.find((s) => s.envelopeId === envelope.id);
      return {
        ...envelope,
        spent: spendingData?.spent || 0,
        remaining: spendingData?.remaining || Number(envelope.capAmount),
        percentUsed: spendingData?.percentUsed || 0,
        transactionCount: spendingData?.transactionCount || 0,
      };
    });

    return NextResponse.json({
      envelopes: enrichedEnvelopes,
      budgetStatus: budget.status,
    });
  } catch (error) {
    console.error("[BUDGET_ENVELOPES_GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/budget-envelopes
 * Create a new budget envelope
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createEnvelopeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error.errors },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get user and check permissions
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only treasurers can create envelopes
    if (!(await hasPermission(userId, user.teamId, "MANAGE_BUDGET"))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify budget exists and is LOCKED
    const budget = await db.budget.findUnique({
      where: { id: data.budgetId },
      select: { id: true, teamId: true, status: true },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    if (budget.teamId !== user.teamId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (budget.status !== BudgetStatus.LOCKED) {
      return NextResponse.json(
        { error: "Envelopes can only be created for LOCKED budgets" },
        { status: 400 }
      );
    }

    // Verify category exists and belongs to team
    const category = await db.category.findUnique({
      where: { id: data.categoryId },
      select: { teamId: true, name: true },
    });

    if (!category || category.teamId !== user.teamId) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Create the envelope
    const envelope = await db.budgetEnvelope.create({
      data: {
        teamId: user.teamId,
        budgetId: data.budgetId,
        categoryId: data.categoryId,
        vendorMatchType: data.vendorMatchType,
        vendorMatch: data.vendorMatch,
        capAmount: data.capAmount,
        periodType: data.periodType,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        maxSingleTransaction: data.maxSingleTransaction,
        createdBy: user.id,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            heading: true,
            color: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        teamId: user.teamId,
        userId: user.id,
        action: "CREATE_BUDGET_ENVELOPE",
        entityType: "BudgetEnvelope",
        entityId: envelope.id,
        newValues: {
          categoryName: category.name,
          capAmount: data.capAmount,
          periodType: data.periodType,
          vendorMatch: data.vendorMatch,
        },
      },
    });

    return NextResponse.json({ envelope }, { status: 201 });
  } catch (error) {
    console.error("[BUDGET_ENVELOPES_POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
