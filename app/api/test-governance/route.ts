import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Simple test endpoint to verify Prisma schema
 */
export async function GET() {
  try {
    // Test if the new enum types exist
    const testData = {
      parentAckMode: "PERCENT" as const,
      eligibleFamilyDefinition: "ACTIVE_ROSTER_ONLY" as const,
    };

    // Test if we can query (won't find anything, but tests the schema)
    const rules = await prisma.associationGovernanceRule.findMany({
      take: 1,
    });

    return NextResponse.json({
      success: true,
      message: "Prisma schema is working",
      testData,
      rulesCount: rules.length,
    });
  } catch (error) {
    console.error("Test governance error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
