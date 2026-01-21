# Validation-First Transaction Lifecycle Migrations

This directory contains SQL migrations to implement the validation-first transaction lifecycle model for HuddleBooks.

## Overview

The validation-first model shifts from an approval-centric workflow to a compliance-centric workflow:

- **Old Model:** Transaction → Check threshold → Requires approval? → Approve/Reject
- **New Model:** Transaction → Validate against budget/rules → Compliant? → Auto-validate or Flag exception

## Migration Files

### 1. `20250117000001_add_validation_lifecycle_statuses.sql`
**Purpose:** Add new transaction lifecycle statuses to the enum

**Changes:**
- Adds 5 new status values: `IMPORTED`, `VALIDATED`, `EXCEPTION`, `RESOLVED`, `LOCKED`
- Keeps legacy statuses for backward compatibility
- Safe to run (additive only)

**Status Meanings:**
- `IMPORTED` - Bank feed import, needs categorization/validation
- `VALIDATED` - Passes all compliance checks (auto-approved)
- `EXCEPTION` - Fails validation rules, needs review
- `RESOLVED` - Exception addressed (corrected or overridden with justification)
- `LOCKED` - Season closed, transaction immutable

---

### 2. `20250117000002_add_validation_tracking_columns.sql`
**Purpose:** Add JSONB columns and enums for validation tracking

**New Columns:**
- `validation_json` (JSONB) - Stores complete ValidationResult
  ```json
  {
    "compliant": boolean,
    "violations": [{ "code": string, "severity": string, "message": string }],
    "score": number (0-100),
    "validatedAt": ISO string,
    "checksRun": { "budget": boolean, "receipt": boolean, ... }
  }
  ```

- `exception_severity` (ENUM) - Quick filter for exception triage
  - Values: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - Set based on amount and violation severity

- `resolution_json` (JSONB) - Tracks manual overrides
  ```json
  {
    "type": "REVALIDATE" | "OVERRIDE" | "CORRECT",
    "resolvedBy": string,
    "resolvedAt": ISO string,
    "reason": string,
    "notes": string,
    "correctedFields": { ... }
  }
  ```

- `receipt_status` (ENUM) - Receipt compliance tracking
  - Values: `NONE`, `ATTACHED`, `REQUIRED_MISSING`

**Safe:** Yes (all columns nullable, additive only)

---

### 3. `20250117000003_add_validation_indexes.sql`
**Purpose:** Optimize queries for exception dashboards and reporting

**Indexes Created:**
- `idx_transactions_team_status_exception` - Exception dashboard by team
- `idx_transactions_exception_severity` - Exception triage queue
- `idx_transactions_validation_compliant` - Compliance reporting
- `idx_transactions_validation_violations` - GIN index for violation search
- `idx_transactions_receipt_status` - Missing receipt queries
- `idx_transactions_resolved` - Resolution audit trail
- `idx_transactions_team_exception_date` - Filtered exception lists
- `idx_transactions_locked` - Season closure queries
- `idx_transactions_imported` - Bank sync dashboard
- `idx_transactions_high_value_exceptions` - Prioritization

**Performance Impact:**
- Uses `CREATE INDEX CONCURRENTLY` for zero-downtime creation
- Partial indexes where appropriate (smaller, faster)
- GIN index for JSONB violation searching

---

### 4. `20250117000004_extend_audit_log_for_validation.sql`
**Purpose:** Automatically log validation state changes and overrides

**Features:**
- Creates `audit_logs` table if it doesn't exist
- Adds trigger `trigger_log_validation_changes` on transactions table
- Automatically logs when:
  - Transaction status changes to VALIDATED, EXCEPTION, RESOLVED, or LOCKED
  - `validation_json` is updated
  - `resolution_json` is updated (override applied)
  - `exception_severity` changes

**Audit Actions:**
- `VALIDATE_TRANSACTION` - Transaction auto-validated
- `FLAG_EXCEPTION` - Transaction flagged as exception
- `RESOLVE_EXCEPTION` - Exception resolved (corrected/overridden)
- `LOCK_TRANSACTION` - Transaction locked (season closed)
- `OVERRIDE_EXCEPTION` - Manual override applied
- `UPDATE_TRANSACTION_VALIDATION` - Other validation updates

**Metadata Captured:**
- Old and new values of validation fields
- Vendor, amount, category, date
- Resolution type (REVALIDATE/OVERRIDE/CORRECT)
- Violation count

---

### 5. `20250117000005_backfill_validation_data.sql`
**Purpose:** Populate validation data for existing transactions

**⚠️ WARNING:** This migration modifies existing data. Review carefully.

**Status Mapping Logic:**
```sql
APPROVED_AUTOMATIC → VALIDATED  (was auto-approved, passed implicit validation)
PENDING            → EXCEPTION  (requires review = failed validation)
APPROVED           → RESOLVED   (was manually approved = exception resolved)
REJECTED           → EXCEPTION  (was denied, needs re-review)
DRAFT              → DRAFT      (unchanged, user still editing)
```

**Backfill Steps:**

1. **Map legacy statuses** to new lifecycle statuses
2. **Create validation_json for VALIDATED** transactions (score: 100, compliant: true)
3. **Create validation_json for EXCEPTION** transactions (infer violations from approval_reason)
4. **Create validation_json + resolution_json for RESOLVED** transactions
5. **Set receipt_status** based on receipt_url and amount
6. **Calculate exception_severity** based on amount and violations
7. **Set exception_reason** from validation violations

**What Gets Backfilled:**
- All transactions get `validation_json` with minimal compliance data
- Exceptions get inferred violations (MISSING_RECEIPT, THRESHOLD_BREACH, etc.)
- Resolved transactions get `resolution_json` marking legacy approval
- All records marked with `backfilled: true` and `backfilledAt` timestamp

**Output:**
Prints summary of migration results:
```
Migration complete:
  - VALIDATED transactions: 1,234
  - EXCEPTION transactions: 56
  - RESOLVED transactions: 89
  - Total backfilled: 1,379
```

---

## Running the Migrations

### Option 1: Via Supabase CLI (Recommended)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 2: Via Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste each migration file in order
4. Run each migration sequentially

### Option 3: Via Prisma (if using Prisma migrations)

```bash
# Copy migration SQL to Prisma migrations
# Then run:
npx prisma migrate deploy
```

### Option 4: Direct Database Connection

```bash
# Using psql
psql YOUR_DATABASE_URL -f supabase/migrations/20250117000001_add_validation_lifecycle_statuses.sql
psql YOUR_DATABASE_URL -f supabase/migrations/20250117000002_add_validation_tracking_columns.sql
# ... etc
```

---

## Advanced Backfill (Node.js Script)

For more accurate validation data based on actual budget history, use the Node.js backfill script:

```bash
# Dry run (preview changes)
npx tsx scripts/backfill-transaction-validation.ts --dry-run

# Limit to 100 transactions (testing)
npx tsx scripts/backfill-transaction-validation.ts --dry-run --limit=100

# Process specific team
npx tsx scripts/backfill-transaction-validation.ts --dry-run --team-id=abc123

# Actually run the backfill (LIVE)
npx tsx scripts/backfill-transaction-validation.ts

# Run with progress monitoring
npx tsx scripts/backfill-transaction-validation.ts --limit=500
```

**What the Script Does:**
1. Finds all transactions without `validation_json`
2. For each transaction:
   - Retrieves the budget that was active at transaction date
   - Retrieves envelopes that were active at transaction date
   - Runs the actual validation logic (`computeValidation()`)
   - Stores accurate validation results
   - Updates status if needed (APPROVED_AUTOMATIC → VALIDATED, PENDING → EXCEPTION)
   - Calculates proper exception severity
3. Provides detailed progress logging
4. Prints summary statistics

**Advantages over SQL backfill:**
- Uses actual validation logic (not inferred)
- Considers historical budget state
- More accurate violation codes
- Proper compliance scoring

**Disadvantages:**
- Slower (requires Node.js runtime)
- More resource intensive
- Requires application code to be deployed

---

## Rollback Plan

If you need to rollback the migrations:

### Rollback Status Changes
```sql
-- Revert status mapping
UPDATE transactions
SET status = CASE
  WHEN status = 'VALIDATED' AND validation_json->>'legacyStatus' = 'APPROVED_AUTOMATIC' THEN 'APPROVED_AUTOMATIC'
  WHEN status = 'EXCEPTION' AND validation_json->>'legacyStatus' = 'PENDING_OR_REJECTED' THEN 'PENDING'
  WHEN status = 'RESOLVED' AND validation_json->>'legacyStatus' = 'APPROVED' THEN 'APPROVED'
  ELSE status
END
WHERE validation_json->>'backfilled' = 'true';
```

### Remove New Columns (if needed)
```sql
ALTER TABLE transactions DROP COLUMN IF EXISTS validation_json;
ALTER TABLE transactions DROP COLUMN IF EXISTS exception_severity;
ALTER TABLE transactions DROP COLUMN IF EXISTS resolution_json;
ALTER TABLE transactions DROP COLUMN IF EXISTS receipt_status;
```

### Drop Indexes
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_team_status_exception;
DROP INDEX CONCURRENTLY IF EXISTS idx_transactions_exception_severity;
-- ... etc
```

**⚠️ Note:** You cannot remove enum values in PostgreSQL. New status values will remain in the enum even after rollback.

---

## Verification Queries

After running migrations, verify the results:

### Check Status Distribution
```sql
SELECT status, COUNT(*) as count
FROM transactions
GROUP BY status
ORDER BY count DESC;
```

### Check Validation Coverage
```sql
SELECT
  COUNT(*) FILTER (WHERE validation_json IS NOT NULL) as has_validation,
  COUNT(*) FILTER (WHERE validation_json IS NULL) as missing_validation,
  COUNT(*) as total
FROM transactions;
```

### Check Exception Severity Distribution
```sql
SELECT exception_severity, COUNT(*) as count
FROM transactions
WHERE status = 'EXCEPTION'
GROUP BY exception_severity
ORDER BY
  CASE exception_severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;
```

### Check Receipt Compliance
```sql
SELECT receipt_status, COUNT(*) as count
FROM transactions
WHERE type = 'EXPENSE'
GROUP BY receipt_status;
```

### Sample Validation Data
```sql
SELECT
  id,
  vendor,
  amount,
  status,
  validation_json->>'compliant' as compliant,
  jsonb_array_length(validation_json->'violations') as violation_count,
  validation_json->>'score' as score,
  exception_severity,
  receipt_status
FROM transactions
WHERE validation_json IS NOT NULL
LIMIT 10;
```

---

## Performance Considerations

- **Index Creation:** Uses `CONCURRENTLY` to avoid locking (may take longer but safer)
- **Backfill Size:** If you have millions of transactions, consider:
  - Running backfill in batches (use `--limit`)
  - Running during off-peak hours
  - Monitoring database CPU/memory usage
- **GIN Index:** The violations GIN index can be large. Monitor disk space.

---

## Questions?

If you encounter issues:
1. Check the Supabase logs for detailed error messages
2. Verify your PostgreSQL version supports all features (v12+)
3. Ensure you have necessary permissions (CREATE, ALTER, INDEX)
4. Test on a staging environment first

---

## Migration Summary

| Migration | Safe? | Reversible? | Time Est. |
|-----------|-------|-------------|-----------|
| #1 Status Enum | ✅ Yes | ⚠️ Partial | < 1s |
| #2 Add Columns | ✅ Yes | ✅ Yes | < 1s |
| #3 Add Indexes | ✅ Yes | ✅ Yes | 10-60s |
| #4 Audit Trigger | ✅ Yes | ✅ Yes | < 1s |
| #5 Backfill Data | ⚠️ Updates data | ✅ Yes | 5-60s |

**Total Estimated Time:** 30 seconds - 2 minutes (depending on transaction count)
