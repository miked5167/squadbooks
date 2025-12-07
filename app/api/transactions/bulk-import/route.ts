import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';
import type { PlaidTransaction } from '@/lib/types/banking';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, transactions, bankConnection } = body as {
      teamId: string;
      transactions: PlaidTransaction[];
      bankConnection?: {
        accessToken: string;
        itemId: string;
        plaidAccountId: string;
        institutionName: string;
        accountName: string;
        accountMask?: string;
        accountType?: string;
      };
    };

    // Validate input
    if (!teamId || !transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions to import' },
        { status: 400 }
      );
    }

    // Get user and verify they belong to this team with TREASURER role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true, role: true },
    });

    if (!user || user.teamId !== teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can import transactions' },
        { status: 403 }
      );
    }

    // Get all Plaid transaction IDs to check for duplicates
    const plaidTransactionIds = transactions.map((t) => t.plaidTransactionId);

    // Check for existing transactions with these Plaid IDs
    const existingTransactions = await prisma.transaction.findMany({
      where: {
        teamId,
        plaidTransactionId: { in: plaidTransactionIds },
      },
      select: { plaidTransactionId: true },
    });

    const existingPlaidIds = new Set(
      existingTransactions.map((t) => t.plaidTransactionId)
    );

    // Filter out duplicates
    const newTransactions = transactions.filter(
      (t) => !existingPlaidIds.has(t.plaidTransactionId)
    );

    if (newTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: transactions.length,
        message: 'All transactions were already imported',
      });
    }

    // Get all categories for this team to map suggested category IDs
    const categories = await prisma.category.findMany({
      where: { teamId },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Transform PlaidTransaction[] to database Transaction format
    const now = new Date();
    const transactionsToCreate = newTransactions.map((plaidTx) => {
      // Determine type: negative amount = income, positive = expense
      const isIncome = plaidTx.amount < 0;

      // Use suggested category if valid, otherwise fallback
      let categoryId = plaidTx.assignedCategoryId || plaidTx.suggestedCategoryId;

      // Validate category belongs to this team
      if (categoryId && !categoryMap.has(categoryId)) {
        categoryId = undefined;
      }

      // If no valid category, find default "Uncategorized" or first category
      if (!categoryId) {
        const uncategorized = categories.find(
          (c) => c.name.toLowerCase().includes('uncategorized')
        );
        categoryId = uncategorized?.id || categories[0]?.id;
      }

      if (!categoryId) {
        throw new Error('No categories found for team');
      }

      return {
        teamId,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        status: 'DRAFT', // Imported transactions start as DRAFT
        amount: Math.abs(plaidTx.amount),
        categoryId,
        vendor: plaidTx.merchantName || plaidTx.name,
        description: plaidTx.name,
        transactionDate: new Date(plaidTx.date),
        createdBy: user.id,
        // Plaid tracking fields
        plaidTransactionId: plaidTx.plaidTransactionId,
        plaidAccountId: bankConnection?.plaidAccountId || plaidTx.accountId,
        isImported: true,
        importedAt: now,
        importSource: 'PLAID',
      };
    });

    // Bulk create transactions in a single database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create or update bank connection if provided
      if (bankConnection) {
        await tx.bankConnection.upsert({
          where: {
            teamId_itemId: {
              teamId,
              itemId: bankConnection.itemId,
            },
          },
          create: {
            teamId,
            accessToken: bankConnection.accessToken,
            itemId: bankConnection.itemId,
            plaidAccountId: bankConnection.plaidAccountId,
            institutionName: bankConnection.institutionName,
            accountName: bankConnection.accountName,
            accountMask: bankConnection.accountMask,
            accountType: bankConnection.accountType,
            lastSyncedAt: now,
            isActive: true,
          },
          update: {
            accessToken: bankConnection.accessToken,
            plaidAccountId: bankConnection.plaidAccountId,
            institutionName: bankConnection.institutionName,
            accountName: bankConnection.accountName,
            accountMask: bankConnection.accountMask,
            accountType: bankConnection.accountType,
            lastSyncedAt: now,
            isActive: true,
          },
        });
      }

      const created = await tx.transaction.createMany({
        data: transactionsToCreate,
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          teamId,
          userId: user.id,
          action: 'BULK_IMPORT_TRANSACTIONS',
          entityType: 'Transaction',
          entityId: teamId,
          newValues: {
            imported: created.count,
            skipped: existingPlaidIds.size,
            source: 'PLAID',
            plaidAccountId: bankConnection?.plaidAccountId,
            itemId: bankConnection?.itemId,
          },
        },
      });

      return created;
    });

    logger.info(`Bulk imported ${result.count} transactions for team ${teamId}`);

    return NextResponse.json({
      success: true,
      imported: result.count,
      skipped: existingPlaidIds.size,
      total: transactions.length,
      message: `Successfully imported ${result.count} transactions${
        existingPlaidIds.size > 0 ? `, skipped ${existingPlaidIds.size} duplicates` : ''
      }`,
    });
  } catch (error) {
    logger.error('Bulk import error', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to import transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
