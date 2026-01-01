-- Add spendIntentId to PlaidBankTransaction for matching
ALTER TABLE "plaid_bank_transactions"
ADD COLUMN "spend_intent_id" TEXT;

-- Add index for performance
CREATE INDEX "plaid_bank_transactions_spend_intent_id_idx" ON "plaid_bank_transactions"("spend_intent_id");

-- Add plaidBankTransactionId to PolicyException for unmatched bank transactions
ALTER TABLE "policy_exceptions"
ADD COLUMN "plaid_bank_transaction_id" TEXT,
ALTER COLUMN "transaction_id" DROP NOT NULL;

-- Add index for performance
CREATE INDEX "policy_exceptions_plaid_bank_transaction_id_idx" ON "policy_exceptions"("plaid_bank_transaction_id");

-- Add UNMATCHED_BANK_TRANSACTION to PolicyExceptionType enum
ALTER TYPE "PolicyExceptionType" ADD VALUE IF NOT EXISTS 'UNMATCHED_BANK_TRANSACTION';
