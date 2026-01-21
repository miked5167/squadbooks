import { NextResponse } from 'next/server';
import { plaidClient, Products, CountryCode } from '@/lib/services/plaid/client';
import { getHockeyTeamSandboxConfig } from '@/lib/services/plaid/sandbox-config';
import type { CreateLinkTokenResponse } from '@/lib/types/banking';

export const dynamic = 'force-dynamic';

/**
 * Create Plaid Link Token
 *
 * Generates a Link token that the frontend uses to initialize Plaid Link.
 * For sandbox, uses custom hockey team data.
 *
 * POST /api/plaid/create-link-token
 * Body: { userId?: string, teamId?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, teamId } = body;

    console.log('🔗 Creating Plaid Link token...');
    console.log('PLAID_ENV:', process.env.PLAID_ENV);
    console.log('PLAID_CLIENT_ID:', process.env.PLAID_CLIENT_ID?.substring(0, 10) + '...');
    console.log('User ID:', userId || 'demo-user');
    console.log('Team ID:', teamId || 'demo-team');

    // Get custom hockey team config for sandbox
    const sandboxConfig = getHockeyTeamSandboxConfig();

    // Create Link token with custom user configuration
    const response = await plaidClient.linkTokenCreate({
      user: {
        client_user_id: userId || 'demo-user',
        // For sandbox: provide test phone number
        ...(process.env.PLAID_ENV === 'sandbox' && {
          phone_number: '+14151234567', // Plaid test phone number
        }),
      },
      client_name: 'Squadbooks - Hockey Team Finance',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us],
      language: 'en',
      webhook: process.env.NEXT_PUBLIC_APP_URL + '/api/plaid/webhook',
    });

    const linkToken = response.data.link_token;
    const expiration = response.data.expiration;

    console.log('✅ Link token created');
    console.log('Token:', linkToken.substring(0, 20) + '...');
    console.log('Expires:', expiration);

    const result: CreateLinkTokenResponse = {
      link_token: linkToken,
      expiration,
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Failed to create Link token:', error);
    console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);

    return NextResponse.json(
      {
        error: {
          message: error.message || 'Failed to create Link token',
          code: error.response?.data?.error_code || 'UNKNOWN',
          type: error.response?.data?.error_type || 'UNKNOWN',
          details: error.response?.data || error,
        },
      },
      { status: 500 }
    );
  }
}
