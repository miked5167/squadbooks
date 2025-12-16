import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requestBudgetChangesAsAssociation } from "@/lib/budget-workflow/association-approval";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/budget-versions/[versionId]/association-request-changes
 * Association administrator requests changes to a budget version
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

    if (!notes || notes.trim().length === 0) {
      return NextResponse.json(
        { error: "Notes are required when requesting changes" },
        { status: 400 }
      );
    }

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

    // Request changes
    const result = await requestBudgetChangesAsAssociation({
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
    console.error("Error requesting changes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to request changes",
      },
      { status: 500 }
    );
  }
}
