import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { validateSeasonClosure, DEFAULT_POLICY } from '@/lib/season-closure/validation';
import { submitToAssociation } from '@/lib/season-closure/submission';

/**
 * POST /api/season-closure/submit
 * Submits the season closure package to the association
 * Only treasurers can submit
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and verify role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only treasurers can submit season closure
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can submit season closure' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { associationEmail, overrideWarnings } = body;

    if (!associationEmail) {
      return NextResponse.json(
        { error: 'Association email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(associationEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const teamId = user.teamId;
    const season = user.team.season;

    // Re-run validation to ensure state hasn't changed
    const validationResult = await validateSeasonClosure(teamId, season);

    // Check for blocking errors
    if (!validationResult.isValid) {
      return NextResponse.json(
        {
          error: 'Season is not ready to close',
          validation: validationResult,
        },
        { status: 400 }
      );
    }

    // Check for warnings (if not overridden)
    if (validationResult.warnings.length > 0 && !overrideWarnings) {
      return NextResponse.json(
        {
          error: 'Warnings need to be acknowledged',
          requiresConfirmation: true,
          validation: validationResult,
        },
        { status: 400 }
      );
    }

    // Create or update SeasonClosure record
    let closure = await prisma.seasonClosure.findUnique({
      where: {
        teamId_season: {
          teamId,
          season,
        },
      },
    });

    if (closure) {
      // Update existing closure
      closure = await prisma.seasonClosure.update({
        where: { id: closure.id },
        data: {
          status: 'VALIDATING',
          associationEmail,
          submittedBy: user.id,
          // Snapshot validation flags
          budgetBalanced: validationResult.budgetBalanced,
          allTransactionsApproved: validationResult.allTransactionsApproved,
          allReceiptsPresent: validationResult.allReceiptsPresent,
          bankReconciled: validationResult.bankReconciled,
          // Snapshot financial summary
          totalIncome: validationResult.totalIncome,
          totalExpenses: validationResult.totalExpenses,
          finalBalance: validationResult.finalBalance,
          // Snapshot policy
          policySnapshot: JSON.parse(JSON.stringify({
            ...DEFAULT_POLICY,
            warningsOverridden: overrideWarnings || false,
            warnings: validationResult.warnings,
          })),
        },
      });
    } else {
      // Create new closure
      closure = await prisma.seasonClosure.create({
        data: {
          teamId,
          season,
          status: 'VALIDATING',
          associationEmail,
          submittedBy: user.id,
          // Snapshot validation flags
          budgetBalanced: validationResult.budgetBalanced,
          allTransactionsApproved: validationResult.allTransactionsApproved,
          allReceiptsPresent: validationResult.allReceiptsPresent,
          bankReconciled: validationResult.bankReconciled,
          // Snapshot financial summary
          totalIncome: validationResult.totalIncome,
          totalExpenses: validationResult.totalExpenses,
          finalBalance: validationResult.finalBalance,
          // Snapshot policy
          policySnapshot: JSON.parse(JSON.stringify({
            ...DEFAULT_POLICY,
            warningsOverridden: overrideWarnings || false,
            warnings: validationResult.warnings,
          })),
        },
      });
    }

    // Submit to association (this is a long-running operation)
    // In a production system, this should be moved to a background job/queue
    // For now, we'll run it synchronously but structure it to be easily moved
    await submitToAssociation(closure.id);

    return NextResponse.json({
      success: true,
      closureId: closure.id,
      message: 'Season closure package submitted successfully',
    });
  } catch (error) {
    console.error('Submission error:', error);

    // Provide more specific error message if available
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to submit season closure';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
