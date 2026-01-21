# Staging Testing Guide

This guide walks you through testing the validation lifecycle migrations in a staging environment before applying them to production.

## Prerequisites

- Access to Supabase dashboard
- Node.js and npm installed
- Basic familiarity with command line

## Quick Start (Recommended)

### 1. Create Staging Project in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **"New project"**
3. Fill in:
   - **Name**: `squadbooks-staging` (or similar)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Same as production
   - **Pricing Plan**: Free tier is fine for testing

4. Wait 2-3 minutes for project to provision

### 2. Get Staging Database Credentials

1. In your staging project, go to **Project Settings** (gear icon)
2. Navigate to **Database** section
3. Copy the following:
   - **Connection String** (Pooler mode)
   - **Direct Connection String** (Session mode)
   - Replace `[YOUR-PASSWORD]` with your database password

4. Also copy from **API** section:
   - **Project URL**
   - **anon public key**
   - **service_role key** (⚠️ keep secret!)

### 3. Configure Staging Environment

Edit the `.env.staging` file with your staging credentials:

```bash
# Database (from Step 2)
DATABASE_URL="postgresql://postgres.xxx:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:5432/postgres"

# Supabase API (from Step 2)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Keep other values the same as dev/test mode
```

### 4. Seed Staging Database (Optional)

If you want realistic test data, copy your production schema first:

```bash
# Using the staging helper script (Windows)
.\scripts\test-migrations-staging.ps1

# Or manually (any OS)
cp .env.staging .env
npx prisma db push
npx prisma db seed  # if you have a seed script
```

### 5. Run Migration Test

**Windows:**
```powershell
.\scripts\test-migrations-staging.ps1
```

**Mac/Linux:**
```bash
chmod +x scripts/test-migrations-staging.sh
./scripts/test-migrations-staging.sh
```

The script will:
1. ✅ Backup your current `.env`
2. ✅ Switch to staging environment
3. ✅ Let you choose migration method
4. ✅ Restore your original `.env`

**Choose Option 1** (Prisma DB Push) for the easiest test.

### 6. Verify Migrations

After running migrations, verify the results:

#### Check Status Distribution

```sql
SELECT status, COUNT(*) as count
FROM transactions
GROUP BY status
ORDER BY count DESC;
```

Expected results:
- `VALIDATED` - Previously `APPROVED_AUTOMATIC` transactions
- `EXCEPTION` - Previously `PENDING` or `REJECTED` transactions
- `RESOLVED` - Previously `APPROVED` transactions
- `DRAFT` - Unchanged

#### Check Validation Coverage

```sql
SELECT
  COUNT(*) FILTER (WHERE validation_json IS NOT NULL) as has_validation,
  COUNT(*) FILTER (WHERE validation_json IS NULL) as missing_validation,
  COUNT(*) as total
FROM transactions;
```

Should show 100% coverage (`missing_validation = 0`)

#### Sample Validation Data

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

#### Check Indexes Created

```sql
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
  AND indexname LIKE 'idx_transactions_%'
ORDER BY indexname;
```

Should show 10+ new indexes.

### 7. Test the Backfill Script (Optional)

If you want to test the intelligent Node.js backfill:

```bash
# Dry run (preview only)
npx tsx scripts/backfill-transaction-validation.ts --dry-run --limit=50

# Live run (actually updates staging DB)
npx tsx scripts/backfill-transaction-validation.ts --limit=50
```

This tests the historical validation logic with actual budget context.

## Alternative: Using Supabase Branching

If you have Supabase Pro plan, you can use branching:

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login and Link Project

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Create Preview Branch

```bash
supabase branches create staging-validation-test
```

### 4. Run Migrations on Branch

```bash
supabase db push --preview-branch staging-validation-test
```

### 5. Test, then Merge or Delete

```bash
# If tests pass - merge to main
supabase branches merge staging-validation-test

# If tests fail - delete branch
supabase branches delete staging-validation-test
```

## Manual SQL Migration (Advanced)

If you prefer running SQL directly via `psql`:

1. Install PostgreSQL client tools (`psql`)

2. Get your staging database connection string

3. Run each migration in order:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]/postgres" -f supabase/migrations/20250117000001_add_validation_lifecycle_statuses.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]/postgres" -f supabase/migrations/20250117000002_add_validation_tracking_columns.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]/postgres" -f supabase/migrations/20250117000003_add_validation_indexes.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]/postgres" -f supabase/migrations/20250117000004_extend_audit_log_for_validation.sql
psql "postgresql://postgres:[PASSWORD]@[HOST]/postgres" -f supabase/migrations/20250117000005_backfill_validation_data.sql
```

## Troubleshooting

### "relation does not exist" errors
**Cause**: Running migrations before schema is synced
**Fix**: Run `npx prisma db push` first to create base schema

### "enum value already exists" errors
**Cause**: Re-running migration files
**Fix**: These are safe to ignore - migrations use `IF NOT EXISTS`

### Connection timeouts
**Cause**: Incorrect connection string or network issues
**Fix**:
- Verify connection string from Supabase dashboard
- Check if IP address is whitelisted (Settings → Database → Connection pooling)
- For local testing, try using IPv4 instead of IPv6

### Backfill script errors
**Cause**: Missing transaction data or schema mismatch
**Fix**:
- Make sure migrations 1-4 ran successfully first
- Check that transactions table has required columns
- Use `--dry-run` flag first to preview issues

## What to Look For

### ✅ Success Indicators

1. **Status mapping works**: Old `APPROVED_AUTOMATIC` → new `VALIDATED`
2. **Validation data populated**: All transactions have `validation_json`
3. **Indexes created**: Query performance improved
4. **Audit log working**: Trigger captures changes
5. **No data loss**: Transaction count unchanged
6. **Receipt compliance tracked**: `receipt_status` set correctly
7. **Exception triage works**: `exception_severity` calculated

### ❌ Red Flags

1. **Data loss**: Transaction count decreased
2. **NULL validation_json**: Some transactions missing validation data
3. **Broken references**: Foreign key constraint errors
4. **Performance degradation**: Queries slower than before
5. **Audit log silent**: No entries created when updating transactions

## Next Steps

Once staging tests pass:

1. **Document findings**: Note any issues or edge cases
2. **Fix any problems**: Adjust migrations if needed
3. **Schedule production migration**: Pick a low-traffic time window
4. **Prepare rollback plan**: Review rollback SQL in migrations README
5. **Run in production**: Use same method that worked in staging
6. **Monitor**: Watch error logs and query performance

## Need Help?

- Check `supabase/migrations/README.md` for detailed migration docs
- Review Supabase logs: Project → Database → Logs
- Test queries in Supabase SQL Editor before running scripts
- Ask for help if you hit blockers - better safe than sorry!

---

## Quick Reference

**Helper Scripts:**
- `.\scripts\test-migrations-staging.ps1` (Windows)
- `./scripts/test-migrations-staging.sh` (Mac/Linux)

**Important Files:**
- `.env.staging` - Staging credentials
- `supabase/migrations/` - Migration SQL files
- `scripts/backfill-transaction-validation.ts` - Intelligent backfill

**Verification Queries:**
See "Step 6: Verify Migrations" above for SQL queries to check results.
