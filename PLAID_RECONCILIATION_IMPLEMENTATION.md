# Plaid Matching + Reconciliation + Policy Exceptions Implementation

## Overview

This implementation provides detective controls that detect payments bypassing HuddleBooks authorization (paid before authorization, missing cheque evidence, unmatched bank transactions).

## Files Created

### 1. Core Implementation

- **lib/plaid/ingest.ts** - Ingests Plaid transactions and upserts to `PlaidBankTransaction`
- **lib/plaid/matcher.ts** - Deterministic matching engine for linking bank transactions to spend intents
- **lib/plaid/reconcile.ts** - Main reconciliation logic with policy exception detection
- **lib/plaid/exceptions.ts** - Policy exception detection rules

### 2. Tests

- **lib/plaid/**tests**/plaid-reconciliation.test.ts** - Comprehensive unit tests

### 3. Database Migration

- **prisma/migrations/20260101_add_plaid_matching/migration.sql** - SQL migration file

### 4. Documentation

- **schema_updates.txt** - Schema update instructions
- **PLAID_RECONCILIATION_IMPLEMENTATION.md** - This file

## Schema Changes Required

### Manual Updates to prisma/schema.prisma

#### 1. PlaidBankTransaction Model (Line ~1322)

Add these fields and relations:

```prisma
model PlaidBankTransaction {
  id                     String              @id @default(cuid())
  teamId                 String              @map("team_id")
  plaidTransactionId     String              @unique @map("plaid_transaction_id") @db.VarChar(255)
  amountCents            Int                 @map("amount_cents")
  currency               String              @default("CAD") @db.VarChar(3)
  postedAt               DateTime            @map("posted_at") @db.Timestamptz(6)
  authorizedAt           DateTime?           @map("authorized_at") @db.Timestamptz(6)
  merchantName           String?             @map("merchant_name") @db.VarChar(255)
  rawName                String?             @map("raw_name") @db.VarChar(500)
  paymentChannel         String?             @map("payment_channel") @db.VarChar(50)
  pending                Boolean             @default(false)
  raw                    Json
  spendIntentId          String?             @map("spend_intent_id")  // NEW FIELD
  createdAt              DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime            @updatedAt @map("updated_at") @db.Timestamptz(6)
  team                   Team                @relation(fields: [teamId], references: [id], onDelete: Cascade)
  spendIntent            SpendIntent?        @relation("PlaidBankTransactionSpendIntent", fields: [spendIntentId], references: [id])  // NEW RELATION
  policyExceptions       PolicyException[]    // NEW RELATION

  @@index([teamId])
  @@index([plaidTransactionId])
  @@index([postedAt])
  @@index([pending])
  @@index([spendIntentId])  // NEW INDEX
  @@map("plaid_bank_transactions")
}
```

#### 2. SpendIntent Model (Line ~1247)

Add this relation after the `transaction` relation:

```prisma
model SpendIntent {
  // ... existing fields ...
  transaction            Transaction?           @relation("SpendIntentTransaction")
  plaidBankTransactions  PlaidBankTransaction[] @relation("PlaidBankTransactionSpendIntent")  // NEW RELATION
  // ... rest of model ...
}
```

#### 3. PolicyException Model (Line ~1364)

Update to support unmatched bank transactions:

```prisma
model PolicyException {
  id                     String                @id @default(cuid())
  transactionId          String?               @map("transaction_id")  // MADE NULLABLE
  plaidBankTransactionId String?               @map("plaid_bank_transaction_id")  // NEW FIELD
  type                   PolicyExceptionType
  severity               AlertSeverity
  details                Json
  detectedAt             DateTime              @map("detected_at") @db.Timestamptz(6)
  resolvedAt             DateTime?             @map("resolved_at") @db.Timestamptz(6)
  createdAt              DateTime              @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt              DateTime              @updatedAt @map("updated_at") @db.Timestamptz(6)
  transaction            Transaction?          @relation(fields: [transactionId], references: [id], onDelete: Cascade)  // MADE NULLABLE
  plaidBankTransaction   PlaidBankTransaction? @relation(fields: [plaidBankTransactionId], references: [id], onDelete: Cascade)  // NEW RELATION

  @@index([transactionId])
  @@index([plaidBankTransactionId])  // NEW INDEX
  @@index([type])
  @@index([severity])
  @@index([resolvedAt])
  @@map("policy_exceptions")
}
```

#### 4. PolicyExceptionType Enum (Line ~1637)

Add new value:

```prisma
enum PolicyExceptionType {
  ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL
  CHEQUE_MISSING_EVIDENCE
  CHEQUE_SINGLE_SIGNATURE_SUSPECTED
  SETTLED_NOT_REVIEWED_OVERDUE
  UNMATCHED_BANK_TRANSACTION  // NEW VALUE
}
```

## Applying the Migration

### Step 1: Update Schema File

Manually apply the schema changes listed above to `prisma/schema.prisma`.

### Step 2: Apply Migration

```bash
# The migration SQL file is ready at:
# prisma/migrations/20260101_add_plaid_matching/migration.sql

# Apply it using:
npx prisma migrate deploy

# Or for development:
npx prisma db push
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

## Running Tests

```bash
# Run the Plaid reconciliation tests
npm run test:unit -- lib/plaid/__tests__/plaid-reconciliation.test.ts
```

## API Usage Examples

### Example 1: Ingest Plaid Transactions

```typescript
import { ingestPlaidTransactions } from '@/lib/plaid/ingest'

const plaidPayload = [
  {
    transaction_id: 'plaid-tx-123',
    amount: 100.5,
    iso_currency_code: 'CAD',
    date: '2025-01-01',
    authorized_date: '2024-12-31',
    name: 'Hockey Equipment Store',
    merchant_name: 'Hockey Pro Shop',
    payment_channel: 'in store',
    pending: false,
  },
]

const result = await ingestPlaidTransactions(teamId, plaidPayload)
// { inserted: 1, updated: 0, errors: [] }
```

### Example 2: Reconcile Bank Transaction (Matched + Exception)

```typescript
import { reconcilePlaidBankTransaction } from '@/lib/plaid/reconcile';

const result = await reconcilePlaidBankTransaction(teamId, 'plaid-tx-123');

// Example result for E-Transfer paid before authorization:
{
  success: true,
  matched: true,
  spendIntentId: 'spend-intent-abc',
  transactionId: 'transaction-xyz',
  exceptions: [
    {
      id: 'exception-001',
      type: 'ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL',
      severity: 'CRITICAL'
    }
  ],
  message: 'Reconciled: SpendIntent spend-intent-abc -> Transaction transaction-xyz (1 exceptions)'
}
```

### Example 3: Reconcile Bank Transaction (Unmatched)

```typescript
import { reconcilePlaidBankTransaction } from '@/lib/plaid/reconcile';

const result = await reconcilePlaidBankTransaction(teamId, 'plaid-tx-999');

// Example result for unmatched transaction:
{
  success: true,
  matched: false,
  message: 'No matching SpendIntent found (amount and date criteria)',
  exceptions: [
    {
      id: 'exception-002',
      type: 'UNMATCHED_BANK_TRANSACTION',
      severity: 'WARNING'
    }
  ]
}
```

## Policy Exception Types Implemented

### 1. ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL (CRITICAL)

**Triggers when:**

- SpendIntent.paymentMethod == E_TRANSFER
- SpendIntent.requiresManualApproval == true
- authorizedAt is null OR bankTxTime < authorizedAt

**Details stored:**

```json
{
  "bankTxTime": "2025-01-01T10:00:00Z",
  "authorizedAt": "2025-01-02T10:00:00Z",
  "approvalsCount": 0,
  "independentRepCount": 0,
  "payeeUserId": "user-123",
  "amountCents": 10000,
  "spendIntentId": "spend-intent-abc",
  "plaidBankTransactionId": "plaid-tx-123",
  "message": "E-transfer paid on 2025-01-01T10:00:00Z before authorization on 2025-01-02T10:00:00Z"
}
```

### 2. CHEQUE_MISSING_EVIDENCE (WARNING/CRITICAL)

**Triggers when:**

- SpendIntent.paymentMethod == CHEQUE
- Cheque clears (bank tx matched)
- Missing: ChequeMetadata OR signer2 OR chequeImageFileId

**Severity:**

- CRITICAL if amountCents >= teamSettings.requireChequeImageThresholdCents
- WARNING otherwise

**Details stored:**

```json
{
  "missingFields": ["signer2", "chequeImageFileId"],
  "thresholdCents": 50000,
  "amountCents": 60000,
  "chequeNumber": "12345",
  "spendIntentId": "spend-intent-def",
  "message": "Cheque cleared but missing required evidence: signer2, chequeImageFileId"
}
```

### 3. UNMATCHED_BANK_TRANSACTION (WARNING)

**Triggers when:**

- No matching SpendIntent found for bank transaction

**Details stored:**

```json
{
  "plaidTransactionId": "plaid-tx-999",
  "amountCents": 99999,
  "postedAt": "2025-01-05T00:00:00Z",
  "merchantName": "Unknown Merchant",
  "rawName": "UNKNOWN MERCHANT",
  "message": "No matching SpendIntent found (amount and date criteria)"
}
```

## Matching Rules (MVP)

The matching engine uses deterministic rules:

1. **Amount Match**: Exact match on amountCents
2. **Date Range**: SpendIntent.createdAt within ±14 days of bankTx.postedAt
3. **Status Filter**: SpendIntent.status in [AUTHORIZED, OUTSTANDING, AUTHORIZATION_PENDING]
4. **Preference**: If multiple candidates, choose the one with createdAt closest BEFORE postedAt

## Test Coverage

The test suite includes:

1. ✅ Ingest Plaid transactions (upsert behavior)
2. ✅ Match bank transaction to spend intent (simple case)
3. ✅ E-transfer paid before authorization creates CRITICAL exception
4. ✅ Cheque settled without ChequeMetadata creates CHEQUE_MISSING_EVIDENCE
5. ✅ Cheque settled with metadata + signer2 + image when required creates NO exception
6. ✅ Unmatched bank tx creates UNMATCHED_BANK_TRANSACTION exception
7. ✅ Exceptions persist even if SpendIntent later becomes authorized

## Implementation Constraints (Met)

- ✅ Deterministic matching only (no fuzzy matching)
- ✅ No UI (backend only)
- ✅ No external API calls in tests (mocked payloads)
- ✅ Existing models used: PlaidBankTransaction, Transaction, SpendIntent, PolicyException
- ✅ Clean, consistent error messages

## Next Steps

1. **Apply Schema Changes**: Manually update `prisma/schema.prisma` as documented above
2. **Run Migration**: `npx prisma db push` or `npx prisma migrate deploy`
3. **Generate Client**: `npx prisma generate`
4. **Run Tests**: `npm run test:unit -- lib/plaid/__tests__/plaid-reconciliation.test.ts`
5. **Verify**: All tests should pass

## Notes

- Exceptions are never deleted automatically (persist for audit trail)
- Matching is deterministic and simple (MVP)
- All amounts stored as positive cents
- Dates normalized to UTC
- Policy exceptions can reference either Transaction or PlaidBankTransaction (or both)
