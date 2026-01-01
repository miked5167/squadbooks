#!/usr/bin/env tsx
/**
 * Safe Unit Test Database Bootstrap
 *
 * This script safely initializes the test database for unit tests.
 * It ONLY runs against localhost databases and uses migrations instead of db push.
 *
 * Safety features:
 * - Refuses to run against Supabase or any remote database
 * - Only runs against localhost/127.0.0.1
 * - Uses migrations (no data loss risk)
 * - Fails fast with clear error messages
 */

import { execSync } from 'child_process'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set')
  process.exit(1)
}

// Parse database URL to extract hostname
let hostname: string
try {
  const url = new URL(DATABASE_URL)
  hostname = url.hostname
} catch (error) {
  console.error('❌ ERROR: Invalid DATABASE_URL format')
  console.error(`   DATABASE_URL: ${DATABASE_URL}`)
  process.exit(1)
}

console.log('\n🔧 Unit Test Database Bootstrap')
console.log('='.repeat(60))
console.log(`📍 Database host: ${hostname}`)

// CRITICAL SAFETY CHECK: Only allow localhost
const ALLOWED_HOSTS = ['localhost', '127.0.0.1', '::1']

if (!ALLOWED_HOSTS.includes(hostname)) {
  console.error('\n❌ SAFETY GUARD TRIGGERED!')
  console.error('='.repeat(60))
  console.error('❌ Unit test database bootstrap can ONLY run against localhost!')
  console.error(`   Current host: ${hostname}`)
  console.error(`   Allowed hosts: ${ALLOWED_HOSTS.join(', ')}`)
  console.error('\n   This safety guard prevents accidental data loss on:')
  console.error('   - Supabase databases')
  console.error('   - Production databases')
  console.error('   - Staging databases')
  console.error('   - Any remote database')
  console.error('\n   To run unit tests:')
  console.error('   1. Start local database: docker-compose up -d')
  console.error('   2. Use .env.test.local with localhost DATABASE_URL')
  console.error('   3. Run: npm run test:unit')
  console.error('='.repeat(60))
  process.exit(1)
}

console.log('✅ Safety check passed: Using localhost database')
console.log('')

// Bootstrap database using migrations (safe, no data loss)
try {
  console.log('🔄 Checking migration status...')

  // First, try to apply migrations
  try {
    console.log('   Attempting: prisma migrate deploy')
    console.log('')

    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: process.env,
    })

    console.log('')
    console.log('✅ Database bootstrap complete!')
    console.log('   - All migrations applied')
    console.log('   - Database schema is up to date')
    console.log('   - Safe for unit tests')
    console.log('='.repeat(60))
    console.log('')
  } catch (deployError: any) {
    // If deploy fails due to non-empty database, baseline it
    if (deployError.message && deployError.message.includes('P3005')) {
      console.log('')
      console.log('⚠️  Database schema exists but no migrations recorded')
      console.log('   Running baseline to mark all migrations as applied...')
      console.log('')

      // Baseline marks all existing migrations as applied without running them
      // This is safe for databases that were created with db push
      execSync('npx prisma migrate resolve --applied 20260101192121_add_spend_intent_approvals', {
        stdio: 'inherit',
        env: process.env,
      })

      execSync(
        'npx prisma migrate resolve --applied 20260101192959_add_independent_parent_rep_to_signing_authority',
        {
          stdio: 'inherit',
          env: process.env,
        }
      )

      execSync('npx prisma migrate resolve --applied 20260101202221_add_vendor_whitelisting', {
        stdio: 'inherit',
        env: process.env,
      })

      execSync(
        'npx prisma migrate resolve --applied 20260101203000_add_cheque_image_threshold_and_note',
        {
          stdio: 'inherit',
          env: process.env,
        }
      )

      // Try deploy again after baselining
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: process.env,
      })

      console.log('')
      console.log('✅ Database baselined and bootstrapped!')
      console.log('   - Existing migrations marked as applied')
      console.log('   - Schema is up to date')
      console.log('   - Safe for unit tests')
      console.log('='.repeat(60))
      console.log('')
    } else {
      throw deployError
    }
  }
} catch (error) {
  console.error('\n❌ Database bootstrap failed!')
  console.error('   This might be because:')
  console.error('   1. Migrations have not been created yet (run: npx prisma migrate dev)')
  console.error('   2. Database connection failed (check: docker-compose up -d)')
  console.error('   3. Database schema is incompatible with migrations')
  console.error('')
  console.error('   To reset the test database (LOCALHOST ONLY):')
  console.error('   docker-compose down -v && docker-compose up -d')
  console.error('   npm run test:unit:bootstrap')
  console.error('')
  console.error('   Error details:')
  console.error(error)
  process.exit(1)
}
