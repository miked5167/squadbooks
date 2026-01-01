/**
 * Safety Guard for Integration Tests
 *
 * This script validates that integration tests are running against an allowed database.
 * It MUST be run before any integration tests to prevent accidental execution against production.
 *
 * CRITICAL: Integration tests (TEST_MODE=integration) MUST use Supabase only.
 * Localhost is NOT allowed for integration tests.
 *
 * Allowed databases for integration tests:
 * - db.nncxcgouevvqgyyapslq.supabase.co (DEV Supabase instance)
 *
 * Any other database will cause the script to abort with an error.
 */

const DATABASE_URL = process.env.DATABASE_URL || ''
const DIRECT_URL = process.env.DIRECT_URL || ''
const TEST_MODE = process.env.TEST_MODE || ''

// Allowlist of permitted database hosts
const ALLOWED_HOSTS = [
  'db.nncxcgouevvqgyyapslq.supabase.co', // DEV Supabase instance
]

// Production database identifiers (blocklist)
const PRODUCTION_INDICATORS = [
  'prod',
  'production',
  // Add your production database host here when known
]

function parseHost(url) {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch (error) {
    console.error('❌ Failed to parse DATABASE_URL:', error.message)
    return null
  }
}

function validateDatabaseUrl() {
  console.log('🔒 Running integration test safety validation...\n')

  if (!DATABASE_URL) {
    console.error('❌ SAFETY CHECK FAILED: DATABASE_URL is not set!')
    console.error('   Integration tests require explicit database configuration.')
    process.exit(1)
  }

  const host = parseHost(DATABASE_URL)
  const directHost = DIRECT_URL ? parseHost(DIRECT_URL) : host

  console.log(`📍 DATABASE_URL host: ${host}`)
  if (directHost && directHost !== host) {
    console.log(`📍 DIRECT_URL host: ${directHost}`)
  }

  // CRITICAL: Integration tests MUST use Supabase only (not localhost)
  if (TEST_MODE === 'integration') {
    console.log(`🔬 Test mode: ${TEST_MODE} (enforcing Supabase-only)`)

    const isSupabase = host && host.includes('.supabase.co')

    if (!isSupabase) {
      console.error('\n❌ SAFETY CHECK FAILED: Integration tests must target Supabase!')
      console.error(`   Attempted host: ${host}`)
      console.error('\n   Integration tests can ONLY run against Supabase instances.')
      console.error('   Localhost is NOT allowed for integration tests.')
      console.error('\n   Allowed Supabase instances:')
      console.error('   - db.nncxcgouevvqgyyapslq.supabase.co (DEV)')
      console.error('\n   For local testing, use unit tests instead:')
      console.error('   npm run test:unit')
      process.exit(1)
    }
  }

  // Check if host is in allowlist
  const isAllowed = ALLOWED_HOSTS.some(
    allowedHost => host === allowedHost || host?.includes(allowedHost)
  )

  if (!isAllowed) {
    console.error('\n❌ SAFETY CHECK FAILED: Database host not in allowlist!')
    console.error(`   Attempted host: ${host}`)
    console.error(`   Allowed hosts: ${ALLOWED_HOSTS.join(', ')}`)
    console.error('\n   Integration tests can ONLY run against:')
    console.error('   - DEV Supabase instance (db.nncxcgouevvqgyyapslq.supabase.co)')
    console.error('\n   If you need to add a new test database, update ALLOWED_HOSTS in:')
    console.error('   scripts/validate-integration-db.js')
    process.exit(1)
  }

  // Check for production indicators
  const hasProductionIndicator = PRODUCTION_INDICATORS.some(
    indicator =>
      host?.toLowerCase().includes(indicator.toLowerCase()) ||
      DATABASE_URL.toLowerCase().includes(indicator.toLowerCase())
  )

  if (hasProductionIndicator) {
    console.error('\n❌ SAFETY CHECK FAILED: Production database detected!')
    console.error(`   Host: ${host}`)
    console.error('   Integration tests MUST NOT run against production databases!')
    process.exit(1)
  }

  console.log('✅ Safety check passed: Using allowed test database')
  console.log(`   Host: ${host}`)
  console.log('')
}

// Run validation
validateDatabaseUrl()
