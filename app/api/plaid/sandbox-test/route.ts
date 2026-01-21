import { NextResponse } from 'next/server';
import { plaidClient, CountryCode, Products } from '@/lib/services/plaid/client';
import { getHockeyTeamSandboxConfig } from '@/lib/services/plaid/sandbox-config';

export const dynamic = 'force-dynamic';

/**
 * Sandbox Test Endpoint
 *
 * This endpoint tests the complete Plaid sandbox flow:
 * 1. Creates a sandbox public token with custom hockey team data
 * 2. Exchanges it for an access token
 * 3. Fetches account and transaction data
 * 4. Returns the data for verification
 *
 * Usage: GET http://localhost:3000/api/plaid/sandbox-test
 */
export async function GET() {
  try {
    console.log('🏒 Starting Plaid Sandbox Test...');

    // Step 1: Get custom hockey team configuration
    const sandboxConfig = getHockeyTeamSandboxConfig();
    console.log('✅ Hockey team sandbox config created');

    // Step 2: Create sandbox public token with custom user data
    console.log('📝 Creating sandbox public token...');
    const createTokenResponse = await plaidClient.sandboxPublicTokenCreate({
      institution_id: 'ins_109508', // First Platypus Bank (test institution)
      initial_products: [Products.Transactions, Products.Auth],
      options: {
        override_username: sandboxConfig.override_username,
        override_password: sandboxConfig.override_password,
      },
    });

    const publicToken = createTokenResponse.data.public_token;
    console.log('✅ Public token created:', publicToken.substring(0, 20) + '...');

    // Step 3: Exchange public token for access token
    console.log('🔄 Exchanging public token for access token...');
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;
    console.log('✅ Access token obtained');
    console.log('📋 Item ID:', itemId);

    // Step 4: Fetch accounts
    console.log('🏦 Fetching accounts...');
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts;
    console.log(`✅ Found ${accounts.length} account(s)`);

    // Step 5: Fetch transactions (last 90 days)
    console.log('💰 Fetching transactions...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const transactionsResponse = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      options: {
        count: 100,
      },
    });

    const transactions = transactionsResponse.data.transactions;
    console.log(`✅ Found ${transactions.length} transaction(s)`);

    // Calculate totals
    const income = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const expenses = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    console.log('💵 Total Income:', income);
    console.log('💸 Total Expenses:', expenses);
    console.log('✅ Sandbox test completed successfully!');

    // Return comprehensive test results
    return NextResponse.json({
      success: true,
      message: 'Plaid sandbox integration test successful!',
      data: {
        item: {
          id: itemId,
          institution: 'First Platypus Bank (Test)',
        },
        accounts: accounts.map(acc => ({
          id: acc.account_id,
          name: acc.name,
          officialName: acc.official_name,
          type: acc.type,
          subtype: acc.subtype,
          mask: acc.mask,
          balance: {
            current: acc.balances.current,
            available: acc.balances.available,
            currency: acc.balances.iso_currency_code,
          },
        })),
        transactions: {
          total: transactions.length,
          summary: {
            income: income.toFixed(2),
            expenses: expenses.toFixed(2),
            netCashFlow: (income - expenses).toFixed(2),
          },
          recentTransactions: transactions.slice(0, 10).map(t => ({
            id: t.transaction_id,
            date: t.date,
            name: t.name,
            amount: t.amount,
            type: t.amount < 0 ? 'income' : 'expense',
            category: t.category,
            pending: t.pending,
          })),
          allTransactions: transactions.map(t => ({
            id: t.transaction_id,
            date: t.date,
            name: t.name,
            amount: t.amount,
            type: t.amount < 0 ? 'income' : 'expense',
            category: t.category,
            pending: t.pending,
          })),
        },
        testConfig: {
          username: sandboxConfig.override_username,
          accountsConfigured: sandboxConfig.override_accounts.length,
          transactionsConfigured: sandboxConfig.override_accounts[0].transactions.length,
        },
      },
    });

  } catch (error: any) {
    console.error('❌ Sandbox test failed:', error);

    return NextResponse.json({
      success: false,
      error: {
        message: error.message || 'Unknown error occurred',
        code: error.response?.data?.error_code || 'UNKNOWN',
        type: error.response?.data?.error_type || 'UNKNOWN',
        details: error.response?.data || error,
      },
    }, { status: 500 });
  }
}
