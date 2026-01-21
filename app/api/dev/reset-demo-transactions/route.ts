import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

/**
 * Demo Reset API - Delete all imported Plaid transactions
 *
 * This endpoint is for development/demo purposes only.
 * It deletes all transactions that were imported via Plaid (isImported = true)
 * for the current team.
 *
 * POST /api/dev/reset-demo-transactions
 * Body: { teamId: string }
 */
export async function POST(request: Request) {
  try {
    // Only allow in development mode
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development mode' },
        { status: 403 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing teamId' },
        { status: 400 }
      );
    }

    // Verify user belongs to this team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete all imported transactions for this team
    const result = await prisma.$transaction(async (tx) => {
      // Delete all approvals related to imported transactions first
      const importedTransactions = await tx.transaction.findMany({
        where: {
          teamId,
          isImported: true,
        },
        select: { id: true },
      });

      const importedTransactionIds = importedTransactions.map(t => t.id);

      if (importedTransactionIds.length > 0) {
        // Delete approvals first (foreign key constraint)
        await tx.approval.deleteMany({
          where: {
            transactionId: { in: importedTransactionIds },
          },
        });
      }

      // Delete the imported transactions
      const deleted = await tx.transaction.deleteMany({
        where: {
          teamId,
          isImported: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          teamId,
          userId: user.id,
          action: 'DEMO_RESET_TRANSACTIONS',
          entityType: 'Transaction',
          entityId: teamId,
          oldValues: {
            deletedCount: deleted.count,
          },
        },
      });

      return deleted;
    });

    logger.info(`Demo reset: Deleted ${result.count} imported transactions for team ${teamId}`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} imported transaction(s)`,
    });
  } catch (error) {
    logger.error('Demo reset error', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to reset demo transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
