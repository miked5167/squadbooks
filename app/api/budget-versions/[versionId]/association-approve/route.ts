import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { approveBudgetAsAssociation } from "@/lib/budget-workflow/association-approval";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/budget-versions/[versionId]/association-approve
 * Association administrator approves a budget version
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { versionId } = await params;
    const body = await request.json();
    const { notes } = body;

    // Get budget version
    const version = await prisma.budgetVersion.findUnique({
      where: { id: versionId },
      include: {
        budget: true,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: "Budget version not found" },
        { status: 404 }
      );
    }

    // Approve the budget
    const result = await approveBudgetAsAssociation({
      budgetId: version.budgetId,
      versionNumber: version.versionNumber,
      userId,
      notes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error approving budget:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to approve budget",
      },
      { status: 500 }
    );
  }
}
