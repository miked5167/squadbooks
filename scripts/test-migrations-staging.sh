#!/bin/bash
# Test Migrations in Staging Environment
# This script helps you safely test database migrations in staging

echo "🧪 Staging Migration Test Script"
echo "============================================================"

# Check if .env.staging exists
if [ ! -f ".env.staging" ]; then
    echo "❌ .env.staging not found!"
    echo ""
    echo "Create .env.staging with your staging database credentials:"
    echo "  1. Go to Supabase Dashboard → Your Staging Project"
    echo "  2. Settings → Database → Connection String"
    echo "  3. Copy the values to .env.staging"
    echo ""
    exit 1
fi

echo "✓ Found .env.staging"
echo ""

# Backup current .env
if [ -f ".env" ]; then
    echo "📦 Backing up current .env to .env.backup..."
    cp ".env" ".env.backup"
    echo "✓ Backup created"
else
    echo "⚠️  No .env file found (will use .env.staging directly)"
fi
echo ""

# Temporarily use staging env
echo "🔄 Switching to staging environment..."
cp ".env.staging" ".env"
echo "✓ Using staging database"
echo ""

echo "Choose migration method:"
echo "  1. Prisma DB Push (recommended for testing)"
echo "  2. Run Supabase SQL migrations manually"
echo "  3. Run Node.js backfill script (dry-run)"
echo "  4. Run Node.js backfill script (LIVE - limit 100)"
echo "  5. Restore .env and exit"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Running Prisma DB Push..."
        npx prisma db push
        echo ""
        echo "✓ Schema pushed to staging!"
        ;;
    2)
        echo ""
        echo "📋 To run SQL migrations manually:"
        echo "  1. Get staging database password from Supabase dashboard"
        echo "  2. Run each migration file in order:"
        echo ""
        echo "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000001_add_validation_lifecycle_statuses.sql"
        echo "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000002_add_validation_tracking_columns.sql"
        echo "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000003_add_validation_indexes.sql"
        echo "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000004_extend_audit_log_for_validation.sql"
        echo "     psql YOUR_STAGING_DATABASE_URL -f supabase/migrations/20250117000005_backfill_validation_data.sql"
        echo ""
        ;;
    3)
        echo ""
        echo "🧪 Running backfill script (DRY RUN - no changes)..."
        npx tsx scripts/backfill-transaction-validation.ts --dry-run --limit=100
        ;;
    4)
        echo ""
        echo "⚠️  WARNING: This will modify staging database!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "🚀 Running backfill script (LIVE - limit 100)..."
            npx tsx scripts/backfill-transaction-validation.ts --limit=100
        else
            echo "Cancelled."
        fi
        ;;
    5)
        echo "Exiting without running migrations..."
        ;;
    *)
        echo "Invalid choice."
        ;;
esac

echo ""
echo "🔄 Restoring original .env..."
if [ -f ".env.backup" ]; then
    cp ".env.backup" ".env"
    rm ".env.backup"
    echo "✓ Original .env restored"
else
    rm -f ".env"
    echo "✓ .env removed (was using staging only)"
fi

echo ""
echo "✅ Done!"
echo ""
