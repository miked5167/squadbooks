# Supabase Edge Function Deployment Script
# This script helps deploy the run-daily-snapshots Edge Function

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Supabase Edge Function Deployment Helper" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Access Token
Write-Host "Step 1: Access Token" -ForegroundColor Yellow
Write-Host "You need a Supabase access token to deploy." -ForegroundColor White
Write-Host ""
Write-Host "Get your token here: https://supabase.com/dashboard/account/tokens" -ForegroundColor Green
Write-Host "Click 'Generate new token', name it 'CLI Deployment', and copy it." -ForegroundColor White
Write-Host ""
$accessToken = Read-Host "Paste your access token here (starts with sbp_)"

if ([string]::IsNullOrWhiteSpace($accessToken)) {
    Write-Host "Error: No token provided. Exiting." -ForegroundColor Red
    exit 1
}

# Set environment variable
$env:SUPABASE_ACCESS_TOKEN = $accessToken
Write-Host "✓ Token set" -ForegroundColor Green
Write-Host ""

# Step 2: Get Project Reference
Write-Host "Step 2: Project Reference" -ForegroundColor Yellow
Write-Host "Find your project ref in the Supabase dashboard URL:" -ForegroundColor White
Write-Host "https://supabase.com/dashboard/project/YOUR_PROJECT_REF" -ForegroundColor Gray
Write-Host ""
Write-Host "Or from your DATABASE_URL in .env.local:" -ForegroundColor White
Write-Host "postgresql://postgres.YOUR_PROJECT_REF:..." -ForegroundColor Gray
Write-Host ""
$projectRef = Read-Host "Enter your project reference"

if ([string]::IsNullOrWhiteSpace($projectRef)) {
    Write-Host "Error: No project ref provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Project ref: $projectRef" -ForegroundColor Green
Write-Host ""

# Step 3: Link Project
Write-Host "Step 3: Linking project..." -ForegroundColor Yellow
npx supabase link --project-ref $projectRef

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to link project. Check your project ref." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Project linked successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy Edge Function
Write-Host "Step 4: Deploying Edge Function..." -ForegroundColor Yellow
Write-Host "This may take a minute..." -ForegroundColor White
npx supabase functions deploy run-daily-snapshots

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to deploy Edge Function." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Edge Function deployed successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Get Function URL
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Deployment Complete!" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Edge Function URL:" -ForegroundColor Yellow
Write-Host "https://$projectRef.supabase.co/functions/v1/run-daily-snapshots" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Configure environment variables in Supabase Dashboard:" -ForegroundColor White
Write-Host "   - Go to: https://supabase.com/dashboard/project/$projectRef/functions" -ForegroundColor Gray
Write-Host "   - Click on 'run-daily-snapshots'" -ForegroundColor Gray
Write-Host "   - Add environment variables (see PHASE1-DEPLOYMENT.md)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Add GitHub secrets:" -ForegroundColor White
Write-Host "   - SUPABASE_FUNCTION_URL: https://$projectRef.supabase.co/functions/v1/run-daily-snapshots" -ForegroundColor Gray
Write-Host "   - SUPABASE_SERVICE_KEY: (get from Supabase Dashboard > Settings > API)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Test the function with GitHub Actions workflow" -ForegroundColor White
Write-Host ""
