import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

if (!process.env.PLAID_CLIENT_ID || !process.env.PLAID_SECRET) {
  throw new Error('Missing required Plaid environment variables');
}

// Determine environment - force sandbox for safety
const plaidEnv = (process.env.PLAID_ENV || 'sandbox').toLowerCase();
const basePath = plaidEnv === 'sandbox'
  ? PlaidEnvironments.sandbox
  : plaidEnv === 'production'
  ? PlaidEnvironments.production
  : PlaidEnvironments.sandbox;

console.log('🏦 Plaid Client Configuration:');
console.log('  Environment:', plaidEnv);
console.log('  Base Path:', basePath);

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export { PlaidEnvironments };
export { CountryCode, Products } from 'plaid';
