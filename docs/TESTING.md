# Testing Guide

This document explains the testing infrastructure for Squadbooks, including the critical separation between unit tests and integration tests.

## Overview

**CRITICAL:** This project has strict separation between unit and integration tests to prevent:

- Accidental data corruption in production databases
- Flaky tests due to shared state
- CI failures from concurrent test runs
- Network dependencies in unit tests

## Test Types

### 1. Unit Tests (Local, No Network)

**Purpose:** Fast, isolated tests that never hit external services.

**Database:** Local PostgreSQL via Docker Compose (port 5433)

**Command:**

```bash
npm run test:unit          # Watch mode
npm run test:unit:run      # Run once
```

**Safety:** Built-in localhost verification - tests will abort if DATABASE_URL is not localhost.

**Environment File:** `.env.test.local`

### 2. Integration Tests (Supabase DEV with Isolation)

**Purpose:** Test real database interactions against Supabase DEV instance.

**Database:** Supabase DEV instance (`db-nncxcgouevvqgyyapslq.supabase.co`)

**Command:**

```bash
npm run test:integration:supabase          # Watch mode
npm run test:integration:supabase:run      # Run once
```

**Safety Features:**

1. **Pre-flight safety check:** Validates database host against allowlist
2. **Schema isolation:** Each test run creates a temporary schema (e.g., `test_ci_1735761234`)
3. **Automatic cleanup:** Schema is dropped after test completion

**Environment File:** `.env.test.integration`

## Safety Mechanisms

### 1. Database Allowlist Guard

**File:** `scripts/validate-integration-db.js`

Before any integration test runs, this script validates:

- ✅ Database host is in the allowlist (`localhost`, `db-nncxcgouevvqgyyapslq.supabase.co`)
- ❌ Database host does NOT contain production indicators (`prod`, `production`)
- ❌ Test will ABORT if validation fails

**Example output:**

```
🔒 Running integration test safety validation...

📍 DATABASE_URL host: db-nncxcgouevvqgyyapslq.supabase.co
✅ Safety check passed: Using allowed test database
   Host: db-nncxcgouevvqgyyapslq.supabase.co
```

### 2. Localhost Verification (Unit Tests)

**File:** `vitest.setup.ts`

Unit tests verify they're using localhost:

```typescript
const host = new URL(process.env.DATABASE_URL).hostname

if (host !== 'localhost' && host !== '127.0.0.1') {
  throw new Error('Unit tests must use localhost database')
}
```

### 3. Schema Isolation (Integration Tests)

**File:** `vitest.setup.integration.ts`

Each integration test run:

1. Creates a unique schema: `test_ci_<timestamp>`
2. Sets PostgreSQL search_path to that schema
3. Pushes Prisma schema to the isolated schema
4. Runs all tests within that schema
5. Drops the schema on completion (CASCADE)

**Benefits:**

- No data collisions between test runs
- Multiple developers can run tests simultaneously
- CI can run parallel test jobs
- Zero impact on `public` schema or production data

## Setup Instructions

### Local Unit Tests

1. **Start Docker Desktop** (if not already running)

2. **Start local PostgreSQL:**

   ```bash
   docker-compose up -d
   ```

3. **Push schema to local database:**

   ```bash
   dotenv -e .env.test.local -- npx prisma db push
   ```

4. **Run unit tests:**
   ```bash
   npm run test:unit
   ```

### Integration Tests

1. **Verify `.env.test.integration` exists** with correct Supabase DEV credentials

2. **Run integration tests:**

   ```bash
   npm run test:integration:supabase:run
   ```

3. **Safety check will run automatically** before tests start

4. **Schema will be created and cleaned up automatically**

## Environment Files

### `.env.test.local` (Unit Tests)

```bash
DATABASE_URL="postgresql://testuser:testpass@localhost:5433/squadbooks_test"
DIRECT_URL="postgresql://testuser:testpass@localhost:5433/squadbooks_test"
```

### `.env.test.integration` (Integration Tests)

```bash
# WARNING: Supabase DEV database - protected by safety guards
DATABASE_URL="postgresql://postgres:PASSWORD@db-nncxcgouevvqgyyapslq.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:PASSWORD@db-nncxcgouevvqgyyapslq.supabase.co:5432/postgres"
TEST_SCHEMA_PREFIX="test_ci"
```

## Adding New Test Databases

To allow integration tests against a new database:

1. Edit `scripts/validate-integration-db.js`
2. Add the database host to `ALLOWED_HOSTS` array
3. Document the addition in this file

## Troubleshooting

### "Unit tests MUST use localhost database"

**Cause:** Unit tests detected non-localhost DATABASE_URL

**Fix:**

1. Ensure Docker Compose is running: `docker-compose up -d`
2. Verify correct env file: `npm run test:unit` uses `.env.test.local`

### "SAFETY CHECK FAILED: Database host not in allowlist"

**Cause:** Integration tests detected unauthorized database

**Fix:**

1. Check `.env.test.integration` has correct Supabase DEV URL
2. If using a new test database, add it to allowlist in `scripts/validate-integration-db.js`

### "Failed to setup test schema"

**Cause:** Schema creation failed in integration tests

**Fix:**

1. Verify `DIRECT_URL` is set (required for DDL operations)
2. Check database permissions allow CREATE SCHEMA
3. Ensure no other process is holding locks on the schema

## CI/CD Integration

For continuous integration:

```yaml
# GitHub Actions example
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: squadbooks_test
        ports:
          - 5433:5432
    steps:
      - run: npm run test:unit:run

  integration-tests:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.SUPABASE_DEV_DATABASE_URL }}
      DIRECT_URL: ${{ secrets.SUPABASE_DEV_DIRECT_URL }}
    steps:
      - run: npm run test:integration:supabase:run
```

## Schema Isolation Details

### Before Each Test Run

```sql
-- Create isolated schema
CREATE SCHEMA IF NOT EXISTS "test_ci_1735761234";

-- Set search path
SET search_path TO "test_ci_1735761234", public;

-- Push Prisma schema (creates all tables in isolated schema)
```

### After Each Test Run

```sql
-- Drop schema and all objects (CASCADE)
DROP SCHEMA IF EXISTS "test_ci_1735761234" CASCADE;
```

### What Gets Isolated

- ✅ All tables
- ✅ All indexes
- ✅ All constraints
- ✅ All data
- ✅ All sequences

### What Stays Shared

- Extensions (uuid-ossp, pg_trgm, etc.)
- Roles and permissions
- Other schemas (including `public`)

## Best Practices

1. **Always use `npm run test:unit` for development** - it's faster and doesn't hit external services

2. **Run integration tests before pushing** - ensures compatibility with Supabase PostgreSQL

3. **Never modify safety guard allowlists without team approval** - prevents accidental production access

4. **Use schema isolation for local integration testing** - set `TEST_SCHEMA_PREFIX` to your username

5. **Clean up failed test schemas manually if needed:**

   ```sql
   -- List all test schemas
   SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'test_ci%';

   -- Drop specific schema
   DROP SCHEMA IF EXISTS "test_ci_1735761234" CASCADE;
   ```

## Summary

| Aspect              | Unit Tests             | Integration Tests                   |
| ------------------- | ---------------------- | ----------------------------------- |
| **Database**        | Local Docker Postgres  | Supabase DEV                        |
| **Port**            | 5433                   | 6543 (pooled) / 5432 (direct)       |
| **Command**         | `npm run test:unit`    | `npm run test:integration:supabase` |
| **Safety**          | Localhost verification | Allowlist + Schema isolation        |
| **Speed**           | Fast (~1s setup)       | Slower (~30s setup)                 |
| **Isolation**       | Full database          | Schema-level                        |
| **CI Ready**        | ✅ Yes                 | ✅ Yes                              |
| **Concurrent Runs** | ⚠️ No (shared DB)      | ✅ Yes (isolated schemas)           |
