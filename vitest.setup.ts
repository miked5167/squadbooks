import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, vi } from 'vitest'

// Initialize test database before all tests
beforeAll(async () => {
  // Unit tests use local PostgreSQL (via Docker Compose)
  // This ensures tests never hit external services (Supabase, production, etc.)
  const dbUrl = process.env.DATABASE_URL || ''
  const host = dbUrl ? new URL(dbUrl).hostname : 'unknown'

  console.log('\n🧪 Unit Test Setup')
  console.log('='.repeat(60))
  console.log(`📍 Database host: ${host}`)

  // CRITICAL: Unit tests must NEVER use Supabase
  if (host && host.includes('.supabase.co')) {
    console.error('❌ ERROR: Unit tests must not use Supabase!')
    console.error(`   Current host: ${host}`)
    console.error('\n   Unit tests can ONLY use local database.')
    console.error('   Supabase is NOT allowed for unit tests.')
    console.error('\n   Use localhost test DB instead:')
    console.error('   1. Start local database: docker-compose up -d')
    console.error('   2. Run tests: npm run test:unit')
    console.error('\n   For Supabase testing, use integration tests:')
    console.error('   npm run test:integration:supabase')
    throw new Error('Unit tests must not use Supabase. Use localhost test DB.')
  }

  // Verify we're using localhost
  if (host !== 'localhost' && host !== '127.0.0.1') {
    console.error('❌ ERROR: Unit tests MUST use localhost database!')
    console.error(`   Current host: ${host}`)
    console.error('   Expected: localhost or 127.0.0.1')
    console.error('\n   Start local database: docker-compose up -d')
    console.error('   Use correct env file: npm run test:unit')
    throw new Error('Unit tests must use localhost database')
  }

  console.log('✅ Using local database (safe for unit tests)')
  console.log('='.repeat(60))
  console.log('')
}, 10000)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}))

// Mock Next.js cache functions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock environment variables for tests
// NOTE: DATABASE_URL is controlled by .env.test - DO NOT override it here
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_clerk_key'
process.env.CLERK_SECRET_KEY = 'test_clerk_secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
