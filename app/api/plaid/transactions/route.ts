import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/services/plaid/client';
import type { PlaidTransaction, FetchTransactionsResponse } from '@/lib/types/banking';

export const dynamic = 'force-dynamic';

/**
 * Fetch Bank Transactions
 *
 * Retrieves transaction history for a connected bank account.
 *
 * POST /api/plaid/transactions
 * Body: {
 *   accessToken: string,
 *   startDate?: string (YYYY-MM-DD),
 *   endDate?: string (YYYY-MM-DD),
 *   accountId?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, startDate, endDate, accountId } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    // Default to last 90 days if not specified
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    console.log('💰 Fetching transactions...');
    console.log('Date range:', start, 'to', end);
    if (accountId) {
      console.log('Account ID filter:', accountId);
    }

    try {
      const transactionsResponse = await plaidClient.transactionsGet({
        access_token: accessToken,
        start_date: start,
        end_date: end,
        options: {
          count: 500, // Max transactions to fetch
          offset: 0,
          ...(accountId && { account_ids: [accountId] }),
        },
      });

      const plaidTransactions = transactionsResponse.data.transactions;
      const totalTransactions = transactionsResponse.data.total_transactions;

      console.log(`✅ Found ${plaidTransactions.length} transaction(s)`);
      console.log(`Total available: ${totalTransactions}`);

      // Transform to our PlaidTransaction type
      const transactions: PlaidTransaction[] = plaidTransactions.map((tx) => ({
        id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        plaidTransactionId: tx.transaction_id,
        accountId: tx.account_id,
        amount: tx.amount,
        date: tx.date,
        name: tx.name,
        merchantName: tx.merchant_name || undefined,
        pending: tx.pending,
        category: tx.category || undefined,
        paymentChannel: (tx.payment_channel as any) || 'other',
        transactionType: (tx.transaction_type as any) || 'unresolved',
        isoCurrencyCode: tx.iso_currency_code || 'USD',
        // Import tracking (not set yet)
        isImported: false,
      }));

      // Calculate summary
      const totalIncome = transactions
        .filter((t) => t.amount < 0 && !t.pending)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.amount > 0 && !t.pending)
        .reduce((sum, t) => sum + t.amount, 0);

      const pending = transactions.filter((t) => t.pending).length;

      console.log(`💵 Total Income: $${totalIncome.toFixed(2)}`);
      console.log(`💸 Total Expenses: $${totalExpenses.toFixed(2)}`);
      console.log(`⏳ Pending: ${pending}`);

      const result: FetchTransactionsResponse = {
        success: true,
        transactions,
        totalCount: totalTransactions,
      };

      return NextResponse.json(result);

    } catch (txError: any) {
      // Handle PRODUCT_NOT_READY error gracefully
      if (txError.response?.data?.error_code === 'PRODUCT_NOT_READY') {
        console.log('⏳ Transactions not ready yet');
        return NextResponse.json({
          success: true,
          transactions: [],
          totalCount: 0,
          note: 'Transactions are being processed. Please try again in a few moments.',
        });
      }
      throw txError;
    }

  } catch (error: any) {
    console.error('❌ Failed to fetch transactions:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch transactions',
          code: error.response?.data?.error_code || 'UNKNOWN',
          type: error.response?.data?.error_type || 'UNKNOWN',
          details: error.response?.data || error,
        },
      },
      { status: 500 }
    );
  }
}
