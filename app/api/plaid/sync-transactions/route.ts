import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';
import { plaidClient } from '@/lib/plaid/client';
import { categorizeTransactions } from '@/lib/services/transaction-categorizer';
import { validateImportedTransactions } from '@/lib/services/validate-imported-transactions';

/**
 * Sync Transactions API - Fetch new transactions from connected Plaid account
 *
 * This endpoint syncs transactions from the team's connected bank account.
 * It reuses the existing bulk-import logic to prevent duplicates and apply AI categorization.
 *
 * POST /api/plaid/sync-transactions
 * Body: { teamId: string }
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId } = body as { teamId: string };

    if (!teamId) {
      return NextResponse.json(
        { error: 'Missing teamId' },
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
        { error: 'Only treasurers can sync transactions' },
        { status: 403 }
      );
    }

    // Get the team's active bank connection
    const bankConnection = await prisma.bankConnection.findFirst({
      where: {
        teamId,
        isActive: true,
      },
      orderBy: {
        lastSyncedAt: 'desc',
      },
    });

    if (!bankConnection) {
      return NextResponse.json(
        { error: 'No bank connection found. Please connect a bank account first.' },
        { status: 404 }
      );
    }

    // Fetch transactions from Plaid for the last 90 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    logger.info(`Syncing transactions for team ${teamId} from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    const response = await plaidClient.transactionsGet({
      access_token: bankConnection.accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        account_ids: [bankConnection.plaidAccountId],
      },
    });

    const plaidTransactions = response.data.transactions;

    if (plaidTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: 0,
        total: 0,
        message: 'No new transactions found',
      });
    }

    // Transform Plaid transactions to our format
    const transformedTransactions = plaidTransactions.map((tx) => ({
      id: tx.transaction_id,
      plaidTransactionId: tx.transaction_id,
      accountId: tx.account_id,
      amount: tx.amount,
      date: tx.date,
      name: tx.name,
      merchantName: tx.merchant_name || tx.name,
      pending: tx.pending,
      category: tx.category,
    }));

    // Apply AI categorization
    const categorized = categorizeTransactions(transformedTransactions);

    // Add category suggestions to transactions
    const transactionsWithCategories = transformedTransactions.map((tx) => {
      const suggestion = categorized.get(tx.id);
      return {
        ...tx,
        suggestedCategoryId: suggestion?.categoryId,
        suggestedCategoryName: suggestion?.categoryName,
        categoryConfidence: suggestion?.confidence,
      };
    });

    // Check for duplicates
    const plaidTransactionIds = transactionsWithCategories.map((t) => t.plaidTransactionId);
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

    // Filter out duplicates and pending transactions
    const newTransactions = transactionsWithCategories.filter(
      (t) => !existingPlaidIds.has(t.plaidTransactionId) && !t.pending
    );

    if (newTransactions.length === 0) {
      // Update lastSyncedAt even if no new transactions
      await prisma.bankConnection.update({
        where: { id: bankConnection.id },
        data: { lastSyncedAt: new Date() },
      });

      return NextResponse.json({
        success: true,
        imported: 0,
        skipped: transactionsWithCategories.length,
        total: transactionsWithCategories.length,
        message: 'All transactions were already imported or pending',
      });
    }

    // Get all categories for this team to map suggested category IDs
    const categories = await prisma.category.findMany({
      where: { teamId },
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Transform to database Transaction format
    const now = new Date();
    const transactionsToCreate = newTransactions.map((plaidTx) => {
      const isIncome = plaidTx.amount < 0;

      let categoryId = plaidTx.suggestedCategoryId;

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
        status: 'IMPORTED', // NEW: Imported transactions start as IMPORTED for validation
        amount: Math.abs(plaidTx.amount),
        categoryId,
        vendor: plaidTx.merchantName || plaidTx.name,
        description: plaidTx.name,
        transactionDate: new Date(plaidTx.date),
        createdBy: user.id,
        // Plaid tracking fields
        plaidTransactionId: plaidTx.plaidTransactionId,
        plaidAccountId: bankConnection.plaidAccountId,
        isImported: true,
        importedAt: now,
        importSource: 'PLAID',
      };
    });

    // Bulk create transactions in a single database transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update bank connection lastSyncedAt
      await tx.bankConnection.update({
        where: { id: bankConnection.id },
        data: { lastSyncedAt: now },
      });

      const created = await tx.transaction.createMany({
        data: transactionsToCreate,
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          teamId,
          userId: user.id,
          action: 'SYNC_TRANSACTIONS',
          entityType: 'Transaction',
          entityId: teamId,
          newValues: {
            imported: created.count,
            skipped: existingPlaidIds.size,
            source: 'PLAID',
            plaidAccountId: bankConnection.plaidAccountId,
            institutionName: bankConnection.institutionName,
          },
        },
      });

      return created;
    });

    logger.info(`Synced ${result.count} new transactions for team ${teamId}`);

    // Run validation on imported transactions (async, don't block response)
    validateImportedTransactions(teamId).catch((error) => {
      logger.error('Failed to validate imported transactions:', error);
    });

    return NextResponse.json({
      success: true,
      imported: result.count,
      skipped: existingPlaidIds.size,
      total: transactionsWithCategories.length,
      message: `Successfully synced ${result.count} new transaction(s)${
        existingPlaidIds.size > 0 ? `, skipped ${existingPlaidIds.size} existing` : ''
      }. Validation running in background.`,
    });
  } catch (error) {
    logger.error('Sync transactions error', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to sync transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
