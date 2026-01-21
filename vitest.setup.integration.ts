import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { PrismaClient } from '@prisma/client'

const execAsync = promisify(exec)

// Generate unique schema name for this test run
const TEST_SCHEMA = `test_ci_${Date.now()}`
let prisma: PrismaClient

// Initialize test database with schema isolation before all tests
beforeAll(async () => {
  console.log('\n🔒 Integration Test Setup')
  console.log('='.repeat(60))

  // Validate database URL (safety check)
  const dbUrl = process.env.DATABASE_URL || ''
  const host = new URL(dbUrl).hostname
  console.log(`📍 Database host: ${host}`)

  // Create isolated schema for this test run
  console.log(`📦 Creating isolated schema: ${TEST_SCHEMA}`)

  // Use DIRECT_URL for schema management (required for DDL operations)
  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  })

  try {
    // Create the test schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${TEST_SCHEMA}"`)
    console.log(`✅ Schema created: ${TEST_SCHEMA}`)

    // Set search_path to use the test schema
    await prisma.$executeRawUnsafe(`SET search_path TO "${TEST_SCHEMA}", public`)
    console.log(`✅ Search path set to: ${TEST_SCHEMA}`)

    // Push schema to the test schema
    console.log('📋 Pushing Prisma schema to test schema...')
    await execAsync(`npx prisma db push --skip-generate --accept-data-loss`, {
      env: {
        ...process.env,
        // Override DATABASE_URL to include schema in search_path
        DATABASE_URL: `${directUrl}${directUrl.includes('?') ? '&' : '?'}schema=${TEST_SCHEMA}`,
      },
    })
    console.log('✅ Schema pushed successfully')

    console.log('='.repeat(60))
    console.log('✅ Integration test environment ready\n')
  } catch (error) {
    console.error('❌ Failed to setup test schema:', error)
    throw error
  }
}, 30000) // 30 second timeout for setup

// Cleanup after all tests
afterAll(async () => {
  console.log('\n🧹 Integration Test Cleanup')
  console.log('='.repeat(60))

  try {
    // Drop the test schema (CASCADE removes all objects)
    console.log(`🗑️  Dropping test schema: ${TEST_SCHEMA}`)
    await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${TEST_SCHEMA}" CASCADE`)
    console.log(`✅ Schema dropped: ${TEST_SCHEMA}`)
  } catch (error) {
    console.error(`❌ Failed to drop test schema ${TEST_SCHEMA}:`, error)
  } finally {
    await prisma.$disconnect()
  }

  console.log('='.repeat(60))
  console.log('✅ Integration test cleanup complete\n')
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
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_clerk_key'
process.env.CLERK_SECRET_KEY = 'test_clerk_secret'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key'
