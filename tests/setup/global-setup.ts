/**
 * Playwright Global Setup
 * Runs once before all tests to:
 * 1. Seed test data in database
 * 2. Set up test authentication (future: Clerk session tokens)
 */

import { prisma } from '@/lib/prisma'

async function globalSetup() {
  console.log('🔧 Running global test setup...')

  try {
    // Clean up any existing test data
    await cleanupTestData()

    // Seed test data
    await seedTestData()

    console.log('✅ Global setup complete')
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  }
}

/**
 * Clean up test data from previous runs
 */
async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...')

  // Delete test transactions, team, users, categories
  await prisma.transaction.deleteMany({
    where: {
      team: {
        name: 'Test Team - Playwright',
      },
    },
  })

  await prisma.budgetApproval.deleteMany({
    where: {
      team: {
        name: 'Test Team - Playwright',
      },
    },
  })

  await prisma.category.deleteMany({
    where: {
      team: {
        name: 'Test Team - Playwright',
      },
    },
  })

  await prisma.user.deleteMany({
    where: {
      team: {
        name: 'Test Team - Playwright',
      },
    },
  })

  await prisma.team.deleteMany({
    where: {
      name: 'Test Team - Playwright',
    },
  })

  console.log('✅ Cleanup complete')
}

/**
 * Seed test data with known IDs
 */
async function seedTestData() {
  console.log('🌱 Seeding test data...')

  // Create test team
  const team = await prisma.team.create({
    data: {
      id: 'test-team-id',
      name: 'Test Team - Playwright',
      season: '2024-2025',
      budgetTotal: 10000,
      associationName: 'Test Organization',
    },
  })

  console.log('✅ Created test team:', team.id)

  // Create test user (Treasurer)
  const user = await prisma.user.create({
    data: {
      id: 'test-user-id',
      clerkId: 'test-clerk-id',
      email: 'test-treasurer@example.com',
      name: 'Test Treasurer',
      role: 'TREASURER',
      teamId: team.id,
    },
  })

  console.log('✅ Created test user:', user.id)

  // Create test categories
  const categories = await prisma.category.createMany({
    data: [
      {
        id: 'test-category-id',
        name: 'Equipment',
        heading: 'Equipment',
        type: 'EXPENSE',
        teamId: team.id,
      },
      {
        id: 'test-category-income-id',
        name: 'Fundraising',
        heading: 'Fundraising',
        type: 'INCOME',
        teamId: team.id,
      },
    ],
  })

  console.log('✅ Created test categories:', categories.count)

  // Create a test transaction for update/delete tests
  const transaction = await prisma.transaction.create({
    data: {
      id: 'test-transaction-id',
      type: 'EXPENSE',
      amount: 100.0,
      vendor: 'Test Vendor',
      description: 'Test transaction for updates/deletes',
      status: 'APPROVED',
      transactionDate: new Date('2024-01-15'),
      category: {
        connect: { id: 'test-category-id' },
      },
      team: {
        connect: { id: team.id },
      },
      creator: {
        connect: { id: user.id },
      },
    },
  })

  console.log('✅ Created test transaction:', transaction.id)

  console.log('✅ Test data seeded successfully')
}

export default globalSetup
