// prisma/seed-production-scale.ts

/**
 * ============================================
 * PRODUCTION-SCALE SEED SCRIPT FOR PERFORMANCE TESTING
 * ============================================
 *
 * Creates realistic production-scale data for performance validation:
 * - 50 teams in test association
 * - ~400 transactions per team (20,000 total)
 * - 70% receipt coverage (realistic distribution)
 * - Date range: Past 12 months
 *
 * Purpose: Address STATE.md blocker "Performance baseline tested with 5 teams (345 transactions) vs. target 50 teams (20K transactions)"
 *
 * Usage: npm run seed:prod
 */

import {
  PrismaClient,
  UserRole,
  TransactionType,
  TransactionStatus,
  CategoryType,
  TeamType,
  AgeDivision,
  CompetitiveLevel,
  PlayerStatus,
  BankAccountType,
} from '@prisma/client'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

// ============================================
// CONSTANTS
// ============================================

const PROD_SEED_PREFIX = 'prod_seed_'
const PROD_EMAIL_DOMAIN = '@prod-seed.huddlebooks.app'
const PROD_ASSOCIATION_NAME = 'Production Scale Test Association'
const PROD_SEASON = '2025-2026'

// Dates (past 12 months from now)
const NOW = new Date()
const TWELVE_MONTHS_AGO = new Date(NOW)
TWELVE_MONTHS_AGO.setMonth(TWELVE_MONTHS_AGO.getMonth() - 12)

// Target metrics
const TEAM_COUNT = 50
const TRANSACTIONS_PER_TEAM = 400
const RECEIPT_COVERAGE = 0.7 // 70% have receipts

// Fake data pools (reuse from seed-demo.ts)
const FIRST_NAMES = [
  'Liam',
  'Noah',
  'Oliver',
  'Elijah',
  'James',
  'Emma',
  'Olivia',
  'Ava',
  'Sophia',
  'Charlotte',
  'Ethan',
  'Logan',
  'Mason',
  'Lucas',
  'Benjamin',
]

const LAST_NAMES = [
  'Smith',
  'Brown',
  'Tremblay',
  'Martin',
  'Roy',
  'Lee',
  'Wilson',
  'Clark',
  'Nguyen',
  'Hall',
  'Walker',
  'Young',
  'Patel',
  'Singh',
  'Campbell',
]

const VENDORS = {
  arenas: ['Magna Centre', 'Ray Twinney Complex', 'Canlan Sports York'],
  retail: ['Canadian Tire', 'Sport Chek', 'Pro Hockey Life'],
  gas: ['Petro-Canada', 'Esso', 'Shell'],
  hotels: ['Holiday Inn Express', 'Hampton Inn', 'Fairfield Inn & Suites'],
}

const BUDGET_CATEGORIES = [
  'Ice Time & Facilities',
  'Equipment & Jerseys',
  'Travel & Tournaments',
  'Coaching & Officials',
  'League & Registration',
  'Team Operations',
]

// ============================================
// UTILITY FUNCTIONS
// ============================================

let clerkIdCounter = 1

function generateClerkId(): string {
  return `${PROD_SEED_PREFIX}${String(clerkIdCounter++).padStart(6, '0')}`
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime()
  const endTime = end.getTime()
  const rand = startTime + Math.random() * (endTime - startTime)
  return new Date(rand)
}

function receiptUrl(teamCode: string, date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 8)
  return `https://storage.huddlebooks.app/receipts/${teamCode}/${yyyy}_${mm}_${dd}_${rand}.pdf`
}

function getColorForHeading(heading: string): string {
  const colorMap: Record<string, string> = {
    'Ice Time & Facilities': '#0EA5E9',
    'Equipment & Jerseys': '#10B981',
    'Coaching & Officials': '#F59E0B',
    'Travel & Tournaments': '#8B5CF6',
    'League & Registration': '#EC4899',
    'Team Operations': '#06B6D4',
    'Fundraising & Income': '#14B8A6',
  }
  return colorMap[heading] || '#3B82F6'
}

// ============================================
// CLEANUP
// ============================================

async function cleanupProductionSeed() {
  console.log('🧹 Cleaning up existing production seed data...')

  const prodAssociation = await prisma.association.findFirst({
    where: { name: PROD_ASSOCIATION_NAME },
  })

  if (!prodAssociation) {
    console.log('   ✓ No existing production seed data found\n')
    return
  }

  // Delete in dependency order (same pattern as seed-demo.ts)
  const associationTeams = await prisma.associationTeam.findMany({
    where: { associationId: prodAssociation.id },
    select: { teamId: true },
  })
  const teamIds = associationTeams.map(at => at.teamId)

  if (teamIds.length > 0) {
    // Delete transactions first
    const delTxs = await prisma.transaction.deleteMany({
      where: { teamId: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${delTxs.count} transactions`)

    // Delete categories
    const delCats = await prisma.category.deleteMany({
      where: { teamId: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${delCats.count} categories`)

    // Delete players
    const delPlayers = await prisma.player.deleteMany({
      where: { teamId: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${delPlayers.count} players`)

    // Delete families
    const delFamilies = await prisma.family.deleteMany({
      where: { teamId: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${delFamilies.count} families`)

    // Delete team settings
    await prisma.teamSettings.deleteMany({
      where: { teamId: { in: teamIds } },
    })

    // Delete bank accounts
    await prisma.bankAccount.deleteMany({
      where: { teamId: { in: teamIds } },
    })

    // Delete budget allocations
    await prisma.budgetAllocation.deleteMany({
      where: { teamId: { in: teamIds } },
    })

    // Delete users
    const delUsers = await prisma.user.deleteMany({
      where: { teamId: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${delUsers.count} users`)

    // Delete association teams
    await prisma.associationTeam.deleteMany({
      where: { associationId: prodAssociation.id },
    })

    // Delete teams
    await prisma.team.deleteMany({
      where: { id: { in: teamIds } },
    })
    console.log(`   ✓ Deleted ${teamIds.length} teams`)
  }

  // Delete association users
  const delAssocUsers = await prisma.associationUser.deleteMany({
    where: { associationId: prodAssociation.id },
  })
  console.log(`   ✓ Deleted ${delAssocUsers.count} association users`)

  // Delete association
  await prisma.association.delete({
    where: { id: prodAssociation.id },
  })
  console.log('   ✓ Deleted production seed association\n')
}

// ============================================
// SEED ASSOCIATION
// ============================================

async function seedAssociation() {
  const adminClerkId = generateClerkId()
  const adminEmail = `admin${PROD_EMAIL_DOMAIN}`

  const association = await prisma.association.create({
    data: {
      name: PROD_ASSOCIATION_NAME,
      abbreviation: 'PSTA',
      provinceState: 'Ontario',
      country: 'Canada',
      season: PROD_SEASON,
      createdAt: TWELVE_MONTHS_AGO,
      updatedAt: NOW,
    },
  })

  const adminUser = await prisma.associationUser.create({
    data: {
      associationId: association.id,
      clerkUserId: adminClerkId,
      email: adminEmail,
      name: 'Production Seed Admin',
      role: 'association_admin',
      lastLoginAt: NOW,
      createdAt: TWELVE_MONTHS_AGO,
    },
  })

  return { association, adminUser }
}

// ============================================
// SEED TEAM
// ============================================

async function seedTeam(associationId: string, teamIndex: number) {
  const teamCode = `prod-team-${String(teamIndex).padStart(3, '0')}`
  const ageDivisions = [
    AgeDivision.U9,
    AgeDivision.U11,
    AgeDivision.U13,
    AgeDivision.U15,
    AgeDivision.U18,
  ]
  const competitiveLevels = [CompetitiveLevel.A, CompetitiveLevel.AA, CompetitiveLevel.AAA]

  // Create team
  const team = await prisma.team.create({
    data: {
      name: `Team ${teamIndex}`,
      teamType: TeamType.REPRESENTATIVE,
      ageDivision: randomChoice(ageDivisions),
      competitiveLevel: randomChoice(competitiveLevels),
      season: PROD_SEASON,
      budgetTotal: randomInt(30000, 60000),
      seasonStartDate: TWELVE_MONTHS_AGO,
      seasonEndDate: NOW,
      associationName: PROD_ASSOCIATION_NAME,
      createdAt: TWELVE_MONTHS_AGO,
      updatedAt: NOW,
    },
  })

  // Create treasurer
  const treasurer = await prisma.user.create({
    data: {
      teamId: team.id,
      clerkId: generateClerkId(),
      email: `${teamCode}.treasurer${PROD_EMAIL_DOMAIN}`,
      name: `${randomChoice(FIRST_NAMES)} ${randomChoice(LAST_NAMES)}`,
      role: UserRole.TREASURER,
      createdAt: TWELVE_MONTHS_AGO,
    },
  })

  // Link team to association
  await prisma.associationTeam.create({
    data: {
      associationId,
      teamId: team.id,
      teamName: team.name,
      division: team.ageDivision,
      season: PROD_SEASON,
      isActive: true,
      treasurerName: treasurer.name,
      treasurerEmail: treasurer.email,
      connectedAt: TWELVE_MONTHS_AGO,
      lastSyncedAt: NOW,
      createdAt: TWELVE_MONTHS_AGO,
      updatedAt: NOW,
    },
  })

  // Create team settings
  await prisma.teamSettings.create({
    data: {
      teamId: team.id,
      dualApprovalEnabled: true,
      dualApprovalThreshold: 200.0,
      receiptRequired: true,
      allowSelfReimbursement: false,
      duplicateDetectionEnabled: true,
      duplicateDetectionWindow: 7,
      allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
    },
  })

  // Create bank account
  await prisma.bankAccount.create({
    data: {
      teamId: team.id,
      accountName: `${team.name} Operating Account`,
      accountType: BankAccountType.CHECKING,
      lastFour: String(randomInt(1000, 9999)),
      currentBalance: randomInt(5000, 25000),
      isActive: true,
      createdAt: TWELVE_MONTHS_AGO,
    },
  })

  // Create categories
  const categories = []
  for (const categoryName of BUDGET_CATEGORIES) {
    const category = await prisma.category.create({
      data: {
        teamId: team.id,
        name: categoryName,
        heading: categoryName,
        color: getColorForHeading(categoryName),
        type: CategoryType.EXPENSE,
        sortOrder: categories.length,
        isDefault: true,
        isActive: true,
        createdAt: TWELVE_MONTHS_AGO,
      },
    })
    categories.push(category)
  }

  // Add income category
  const incomeCategory = await prisma.category.create({
    data: {
      teamId: team.id,
      name: 'Registration Fees',
      heading: 'Fundraising & Income',
      color: getColorForHeading('Fundraising & Income'),
      type: CategoryType.INCOME,
      sortOrder: categories.length,
      isDefault: true,
      isActive: true,
      createdAt: TWELVE_MONTHS_AGO,
    },
  })
  categories.push(incomeCategory)

  // Create transactions in batches (createMany for performance)
  const transactions = []
  for (let i = 0; i < TRANSACTIONS_PER_TEAM; i++) {
    const isIncome = Math.random() < 0.15 // 15% income, 85% expense
    const category = isIncome
      ? incomeCategory
      : randomChoice(categories.filter(c => c.type === CategoryType.EXPENSE))
    const amount = randomInt(10, 2000)
    const transactionDate = randomDateBetween(TWELVE_MONTHS_AGO, NOW)
    const hasReceipt = Math.random() < RECEIPT_COVERAGE

    transactions.push({
      teamId: team.id,
      type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
      status: TransactionStatus.APPROVED,
      amount,
      categoryId: category.id,
      vendor: isIncome
        ? 'Registration Fees'
        : randomChoice([...VENDORS.arenas, ...VENDORS.retail, ...VENDORS.gas, ...VENDORS.hotels]),
      description: `${isIncome ? 'Income' : 'Expense'} transaction ${i + 1}`,
      transactionDate,
      receiptUrl: hasReceipt ? receiptUrl(teamCode, transactionDate) : null,
      createdBy: treasurer.id,
      createdAt: transactionDate,
      updatedAt: transactionDate,
    })
  }

  // Batch insert transactions
  await prisma.transaction.createMany({
    data: transactions,
  })

  return { team, transactionCount: transactions.length }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('🚀 Starting production-scale seed for performance testing…\n')
  console.log(
    `   Target: ${TEAM_COUNT} teams with ${TRANSACTIONS_PER_TEAM} transactions each (${TEAM_COUNT * TRANSACTIONS_PER_TEAM} total)\n`
  )

  // Step 1: Cleanup existing production seed data
  await cleanupProductionSeed()

  // Step 2: Create association
  const { association, adminUser } = await seedAssociation()
  console.log(`✅ Association: ${association.name}`)
  console.log(`✅ Admin User: ${adminUser.email}\n`)

  // Step 3: Seed teams
  let totalTransactions = 0
  for (let i = 1; i <= TEAM_COUNT; i++) {
    const { team, transactionCount } = await seedTeam(association.id, i)
    totalTransactions += transactionCount

    // Progress logging every 10 teams
    if (i % 10 === 0 || i === TEAM_COUNT) {
      console.log(
        `   Seeded ${i}/${TEAM_COUNT} teams (${totalTransactions.toLocaleString()} transactions)...`
      )
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('🎉 PRODUCTION-SCALE SEED COMPLETE')
  console.log('='.repeat(60))
  console.log(`Association: ${PROD_ASSOCIATION_NAME}`)
  console.log(`Teams: ${TEAM_COUNT}`)
  console.log(`Total Transactions: ${totalTransactions.toLocaleString()}`)
  console.log(`Receipt Coverage: ${(RECEIPT_COVERAGE * 100).toFixed(0)}%`)
  console.log(
    `Date Range: ${TWELVE_MONTHS_AGO.toISOString().split('T')[0]} to ${NOW.toISOString().split('T')[0]}`
  )
  console.log('='.repeat(60) + '\n')
  console.log('✅ Ready for performance testing!')
  console.log(
    '   Next: npm run build && npm start && npx playwright test tests/performance/dashboard-load.spec.ts\n'
  )
}

main()
  .catch(e => {
    console.error('❌ Error while seeding production-scale data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
