# Test Migrations in Staging Environment
# This script helps you safely test database migrations in staging

Write-Host "🧪 Staging Migration Test Script" -ForegroundColor Cyan
Write-Host "=" * 60

# Check if .env.staging exists
if (-not (Test-Path ".env.staging")) {
    Write-Host "❌ .env.staging not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create .env.staging with your staging database credentials:" -ForegroundColor Yellow
    Write-Host "  1. Go to Supabase Dashboard → Your Staging Project"
    Write-Host "  2. Settings → Database → Connection String"
    Write-Host "  3. Copy the values to .env.staging"
    Write-Host ""
    exit 1
}

Write-Host "✓ Found .env.staging" -ForegroundColor Green
Write-Host ""

# Backup current .env
if (Test-Path ".env") {
    Write-Host "📦 Backing up current .env to .env.backup..." -ForegroundColor Yellow
    Copy-Item ".env" ".env.backup" -Force
    Write-Host "✓ Backup created" -ForegroundColor Green
} else {
    Write-Host "⚠️  No .env file found (will use .env.staging directly)" -ForegroundColor Yellow
}
Write-Host ""

# Temporarily use staging env
Write-Host "🔄 Switching to staging environment..." -ForegroundColor Cyan
Copy-Item ".env.staging" ".env" -Force
Write-Host "✓ Using staging database" -ForegroundColor Green
Write-Host ""

Write-Host "Choose migration method:" -ForegroundColor Cyan
Write-Host "  1. Prisma DB Push (recommended for testing)"
Write-Host "  2. Run Supabase SQL migrations manually"
Write-Host "  3. Run Node.js backfill script (dry-run)"
Write-Host "  4. Run Node.js backfill script (LIVE - limit 100)"
Write-Host "  5. Restore .env and exit"
Write-Host ""

$choice = Read-Host "Enter choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🚀 Running Prisma DB Push..." -ForegroundColor Cyan
        npx prisma db push
        Write-Host ""
        Write-Host "✓ Schema pushed to staging!" -ForegroundColor Green
    }
    "2" {
        Write-Host ""
        Write-Host "📋 To run SQL migrations manually:" -ForegroundColor Yellow
        Write-Host "  1. Get staging database password from Supabase dashboard"
        Write-Host "  2. Run each migration file in order:"
        Write-Host ""
        Write-Host "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000001_add_validation_lifecycle_statuses.sql" -ForegroundColor Gray
        Write-Host "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000002_add_validation_tracking_columns.sql" -ForegroundColor Gray
        Write-Host "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000003_add_validation_indexes.sql" -ForegroundColor Gray
        Write-Host "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000004_extend_audit_log_for_validation.sql" -ForegroundColor Gray
        Write-Host "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000005_backfill_validation_data.sql" -ForegroundColor Gray
        Write-Host ""
    }
    "3" {
        Write-Host ""
        Write-Host "🧪 Running backfill script (DRY RUN - no changes)..." -ForegroundColor Cyan
        npx tsx scripts/backfill-transaction-validation.ts --dry-run --limit=100
    }
    "4" {
        Write-Host ""
        Write-Host "⚠️  WARNING: This will modify staging database!" -ForegroundColor Yellow
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq "yes") {
            Write-Host ""
            Write-Host "🚀 Running backfill script (LIVE - limit 100)..." -ForegroundColor Cyan
            npx tsx scripts/backfill-transaction-validation.ts --limit=100
        } else {
            Write-Host "Cancelled." -ForegroundColor Gray
        }
    }
    "5" {
        Write-Host "Exiting without running migrations..." -ForegroundColor Gray
    }
    default {
        Write-Host "Invalid choice." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔄 Restoring original .env..." -ForegroundColor Cyan
if (Test-Path ".env.backup") {
    Copy-Item ".env.backup" ".env" -Force
    Remove-Item ".env.backup"
    Write-Host "✓ Original .env restored" -ForegroundColor Green
} else {
    Remove-Item ".env" -ErrorAction SilentlyContinue
    Write-Host "✓ .env removed (was using staging only)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
Write-Host ""
