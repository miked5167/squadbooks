# Phase 1: Daily Snapshot Engine - Deployment Guide

This guide covers deploying the daily snapshot system that pulls financial data from HuddleBooks.

## Prerequisites

Before deploying Phase 1, ensure Phase 0 is complete:
- ✅ Supabase project created
- ✅ Database tables created via Prisma migration
- ✅ Environment variables configured

## What Phase 1 Includes

1. **HuddleBooks API Client** - Fetches team financial data
2. **Health Calculator** - Evaluates team financial health
3. **Supabase Edge Function** - Daily job that processes all teams
4. **GitHub Actions Workflow** - Triggers the job at 3 AM UTC daily

## Deployment Steps

### Step 1: Install Supabase CLI

If you haven't already, install the Supabase CLI:

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via Scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via NPM (all platforms)
npm install -g supabase
```

Verify installation:

```bash
supabase --version
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate with your Supabase account.

### Step 3: Link to Your Supabase Project

```bash
cd association-dashboard
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
1. Go to https://supabase.com/dashboard
2. Open your "association-command-center" project
3. The project ref is in the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

Or get it from your DATABASE_URL:
```
postgresql://postgres.YOUR_PROJECT_REF:[password]@...
```

### Step 4: Deploy the Edge Function

From the `association-dashboard` directory:

```bash
supabase functions deploy run-daily-snapshots
```

You should see output like:

```
Deploying run-daily-snapshots...
Deployed successfully!
Function URL: https://YOUR_PROJECT_REF.supabase.co/functions/v1/run-daily-snapshots
```

**Save this URL!** You'll need it for GitHub secrets.

### Step 5: Set Up Environment Variables for Edge Function

The Edge Function needs access to environment variables. Set them via the Supabase dashboard:

1. Go to **Settings** > **Edge Functions** in your Supabase dashboard
2. Click on `run-daily-snapshots`
3. Add the following environment variables:

```
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
HUDDLEBOOKS_API_BASE_URL=https://api.huddlebooks.app/api/v1
```

To find your service role key:
- Go to **Settings** > **API** in Supabase dashboard
- Copy the `service_role` key (not the `anon` key)

### Step 6: Configure GitHub Repository Secrets

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Where to Find |
|-------------|-------|---------------|
| `SUPABASE_FUNCTION_URL` | `https://YOUR_PROJECT_REF.supabase.co/functions/v1/run-daily-snapshots` | From Step 4 deploy output |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (long JWT token) | Supabase Dashboard > Settings > API > `service_role` key |

### Step 7: Test Manual Trigger

Test the workflow manually before waiting for the cron:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on "Daily Financial Snapshots" workflow
4. Click **Run workflow** button
5. Select the branch (usually `main`)
6. Click **Run workflow**

Monitor the workflow execution:
- ✅ Green check = Success
- ❌ Red X = Failure (check logs)

Expected output (if no teams connected yet):

```
✅ Snapshot job triggered successfully
📊 Job Summary:
  - Total Teams: 0
  - Successful: 0
  - Failed: 0
  - Duration: 156ms
```

### Step 8: Verify Edge Function Logs

Check Edge Function logs in Supabase dashboard:

1. Go to **Edge Functions** in Supabase dashboard
2. Click on `run-daily-snapshots`
3. View **Logs** tab
4. You should see execution logs from your manual trigger

## Testing with Mock Data

To test the snapshot system with mock data:

### Option 1: Create a Test Team Record

Run this SQL in Supabase SQL Editor:

```sql
-- Insert test association
INSERT INTO associations (name, season)
VALUES ('Test Association', '2025-2026')
RETURNING id;

-- Use the returned ID in the next query (replace YOUR_ASSOCIATION_ID)

-- Insert test association team
INSERT INTO association_teams (
  association_id,
  team_id,
  team_name,
  division,
  season,
  api_access_token,
  is_active,
  treasurer_name,
  treasurer_email
)
VALUES (
  'YOUR_ASSOCIATION_ID',  -- Replace with actual UUID from above
  'mock-team-123',
  'Mock Bantam AA Storm',
  'Bantam AA',
  '2025-2026',
  'mock-token-for-testing',  -- This will fail API calls, but tests the flow
  true,
  'John Doe',
  'john@example.com'
);
```

Then trigger the workflow manually. It will attempt to call HuddleBooks API and fail (expected with mock token), but you can verify the error handling works.

### Option 2: Use MockHuddleBooksClient

For local development testing, you can modify the Edge Function temporarily to use the mock client:

```typescript
// In supabase/functions/run-daily-snapshots/index.ts
// Add mock mode check
const useMockData = Deno.env.get('USE_MOCK_DATA') === 'true'
```

Then set `USE_MOCK_DATA=true` in Edge Function environment variables.

## Monitoring

### Daily Execution

The workflow runs automatically at **3 AM UTC** every day. Convert to your timezone:

- **PST/PDT (Pacific):** 7 PM / 8 PM
- **EST/EDT (Eastern):** 10 PM / 11 PM
- **GMT (London):** 3 AM
- **CET (Europe):** 4 AM

### Check Job Status

**GitHub Actions:**
- Go to **Actions** tab in GitHub
- View "Daily Financial Snapshots" workflow runs
- Click on any run to see detailed logs

**Supabase Logs:**
- Go to **Edge Functions** > `run-daily-snapshots` > **Logs**
- View execution logs and errors

### Alert on Failures

The GitHub Actions workflow will:
- ✅ Show green if all teams synced successfully
- ⚠️ Show yellow if some teams failed (but job completed)
- ❌ Show red if the job itself failed

You can add notifications:
- Email notifications via GitHub (Settings > Notifications)
- Slack notifications (add step to workflow)
- Custom webhooks

## Troubleshooting

### Error: "Unauthorized" (401)

**Cause:** Invalid or missing `SUPABASE_SERVICE_KEY`

**Fix:**
1. Verify the service key in GitHub secrets matches Supabase dashboard
2. Ensure you copied the `service_role` key, not the `anon` key
3. Re-deploy the Edge Function after updating environment variables

### Error: "Request timeout" (408)

**Cause:** HuddleBooks API taking too long to respond

**Fix:**
- Check if HuddleBooks API is down
- Verify network connectivity
- Increase timeout in client (currently 30 seconds)

### Error: "Team API error: 401"

**Cause:** Invalid or expired team API access token

**Fix:**
- Verify `api_access_token` in `association_teams` table is valid
- Check if team has revoked access
- Implement token refresh logic (Phase 2 feature)

### Edge Function Not Deploying

**Cause:** Various deployment issues

**Fix:**
```bash
# Re-link project
supabase link --project-ref YOUR_PROJECT_REF

# Try deploying with verbose output
supabase functions deploy run-daily-snapshots --debug

# Verify function exists
supabase functions list
```

### Workflow Not Triggering Automatically

**Cause:** GitHub Actions cron jobs require push to default branch

**Fix:**
1. Ensure `.github/workflows/daily-snapshots.yml` is committed to `main` branch
2. Check repository **Settings** > **Actions** > **General** > Workflow permissions
3. Verify cron syntax: `'0 3 * * *'` (runs at 3:00 AM UTC)

## Next Steps

Once Phase 1 is deployed and working:

- ✅ Teams are being synced daily
- ✅ Snapshots are being stored in database
- ✅ Health status is being calculated
- ✅ Alerts are being generated

You're ready to move to:
- **Phase 2:** Dashboard UI (Overview & Team List pages)

## Support

If you encounter issues:
1. Check Edge Function logs in Supabase dashboard
2. Check GitHub Actions workflow logs
3. Review database tables for data integrity
4. Verify all environment variables are set correctly

For API-related issues, test the HuddleBooks API client locally:

```typescript
// Test script (run with ts-node)
import { HuddleBooksClient } from './src/lib/huddlebooks/client'

const client = new HuddleBooksClient('your-test-token')
const summary = await client.getTeamSummary('team-id')
console.log(summary)
```
