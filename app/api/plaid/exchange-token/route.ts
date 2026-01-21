import { NextResponse } from 'next/server';
import { plaidClient } from '@/lib/services/plaid/client';
import type { BankAccount, ExchangeTokenResponse } from '@/lib/types/banking';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Exchange Public Token for Access Token
 *
 * After user successfully connects their bank via Plaid Link,
 * exchange the public token for a permanent access token.
 *
 * POST /api/plaid/exchange-token
 * Body: { publicToken: string, metadata?: PlaidLinkOnSuccessMetadata }
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { publicToken, metadata } = body;

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Public token is required' },
        { status: 400 }
      );
    }

    console.log('🔄 Exchanging public token for access token...');

    // Step 1: Exchange public token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    console.log('✅ Access token obtained');
    console.log('Item ID:', itemId);

    // Step 2: Fetch account details
    console.log('🏦 Fetching account details...');
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const plaidAccounts = accountsResponse.data.accounts;
    console.log(`✅ Found ${plaidAccounts.length} account(s)`);

    // Step 3: Transform to our BankAccount type
    const accounts: BankAccount[] = plaidAccounts.map((acc) => ({
      id: `ba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      plaidAccountId: acc.account_id,
      institutionId: metadata?.institution?.institution_id || 'unknown',
      institutionName: metadata?.institution?.name || 'Unknown Bank',
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

    // Step 4: Save bank connection to database
    if (accounts.length > 0) {
      const primaryAccount = accounts[0];
      console.log('💾 Saving bank connection to database...');
      await prisma.bankConnection.upsert({
        where: { teamId_itemId: { teamId: user.teamId, itemId } },
        create: {
          teamId: user.teamId,
          accessToken,
          itemId,
          plaidAccountId: primaryAccount.plaidAccountId,
          institutionName: primaryAccount.institutionName,
          accountName: primaryAccount.accountName,
          accountMask: primaryAccount.mask,
          accountType: primaryAccount.accountType,
          lastSyncedAt: new Date(),
          isActive: true,
        },
        update: {
          accessToken,
          plaidAccountId: primaryAccount.plaidAccountId,
          institutionName: primaryAccount.institutionName,
          accountName: primaryAccount.accountName,
          accountMask: primaryAccount.mask,
          accountType: primaryAccount.accountType,
          lastSyncedAt: new Date(),
          isActive: true,
        },
      });
      console.log('✅ Bank connection saved to database');
    }

    accounts.forEach((acc) => {
      console.log(`  - ${acc.accountName} (${acc.accountType}): $${acc.currentBalance}`);
    });

    const result: ExchangeTokenResponse = {
      success: true,
      itemId,
      accounts,
    };

    // Note: Access token should be encrypted before sending to frontend
    // For demo purposes, we'll include it (but frontend should encrypt it)
    return NextResponse.json({
      ...result,
      accessToken, // TODO: Encrypt this in production
    });

  } catch (error: any) {
    console.error('❌ Token exchange failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message || 'Failed to exchange token',
          code: error.response?.data?.error_code || 'UNKNOWN',
          type: error.response?.data?.error_type || 'UNKNOWN',
          details: error.response?.data || error,
        },
      },
      { status: 500 }
    );
  }
}
