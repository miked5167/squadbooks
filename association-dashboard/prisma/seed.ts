/**
 * Seed Script for Association Command Center
 * Creates demo data to showcase the dashboard
 */

import { PrismaClient } from '../src/generated/prisma'

// Use direct URL for seeding to bypass connection pooler
const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL,
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🌱 Starting seed...')

  // Get the current Clerk user ID from environment or use placeholder
  const clerkUserId = process.env.SEED_CLERK_USER_ID || 'REPLACE_WITH_YOUR_CLERK_USER_ID'

  console.log(`Creating data for Clerk user: ${clerkUserId}`)

  // 1. Create Association
  const association = await prisma.association.create({
    data: {
      name: 'Greater Toronto Hockey Association',
      abbreviation: 'GTHA',
      provinceState: 'Ontario',
      country: 'Canada',
      season: '2024-2025',
    },
  })
  console.log(`✓ Created association: ${association.name}`)

  // 2. Create AssociationUser (link current user to association)
  const associationUser = await prisma.associationUser.create({
    data: {
      clerkUserId: clerkUserId,
      associationId: association.id,
      name: 'Demo Admin',
      email: 'admin@gtha.com',
      role: 'association_admin',
    },
  })
  console.log(`✓ Created association user: ${associationUser.name}`)

  // 3. Create Teams
  const teams = await Promise.all([
    prisma.associationTeam.create({
      data: {
        associationId: association.id,
        teamName: 'U13 Hawks',
        division: 'U13',
        season: '2024-2025',
        teamId: 'team_hawks_u13',
        apiAccessToken: 'demo_token_hawks',
      },
    }),
    prisma.associationTeam.create({
      data: {
        associationId: association.id,
        teamName: 'U15 Eagles',
        division: 'U15',
        season: '2024-2025',
        teamId: 'team_eagles_u15',
        apiAccessToken: 'demo_token_eagles',
      },
    }),
    prisma.associationTeam.create({
      data: {
        associationId: association.id,
        teamName: 'U18 Warriors',
        division: 'U18',
        season: '2024-2025',
        teamId: 'team_warriors_u18',
        apiAccessToken: 'demo_token_warriors',
      },
    }),
    prisma.associationTeam.create({
      data: {
        associationId: association.id,
        teamName: 'U10 Sharks',
        division: 'U10',
        season: '2024-2025',
        teamId: 'team_sharks_u10',
        apiAccessToken: 'demo_token_sharks',
      },
    }),
    prisma.associationTeam.create({
      data: {
        associationId: association.id,
        teamName: 'U12 Tigers',
        division: 'U12',
        season: '2024-2025',
        teamId: 'team_tigers_u12',
        apiAccessToken: 'demo_token_tigers',
      },
    }),
  ])
  console.log(`✓ Created ${teams.length} teams`)

  // 4. Create Financial Snapshots
  const now = new Date()
  const snapshots = await Promise.all([
    // Hawks - Healthy
    prisma.teamFinancialSnapshot.create({
      data: {
        associationTeamId: teams[0].id,
        snapshotAt: now,
        healthStatus: 'healthy',
        budgetTotal: 15000,
        spent: 8500,
        remaining: 6500,
        percentUsed: 56.67,
        bankConnected: true,
        bankReconciledThrough: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        pendingApprovals: 2,
        missingReceipts: 1,
        redFlags: [],
      },
    }),
    // Eagles - Needs Attention
    prisma.teamFinancialSnapshot.create({
      data: {
        associationTeamId: teams[1].id,
        snapshotAt: now,
        healthStatus: 'needs_attention',
        budgetTotal: 20000,
        spent: 16500,
        remaining: 3500,
        percentUsed: 82.5,
        bankConnected: true,
        bankReconciledThrough: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        pendingApprovals: 8,
        missingReceipts: 5,
        redFlags: ['high_budget_usage', 'stale_reconciliation'],
      },
    }),
    // Warriors - At Risk
    prisma.teamFinancialSnapshot.create({
      data: {
        associationTeamId: teams[2].id,
        snapshotAt: now,
        healthStatus: 'at_risk',
        budgetTotal: 18000,
        spent: 17200,
        remaining: 800,
        percentUsed: 95.56,
        bankConnected: false,
        bankReconciledThrough: null,
        pendingApprovals: 12,
        missingReceipts: 15,
        redFlags: ['critical_budget_usage', 'bank_not_connected', 'many_missing_receipts'],
      },
    }),
    // Sharks - Healthy
    prisma.teamFinancialSnapshot.create({
      data: {
        associationTeamId: teams[3].id,
        snapshotAt: now,
        healthStatus: 'healthy',
        budgetTotal: 12000,
        spent: 5800,
        remaining: 6200,
        percentUsed: 48.33,
        bankConnected: true,
        bankReconciledThrough: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        pendingApprovals: 1,
        missingReceipts: 0,
        redFlags: [],
      },
    }),
    // Tigers - Needs Attention
    prisma.teamFinancialSnapshot.create({
      data: {
        associationTeamId: teams[4].id,
        snapshotAt: now,
        healthStatus: 'needs_attention',
        budgetTotal: 16000,
        spent: 13000,
        remaining: 3000,
        percentUsed: 81.25,
        bankConnected: true,
        bankReconciledThrough: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        pendingApprovals: 6,
        missingReceipts: 3,
        redFlags: ['high_budget_usage'],
      },
    }),
  ])
  console.log(`✓ Created ${snapshots.length} financial snapshots`)

  // 5. Create Alerts
  const alerts = await Promise.all([
    prisma.alert.create({
      data: {
        associationId: association.id,
        associationTeamId: teams[2].id, // Warriors
        alertType: 'critical_budget_usage',
        severity: 'critical',
        status: 'active',
        title: 'Critical Budget Usage - U18 Warriors',
        description: 'Team has used 95.56% of their budget',
        lastTriggeredAt: now,
      },
    }),
    prisma.alert.create({
      data: {
        associationId: association.id,
        associationTeamId: teams[2].id, // Warriors
        alertType: 'bank_not_connected',
        severity: 'warning',
        status: 'active',
        title: 'Bank Not Connected - U18 Warriors',
        description: 'Team needs to connect their bank account',
        lastTriggeredAt: now,
      },
    }),
    prisma.alert.create({
      data: {
        associationId: association.id,
        associationTeamId: teams[1].id, // Eagles
        alertType: 'stale_reconciliation',
        severity: 'warning',
        status: 'active',
        title: 'Stale Reconciliation - U15 Eagles',
        description: 'Last reconciliation was 45 days ago',
        lastTriggeredAt: now,
      },
    }),
  ])
  console.log(`✓ Created ${alerts.length} alerts`)

  // 6. Create a report record
  await prisma.report.create({
    data: {
      associationId: association.id,
      generatedBy: associationUser.id,
      reportType: 'board_summary',
    },
  })
  console.log('✓ Created sample report record')

  console.log('\n✅ Seed complete!')
  console.log('\nNext steps:')
  console.log('1. Copy your Clerk User ID from the browser dev console or Clerk dashboard')
  console.log('2. Run: SEED_CLERK_USER_ID=your_clerk_user_id npm run seed')
  console.log('3. Refresh http://localhost:3000 to see your dashboard!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
