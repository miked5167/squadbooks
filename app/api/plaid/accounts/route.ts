import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/services/plaid/client';
import type { BankAccount, FetchAccountsResponse } from '@/lib/types/banking';

export const dynamic = 'force-dynamic';

/**
 * Fetch Bank Accounts
 *
 * Retrieves account information for a connected bank.
 *
 * POST /api/plaid/accounts
 * Body: { accessToken: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400 }
      );
    }

    console.log('🏦 Fetching bank accounts...');

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;
    const item = accountsResponse.data.item;

    console.log(`✅ Found ${plaidAccounts.length} account(s)`);
    console.log('Institution ID:', item.institution_id);

    // Transform to our BankAccount type
    const accounts: BankAccount[] = plaidAccounts.map((acc) => ({
      id: `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      plaidAccountId: acc.account_id,
      institutionId: item.institution_id || 'unknown',
      institutionName: 'Connected Bank', // Would need separate API call to get institution name
      accountName: acc.name || acc.official_name || 'Unknown Account',
      accountType: (acc.type as any) || 'checking',
      accountSubtype: acc.subtype || '',
      mask: acc.mask || '****',
      currentBalance: acc.balances.current || 0,
      availableBalance: acc.balances.available,
      currency: acc.balances.iso_currency_code || 'USD',
      connectedAt: new Date(),
      lastSyncedAt: new Date(),
      isActive: true,
    }));

    const result: FetchAccountsResponse = {
      success: true,
      accounts,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Failed to fetch accounts:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to fetch accounts',
          code: error.response?.data?.error_code || 'UNKNOWN',
          type: error.response?.data?.error_type || 'UNKNOWN',
          details: error.response?.data || error,
        },
      },
      { status: 500 }
    );
  }
}
