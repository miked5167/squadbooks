# Database Schema Migration Plan
## Unified Squadbooks + Association Dashboard

---

## ⚠️ CRITICAL CHANGES TO REVIEW

### 1. AssociationTeam.teamId Field Change
**Line 58 in migration-preview.sql:**
```sql
"team_id" TEXT,  -- Changed from VARCHAR(255) to TEXT (CUID type)
```

**Impact:**
- Currently stores external team identifiers (strings)
- Will now store internal Squadbooks Team.id (CUID format like `clxxxx...`)
- **NULLABLE** - legacy teams without Squadbooks integration can remain NULL

**Action Required for Existing Data:**
- Existing `team_id` values in production are NOT valid Team CUIDs
- They are placeholder strings or external identifiers
- When creating dev database, these will be NULL or need to be mapped to actual Team records

---

### 2. New User Cross-Reference Field
**Line 181 in migration-preview.sql:**
```sql
"association_user_id" UUID,  -- New optional field linking team users to association users
```

**Impact:**
- Team users (treasurers) can now optionally link to AssociationUser records
- Enables single sign-on: user can be both team treasurer AND association admin
- **NULLABLE** - most users won't have this link initially

**Foreign Key (Line 525):**
```sql
ALTER TABLE "users" ADD CONSTRAINT "users_association_user_id_fkey"
  FOREIGN KEY ("association_user_id") REFERENCES "association_users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

---

### 3. Unique Constraint on team_id
**Line 363 in migration-preview.sql:**
```sql
CREATE UNIQUE INDEX "association_teams_team_id_key" ON "association_teams"("team_id");
```

**Impact:**
- Each Squadbooks Team can only belong to ONE association
- Prevents duplicate linkage
- **NULL values allowed** (legacy teams without Squadbooks)

---

### 4. Foreign Key: AssociationTeam → Team
**Line 495 in migration-preview.sql:**
```sql
ALTER TABLE "association_teams" ADD CONSTRAINT "association_teams_team_id_fkey"
  FOREIGN KEY ("team_id") REFERENCES "teams"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
```

**Impact:**
- When a Squadbooks Team is deleted, the AssociationTeam.teamId becomes NULL
- Association dashboard can still show team info (cached in teamName, division, etc.)
- Snapshot data remains intact

---

## 📊 EXISTING PRODUCTION DATA

Your current Supabase database has:
- **3 associations**
- **5 association_teams** (with external teamId strings, NOT valid CUIDs)
- **1 association_user**
- **5 team_financial_snapshots**
- **3 alerts**
- **1 report**

**NO Squadbooks team data yet** (teams, users, transactions tables don't exist in production)

---

## 🔄 MIGRATION STRATEGY

### Option A: Fresh Dev Database (RECOMMENDED)
1. Create NEW Supabase project for development
2. Apply full schema from scratch
3. Manually create test data:
   - Create test Squadbooks Teams first
   - Then create AssociationTeams linked to those Teams
   - Create test users, transactions, etc.
4. Test integration fully
5. Plan production migration separately

### Option B: Migrate Production Database
**⚠️ RISKY - Not recommended yet**
1. Would need to:
   - Add new columns (association_user_id, etc.)
   - Update existing team_id values to NULL (since they're not valid CUIDs)
   - Add foreign key constraints
2. **Data loss risk** for existing team_id strings
3. **Downtime** required

---

## 🛠️ STEP-BY-STEP: Create Dev Supabase Project

### Step 1: Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Settings:
   - Name: `squadbooks-dev`
   - Database Password: (generate strong password)
   - Region: Same as production (us-west-2)
   - Pricing Plan: Free tier is fine for dev
4. Wait 2-3 minutes for provisioning

### Step 2: Get Connection Strings
Once provisioned, go to **Project Settings > Database**:

**Pooler Connection (for Prisma migrations):**
```
postgres://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**Direct Connection (for Prisma Client):**
```
postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Step 3: Create .env.dev File
Create file: `C:\Users\miked\Squadbooks\.env.dev`

```env
# Development Supabase Database
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-us-west-2.pooler.supabase.com:5432/postgres"

# Same Clerk config (can use same test account)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Same Supabase config OR create new project for storage too
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### Step 4: Apply Schema to Dev Database
```bash
# Use dev environment variables
set DATABASE_URL=postgresql://postgres.[ref]:[password]@...
set DIRECT_URL=postgresql://postgres.[ref]:[password]@...

# Push schema (creates all tables)
npx prisma db push

# Or use migrate (creates migration history)
npx prisma migrate dev --name initial_schema
```

### Step 5: Verify Schema Applied
```bash
npx prisma studio
```
- Should open http://localhost:5555
- You should see ALL tables from unified schema:
  - associations, association_users, association_teams, etc.
  - teams, users, transactions, categories, etc.

---

## ✅ WHAT TO TEST IN DEV

### 1. Create Test Squadbooks Team
1. Sign in with Clerk test account
2. Go through onboarding flow
3. Creates Team record with CUID
4. Creates User record (treasurer)

### 2. Link Team to Association
Manual SQL in Supabase SQL Editor:
```sql
-- Create test association
INSERT INTO associations (name, abbreviation, season)
VALUES ('Test Hockey Association', 'THA', '2024-2025')
RETURNING id;

-- Get the UUID from above, and get your Team CUID
-- Link them:
INSERT INTO association_teams (
  association_id,
  team_id,  -- This is now the Team CUID
  team_name,
  division,
  season
)
VALUES (
  '[association-uuid]',
  '[team-cuid]',  -- From your Squadbooks team
  'U10 Hawks',
  'U10',
  '2024-2025'
);
```

### 3. Test Snapshot Generation
(Phase 3 task - we'll create this script)
```bash
npm run snapshots:generate
```

Should create TeamFinancialSnapshot records.

### 4. Test Association Dashboard
1. Navigate to `/association` (after Phase 2 migration)
2. Should see team listed
3. Should see snapshot data

---

## 📋 NEXT STEPS

1. **YOU**: Create dev Supabase project and share connection strings
2. **ME**: Create `.env.dev` file with your credentials
3. **ME**: Apply schema with `npx prisma db push`
4. **YOU**: Test with Clerk sign-in + create test team
5. **ME**: Continue Phase 2 (move association dashboard code)

---

## ⏸️ PRODUCTION MIGRATION (DO LATER)

**Do NOT apply to production until:**
- ✅ Dev testing complete
- ✅ Phase 2-7 completed (full integration working)
- ✅ Backup of production database created
- ✅ Migration script tested on production copy
- ✅ Downtime window scheduled (if needed)

**Production migration will require:**
1. SQL script to add new columns safely:
   ```sql
   -- Add new nullable column
   ALTER TABLE users ADD COLUMN association_user_id UUID;

   -- Add index
   CREATE INDEX users_association_user_id_idx ON users(association_user_id);

   -- Add foreign key (after data cleanup)
   ALTER TABLE users ADD CONSTRAINT users_association_user_id_fkey
     FOREIGN KEY (association_user_id) REFERENCES association_users(id)
     ON DELETE SET NULL;
   ```

2. Data migration for existing association_teams:
   ```sql
   -- Set existing team_id to NULL (they're not valid CUIDs)
   UPDATE association_teams SET team_id = NULL WHERE team_id IS NOT NULL;

   -- Later, manually link teams created in Squadbooks
   ```

3. Test on production copy first!

---

**Generated:** 2025-11-25
**Migration File:** migration-preview.sql (607 lines)
**Status:** Ready for dev database testing
