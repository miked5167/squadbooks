/**
 * Seed script for testing critical path:
 * Squadbooks Team → Financial Snapshot → Association Dashboard
 *
 * Run with: npx tsx scripts/seed-dev-test-data.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting dev database seed...\n')

  // Clean up existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.teamFinancialSnapshot.deleteMany()
  await prisma.alert.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.budgetAllocation.deleteMany()
  await prisma.category.deleteMany()
  await prisma.user.deleteMany()
  await prisma.associationTeam.deleteMany()
  await prisma.associationUser.deleteMany()
  await prisma.team.deleteMany()
  await prisma.association.deleteMany()
  console.log('✅ Cleanup complete\n')

  // 1. Create Association
  console.log('📋 Creating Association...')
  const association = await prisma.association.create({
    data: {
      name: 'Ontario Minor Hockey Association',
      abbreviation: 'OMHA',
      provinceState: 'Ontario',
      country: 'Canada',
      season: '2024-2025',
    },
  })
  console.log(`✅ Created Association: ${association.name} (${association.id})\n`)

  // 2. Create Association Admin User
  console.log('👤 Creating Association Admin...')
  const associationAdmin = await prisma.associationUser.create({
    data: {
      associationId: association.id,
      clerkUserId: 'user_test_association_admin',
      email: 'admin@omha.ca',
      name: 'Sarah Johnson',
      role: 'association_admin',
    },
  })
  console.log(`✅ Created Admin: ${associationAdmin.name}\n`)

  // 3. Create Squadbooks Team
  console.log('🏒 Creating Squadbooks Team...')
  const team = await prisma.team.create({
    data: {
      name: 'Toronto Titans',
      level: 'U13',
      season: '2024-2025',
      budgetTotal: 50000.00,
    },
  })
  console.log(`✅ Created Team: ${team.name} (${team.id})\n`)

  // 4. Create Team Treasurer
  console.log('👤 Creating Team Treasurer...')
  const treasurer = await prisma.user.create({
    data: {
      clerkId: 'user_test_treasurer',
      email: 'treasurer@torontotitans.com',
      name: 'Mike Williams',
      role: 'TREASURER',
      teamId: team.id,
    },
  })
  console.log(`✅ Created Treasurer: ${treasurer.name}\n`)

  // 5. Link Team to Association
  console.log('🔗 Linking Team to Association...')
  const associationTeam = await prisma.associationTeam.create({
    data: {
      associationId: association.id,
      teamId: team.id,
      teamName: team.name,
      division: 'AA',
      season: team.season,
      isActive: true,
      treasurerName: treasurer.name,
      treasurerEmail: treasurer.email,
      connectedAt: new Date(),
    },
  })
  console.log(`✅ Linked Team to Association\n`)

  // 6. Create Budget Categories
  console.log('💰 Creating Budget Categories...')
  const categories = await prisma.category.createMany({
    data: [
      {
        teamId: team.id,
        name: 'ice-time',
        heading: 'Ice Time',
        type: 'EXPENSE',
        color: '#3B82F6',
        sortOrder: 1,
      },
      {
        teamId: team.id,
        name: 'equipment',
        heading: 'Equipment',
        type: 'EXPENSE',
        color: '#10B981',
        sortOrder: 2,
      },
      {
        teamId: team.id,
        name: 'registration-fees',
        heading: 'Registration Fees',
        type: 'INCOME',
        color: '#F59E0B',
        sortOrder: 3,
      },
      {
        teamId: team.id,
        name: 'tournament-fees',
        heading: 'Tournament Fees',
        type: 'EXPENSE',
        color: '#EF4444',
        sortOrder: 4,
      },
    ],
  })
  console.log(`✅ Created ${categories.count} categories\n`)

  // Get created categories
  const allCategories = await prisma.category.findMany({
    where: { teamId: team.id },
  })
  const iceTimeCategory = allCategories.find(c => c.heading === 'Ice Time')!
  const equipmentCategory = allCategories.find(c => c.heading === 'Equipment')!
  const registrationCategory = allCategories.find(c => c.heading === 'Registration Fees')!
  const tournamentCategory = allCategories.find(c => c.heading === 'Tournament Fees')!

  // 7. Create Budget Allocations
  console.log('📊 Creating Budget Allocations...')
  await prisma.budgetAllocation.createMany({
    data: [
      {
        teamId: team.id,
        categoryId: iceTimeCategory.id,
        season: team.season,
        allocated: 25000.00,
      },
      {
        teamId: team.id,
        categoryId: equipmentCategory.id,
        season: team.season,
        allocated: 10000.00,
      },
      {
        teamId: team.id,
        categoryId: tournamentCategory.id,
        season: team.season,
        allocated: 8000.00,
      },
      {
        teamId: team.id,
        categoryId: registrationCategory.id,
        season: team.season,
        allocated: 30000.00,
      },
    ],
  })
  console.log(`✅ Created budget allocations\n`)

  // 8. Create Sample Transactions
  console.log('💳 Creating Sample Transactions...')
  await prisma.transaction.createMany({
    data: [
      // Income
      {
        teamId: team.id,
        categoryId: registrationCategory.id,
        type: 'INCOME',
        vendor: 'Player Families',
        amount: 30000.00,
        description: 'Player registration fees - Fall 2024',
        transactionDate: new Date('2024-09-01'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      // Ice Time Expenses
      {
        teamId: team.id,
        categoryId: iceTimeCategory.id,
        type: 'EXPENSE',
        vendor: 'Scotiabank Arena',
        amount: 5000.00,
        description: 'September ice rental',
        transactionDate: new Date('2024-09-15'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      {
        teamId: team.id,
        categoryId: iceTimeCategory.id,
        type: 'EXPENSE',
        vendor: 'Scotiabank Arena',
        amount: 5000.00,
        description: 'October ice rental',
        transactionDate: new Date('2024-10-15'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      {
        teamId: team.id,
        categoryId: iceTimeCategory.id,
        type: 'EXPENSE',
        vendor: 'Scotiabank Arena',
        amount: 5000.00,
        description: 'November ice rental',
        transactionDate: new Date('2024-11-15'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      // Equipment
      {
        teamId: team.id,
        categoryId: equipmentCategory.id,
        type: 'EXPENSE',
        vendor: 'Pro Hockey Life',
        amount: 6000.00,
        description: 'Team jerseys',
        transactionDate: new Date('2024-09-20'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      {
        teamId: team.id,
        categoryId: equipmentCategory.id,
        type: 'EXPENSE',
        vendor: 'Pro Hockey Life',
        amount: 2000.00,
        description: 'Practice pucks and training aids',
        transactionDate: new Date('2024-10-05'),
        status: 'APPROVED',
        createdBy: treasurer.id,
        missingReceipt: true,
      },
      // Tournament
      {
        teamId: team.id,
        categoryId: tournamentCategory.id,
        type: 'EXPENSE',
        vendor: 'Silver Stick Tournament',
        amount: 1500.00,
        description: 'Tournament entry fee',
        transactionDate: new Date('2024-10-20'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      {
        teamId: team.id,
        categoryId: tournamentCategory.id,
        type: 'EXPENSE',
        vendor: 'Ottawa Invitational',
        amount: 1500.00,
        description: 'Tournament entry fee',
        transactionDate: new Date('2024-11-10'),
        status: 'APPROVED',
        createdBy: treasurer.id,
      },
      // Pending approval
      {
        teamId: team.id,
        categoryId: equipmentCategory.id,
        type: 'EXPENSE',
        vendor: 'Hockey Gear Repair Shop',
        amount: 500.00,
        description: 'Goalie equipment repair',
        transactionDate: new Date('2024-11-20'),
        status: 'PENDING',
        createdBy: treasurer.id,
        missingReceipt: true,
      },
    ],
  })
  console.log(`✅ Created 9 sample transactions\n`)

  // 9. Calculate Financial Metrics
  console.log('📈 Calculating financial metrics...')
  const transactions = await prisma.transaction.findMany({
    where: {
      teamId: team.id,
      status: 'APPROVED',
    },
  })

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const budgetTotal = Number(team.budgetTotal)
  const spent = totalExpenses
  const remaining = budgetTotal - spent
  const percentUsed = (spent / budgetTotal) * 100

  const pendingApprovals = await prisma.transaction.count({
    where: {
      teamId: team.id,
      status: 'PENDING',
    },
  })

  console.log(`   Total Income: $${totalIncome.toFixed(2)}`)
  console.log(`   Total Expenses: $${totalExpenses.toFixed(2)}`)
  console.log(`   Budget Used: ${percentUsed.toFixed(1)}%`)
  console.log(`   Pending Approvals: ${pendingApprovals}\n`)

  // 10. Generate Financial Snapshot
  console.log('📸 Generating Financial Snapshot...')

  // Calculate health status based on budget usage
  let healthStatus: 'healthy' | 'warning' | 'critical'
  let healthScore: number

  if (percentUsed < 75) {
    healthStatus = 'healthy'
    healthScore = 90
  } else if (percentUsed < 90) {
    healthStatus = 'warning'
    healthScore = 60
  } else {
    healthStatus = 'critical'
    healthScore = 30
  }

  const snapshot = await prisma.teamFinancialSnapshot.create({
    data: {
      associationTeamId: associationTeam.id,
      healthStatus,
      healthScore,
      budgetTotal,
      spent,
      remaining,
      percentUsed,
      pendingApprovals,
      missingReceipts: 1, // Practice pucks transaction has missing receipt
      bankConnected: false,
      lastActivityAt: new Date(),
      redFlags: pendingApprovals > 0 ? ['pending_approvals'] : [],
    },
  })
  console.log(`✅ Created snapshot with health status: ${healthStatus} (score: ${healthScore})\n`)

  // 11. Generate Alert if needed
  if (healthStatus === 'warning' || healthStatus === 'critical') {
    console.log('⚠️  Generating alert...')
    await prisma.alert.create({
      data: {
        associationId: association.id,
        associationTeamId: associationTeam.id,
        alertType: 'budget_overrun',
        severity: healthStatus === 'critical' ? 'high' : 'medium',
        title: `Budget ${percentUsed.toFixed(0)}% Used - ${team.name}`,
        description: `The team has used ${percentUsed.toFixed(1)}% of their budget ($${spent.toFixed(2)} of $${budgetTotal.toFixed(2)}).`,
        status: 'active',
      },
    })
    console.log('✅ Alert created\n')
  }

  // Print Summary
  console.log('=' .repeat(60))
  console.log('🎉 SEED COMPLETE - TEST DATA SUMMARY')
  console.log('=' .repeat(60))
  console.log(`Association: ${association.name}`)
  console.log(`Team: ${team.name} (${team.level})`)
  console.log(`Treasurer: ${treasurer.name}`)
  console.log(`Budget: $${budgetTotal.toFixed(2)}`)
  console.log(`Spent: $${spent.toFixed(2)} (${percentUsed.toFixed(1)}%)`)
  console.log(`Health: ${healthStatus.toUpperCase()} (${healthScore}/100)`)
  console.log(`Transactions: ${transactions.length} approved, ${pendingApprovals} pending`)
  console.log('=' .repeat(60))
  console.log('\n✅ Ready to test critical path!')
  console.log('   1. Open Prisma Studio: http://localhost:5555')
  console.log('   2. Check team_financial_snapshots table')
  console.log('   3. Verify association_teams link')
  console.log('   4. Review alerts table\n')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
