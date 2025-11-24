# Quick Deployment Guide - Run This Now!

## Your Supabase Project
- **Project Ref:** `vynfjwduiehdwbfwyqzh`
- **Project URL:** https://vynfjwduiehdwbfwyqzh.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/vynfjwduiehdwbfwyqzh

## Step 1: Get Your Access Token (30 seconds)

1. Go to: **https://supabase.com/dashboard/account/tokens**
2. Click **"Generate new token"**
3. Name it: **"CLI Deployment"**
4. Click **"Generate token"**
5. **Copy the token** (starts with `sbp_...`)

⚠️ **Save this token** - you'll need it!

## Step 2: Deploy the Edge Function (2 minutes)

### Option A: Using the Batch Script (Easiest)

Open **Command Prompt** (not PowerShell) and run:

```cmd
cd C:\Users\miked\Squadbooks\association-dashboard
deploy-simple.bat
```

When prompted, paste your token and press Enter.

### Option B: Manual Commands

If the script doesn't work, run these commands one by one:

```cmd
cd C:\Users\miked\Squadbooks\association-dashboard

# Set your token (replace with actual token)
set SUPABASE_ACCESS_TOKEN=sbp_your_token_here

# Link the project
npx supabase link --project-ref vynfjwduiehdwbfwyqzh

# Deploy the function
npx supabase functions deploy run-daily-snapshots
```

## Step 3: Configure Environment Variables (2 minutes)

After deployment, configure the Edge Function:

1. Go to: **https://supabase.com/dashboard/project/vynfjwduiehdwbfwyqzh/functions**
2. Click on **"run-daily-snapshots"**
3. Click **"Settings"** tab
4. Add these environment variables:

| Variable Name | Value |
|---------------|-------|
| `SUPABASE_URL` | `https://vynfjwduiehdwbfwyqzh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bmZqd2R1aWVoZHdiZnd5cXpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTE1NywiZXhwIjoyMDc5MjE1MTU3fQ.KZB513MpVfKTBmepBOQ4AhK8Bhd5k9lzSkfRcAsOhOg` |
| `HUDDLEBOOKS_API_BASE_URL` | `https://api.huddlebooks.app/api/v1` |

## Step 4: Test the Deployment (1 minute)

Test the function using curl:

```bash
curl -X POST https://vynfjwduiehdwbfwyqzh.supabase.co/functions/v1/run-daily-snapshots \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bmZqd2R1aWVoZHdiZnd5cXpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTE1NywiZXhwIjoyMDc5MjE1MTU3fQ.KZB513MpVfKTBmepBOQ4AhK8Bhd5k9lzSkfRcAsOhOg" \
  -H "Content-Type: application/json"
```

Expected response (if no teams yet):
```json
{
  "success": true,
  "message": "No active teams to process",
  "totalTeams": 0
}
```

## Step 5: Set Up GitHub Actions (2 minutes)

Add these secrets to your GitHub repository:

1. Go to your GitHub repo settings: **Settings** > **Secrets and variables** > **Actions**
2. Click **"New repository secret"**
3. Add:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_FUNCTION_URL` | `https://vynfjwduiehdwbfwyqzh.supabase.co/functions/v1/run-daily-snapshots` |
| `SUPABASE_SERVICE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5bmZqd2R1aWVoZHdiZnd5cXpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzYzOTE1NywiZXhwIjoyMDc5MjE1MTU3fQ.KZB513MpVfKTBmepBOQ4AhK8Bhd5k9lzSkfRcAsOhOg` |

## Step 6: Test GitHub Actions (1 minute)

1. Go to your GitHub repo
2. Click **Actions** tab
3. Click **"Daily Financial Snapshots"**
4. Click **"Run workflow"**
5. Select branch (main)
6. Click **"Run workflow"**

## Troubleshooting

### Error: "Cannot use automatic login flow"
✅ **Fixed** - Use the batch script or manual commands with token

### Error: "Failed to link project"
- Verify project ref: `vynfjwduiehdwbfwyqzh`
- Check your access token is valid
- Make sure you have access to the project

### Error: "Function already exists"
- This is OK! Run `npx supabase functions deploy run-daily-snapshots` to update it

### Edge Function logs showing errors
1. Go to: https://supabase.com/dashboard/project/vynfjwduiehdwbfwyqzh/functions
2. Click on "run-daily-snapshots"
3. Click "Logs" tab
4. Check for error messages

## Success Checklist

- [ ] Got Supabase access token
- [ ] Deployed Edge Function successfully
- [ ] Configured environment variables in Supabase
- [ ] Tested Edge Function with curl (got 200 response)
- [ ] Added GitHub secrets
- [ ] Manually triggered GitHub Action (green checkmark)

## What's Next?

Once all checkboxes are complete, Phase 1 is fully deployed! 🎉

The workflow will run automatically at **3 AM UTC daily** (8 PM Pacific).

You're ready to move to **Phase 2: Dashboard UI** (building the overview and team list pages).

## Need Help?

If you get stuck, check:
- Edge Function logs in Supabase Dashboard
- GitHub Actions logs
- PHASE1-DEPLOYMENT.md for detailed troubleshooting
