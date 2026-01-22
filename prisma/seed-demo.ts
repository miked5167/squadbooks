// prisma/seed-demo.ts

/**
 * ============================================
 * DEMO SEED SCRIPT FOR SQUADBOOKS + ASSOCIATION COMMAND CENTER
 * ============================================
 *
 * Creates realistic demo data for Newmarket Minor Hockey Association (2025-2026 season)
 * with 5 teams, complete financials, transactions, alerts, and audit logs.
 *
 * ============================================
 * IDEMPOTENT & MODE-BASED SEEDING
 * ============================================
 *
 * This script supports multiple execution modes for flexible development workflows:
 *
 * USAGE:
 *
 * 1. Full seed (idempotent - safe to run repeatedly):
 *    npm run seed:demo
 *
 *    - Creates or updates association, rules, teams, and all related data
 *    - Uses upserts for association and rules to avoid duplicates
 *    - Skips if demo data already exists (unless FORCE_RESEED is set)
 *
 * 2. Force full reseed (clean slate):
 *    FORCE_RESEED=true npm run seed:demo
 *
 *    - Deletes ALL existing demo data first
 *    - Recreates everything from scratch
 *    - Use with caution!
 *
 * 3. Rules-only refresh (fast iteration):
 *    SEED_MODE=rules-only npm run seed:demo
 *
 *    - Only updates association rules (using upserts)
 *    - Requires association to exist already
 *    - Perfect for testing rule engine changes
 *
 * ENVIRONMENT VARIABLES:
 *
 * - SEED_MODE: 'full' (default) | 'rules-only'
 * - FORCE_RESEED: 'true' | undefined (forces full wipe before seed)
 *
 * ============================================
 * DEMO DATA IDENTIFICATION
 * ============================================
 *
 * All demo data is tagged for safe cleanup:
 * - Association: "Newmarket Minor Hockey Association - Demo Data"
 * - Users: clerkId/clerkUserId starting with "demo_2025_2026_"
 * - Emails: ending with "@demo.huddlebooks.app"
 * - Metadata: {is_demo: true, source: "2025_2026_demo_seed"} where applicable
 */

import {
  PrismaClient,
  UserRole,
  TransactionType,
  TransactionStatus,
  ApprovalStatus,
  CategoryType,
  TeamType,
  AgeDivision,
  CompetitiveLevel,
  PlayerStatus,
  BankAccountType,
  BudgetApprovalType,
  BudgetApprovalStatus,
} from '@prisma/client'
import { MANDATORY_RECEIPT_THRESHOLD } from '../lib/constants/validation'

const prisma = new PrismaClient({
  log: ['warn', 'error'],
})

// ============================================
// CONSTANTS
// ============================================

const DEMO_CLERK_ID_PREFIX = 'demo_2025_2026_'
const DEMO_EMAIL_DOMAIN = '@demo.huddlebooks.app'
const DEMO_ASSOCIATION_NAME = 'Greater Toronto Hockey League - Demo Data'
const DEMO_SOURCE = '2025_2026_demo_seed'
const DEMO_SEASON = '2025-2026'

// Dates
const NOW = new Date('2026-02-15T12:00:00Z')
const SEASON_START = new Date('2025-09-01T00:00:00Z')
const SEASON_END = new Date('2026-04-30T23:59:59Z')

// Fake data pools
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
  'Chloe',
  'Amelia',
  'Grace',
  'Hannah',
  'Emily',
  'William',
  'Jack',
  'Henry',
  'Owen',
  'Aiden',
  'Ella',
  'Lily',
  'Mia',
  'Zoe',
  'Abigail',
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
  'MacDonald',
  'Thompson',
  'Anderson',
  'Taylor',
  'Murphy',
]

// Canadian vendors
const VENDORS = {
  arenas: ['Magna Centre', 'Ray Twinney Complex', 'Canlan Sports York'],
  bigEvents: ['Scotiabank Arena'],
  retail: ['Canadian Tire', 'Sport Chek', 'Pro Hockey Life'],
  gas: ['Petro-Canada', 'Esso', 'Shell'],
  hotels: ['Holiday Inn Express', 'Hampton Inn', 'Fairfield Inn & Suites'],
}

// Budget category mapping (percentages of total budget)
const BUDGET_CATEGORY_CONFIG = [
  { heading: 'Ice Time & Facilities', percent: 55 },
  { heading: 'Equipment & Jerseys', percent: 15 },
  { heading: 'Travel & Tournaments', percent: 15 },
  { heading: 'Coaching & Officials', percent: 8 },
  { heading: 'League & Registration', percent: 5 },
  { heading: 'Team Operations', percent: 2 },
]

// Team configurations
interface TeamConfig {
  code: string
  name: string
  ageDivision: AgeDivision
  competitiveLevel: CompetitiveLevel
  budgetTotal: number // in dollars
  percentSpent: number // 0.75 = 75%
  bankReconciliationDaysAgo: number
  pendingReviewsCount: number
  playersCount: number
  healthStatus: 'healthy' | 'needs_attention' | 'at_risk'
}

const TEAM_CONFIGS: TeamConfig[] = [
  {
    code: 'u13-aa-storm',
    name: 'U13 AA Storm',
    ageDivision: AgeDivision.U13,
    competitiveLevel: CompetitiveLevel.AA,
    budgetTotal: 45000,
    percentSpent: 0.75,
    bankReconciliationDaysAgo: 5,
    pendingReviewsCount: 2,
    playersCount: 18,
    healthStatus: 'healthy',
  },
  {
    code: 'u15-a-thunder',
    name: 'U15 A Thunder',
    ageDivision: AgeDivision.U15,
    competitiveLevel: CompetitiveLevel.A,
    budgetTotal: 38000,
    percentSpent: 0.88,
    bankReconciliationDaysAgo: 35,
    pendingReviewsCount: 6,
    playersCount: 16,
    healthStatus: 'needs_attention',
  },
  {
    code: 'u11-aaa-lightning',
    name: 'U11 AAA Lightning',
    ageDivision: AgeDivision.U11,
    competitiveLevel: CompetitiveLevel.AAA,
    budgetTotal: 52000,
    percentSpent: 0.97,
    bankReconciliationDaysAgo: 65,
    pendingReviewsCount: 12,
    playersCount: 17,
    healthStatus: 'at_risk',
  },
  {
    code: 'u18-aa-blizzard',
    name: 'U18 AA Blizzard',
    ageDivision: AgeDivision.U18,
    competitiveLevel: CompetitiveLevel.AA,
    budgetTotal: 48000,
    percentSpent: 0.68,
    bankReconciliationDaysAgo: 10,
    pendingReviewsCount: 1,
    playersCount: 18,
    healthStatus: 'healthy',
  },
  {
    code: 'u9-a-snowflakes',
    name: 'U9 A Snowflakes',
    ageDivision: AgeDivision.U9,
    competitiveLevel: CompetitiveLevel.A,
    budgetTotal: 28000,
    percentSpent: 0.82,
    bankReconciliationDaysAgo: 15,
    pendingReviewsCount: 7,
    playersCount: 16,
    healthStatus: 'needs_attention',
  },
]

// Family fee ranges by level (in dollars)
const FAMILY_FEE_RANGE: Record<CompetitiveLevel, { min: number; max: number }> = {
  [CompetitiveLevel.AAA]: { min: 2000, max: 2500 },
  [CompetitiveLevel.AA]: { min: 1500, max: 2000 },
  [CompetitiveLevel.A]: { min: 1200, max: 1800 },
  [CompetitiveLevel.BB]: { min: 1000, max: 1500 },
  [CompetitiveLevel.B]: { min: 800, max: 1200 },
  [CompetitiveLevel.MD]: { min: 900, max: 1300 },
  [CompetitiveLevel.HOUSE_RECREATIONAL]: { min: 600, max: 1000 },
  [CompetitiveLevel.NOT_APPLICABLE]: { min: 500, max: 800 },
  [CompetitiveLevel.OTHER]: { min: 500, max: 800 },
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

let clerkIdCounter = 1

function generateDemoClerkId(): string {
  return `${DEMO_CLERK_ID_PREFIX}${String(clerkIdCounter++).padStart(6, '0')}`
}

function daysAgo(base: Date, days: number): Date {
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() - days)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
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

// ============================================
// MAIN SEED PIPELINE
// ============================================

async function main() {
  const SEED_MODE = process.env.SEED_MODE ?? 'full' // 'full' | 'rules-only'
  const FORCE_RESEED = process.env.FORCE_RESEED === 'true'

  console.log('🚀 Starting demo seed for Newmarket Minor Hockey Association (2025-2026)…\n')
  console.log(`   Mode: ${SEED_MODE}`)
  console.log(`   Force Reseed: ${FORCE_RESEED}\n`)

  // ============================================
  // GUARD: Prevent accidental full reseeds
  // ============================================
  if (!FORCE_RESEED && SEED_MODE === 'full') {
    const existing = await prisma.association.findFirst({
      where: { name: DEMO_ASSOCIATION_NAME },
    })

    if (existing) {
      console.log('✅ Demo data already exists.')
      console.log('   Use FORCE_RESEED=true for a clean reset')
      console.log('   Use SEED_MODE=rules-only for targeted rule updates\n')
      return
    }
  }

  // ============================================
  // MODE: rules-only (fast iteration)
  // ============================================
  if (SEED_MODE === 'rules-only') {
    console.log('🔄 SEED_MODE=rules-only: refreshing association rules only…\n')

    const association = await prisma.association.findFirst({
      where: { name: DEMO_ASSOCIATION_NAME },
    })

    if (!association) {
      console.log('❌ No demo association found.')
      console.log('   Run full seed once first: npm run seed:demo\n')
      return
    }

    const rules = await seedRules(association.id)
    console.log(`✅ ${rules.length} rules refreshed.\n`)
    return
  }

  // ============================================
  // MODE: full (idempotent or clean slate)
  // ============================================
  console.log('🌱 Running full demo seed…\n')

  // Step 1: Optionally wipe if FORCE_RESEED is set
  if (FORCE_RESEED) {
    await wipeDemoData()
  }

  // Step 2: Seed core association data (idempotent via upserts)
  const { association, adminUser } = await seedAssociation()
  console.log(`✅ Association: ${association.name}`)

  const dashboardConfig = await seedDashboardConfig(association.id)
  console.log(`✅ Dashboard config created/updated`)

  const rules = await seedRules(association.id)
  console.log(`✅ ${rules.length} association rules created/updated`)

  // Step 3: Seed teams (idempotent for teams themselves, not transactional data)
  let totalPlayers = 0
  let totalTransactions = 0
  let totalAlerts = 0
  let totalAuditLogs = 0
  let totalBudgetApprovals = 0

  for (const cfg of TEAM_CONFIGS) {
    console.log(`\n—— Seeding team: ${cfg.name} ——`)

    const result = await seedTeam(association.id, cfg)

    totalPlayers += result.playersCount
    totalTransactions += result.transactionsCount
    totalAlerts += result.alertsCount
    totalAuditLogs += result.auditLogsCount
    totalBudgetApprovals += result.budgetApprovalsCount

    console.log(
      `✅ ${cfg.name}: ${result.playersCount} players, ${result.transactionsCount} transactions ` +
        `(${result.pendingCount} pending), ${result.alertsCount} alerts, ${result.auditLogsCount} audit logs, ` +
        `${result.budgetApprovalsCount} budget approvals`
    )
  }

  // Step 4: Seed violations (after teams are created)
  console.log('\n—— Seeding rule violations ——')
  const allTeams = await prisma.team.findMany({
    where: {
      associationTeam: {
        associationId: association.id,
      },
    },
    select: { id: true },
  })
  const teamIds = allTeams.map(t => t.id)
  const violations = await seedViolations(association.id, rules, teamIds)
  console.log(`✅ ${violations.length} rule violations created`)

  console.log('\n' + '='.repeat(60))
  console.log('🎉 DEMO SEED COMPLETE')
  console.log('='.repeat(60))
  console.log(`Association: ${DEMO_ASSOCIATION_NAME}`)
  console.log(`Teams: ${TEAM_CONFIGS.length}`)
  console.log(`Total Players: ${totalPlayers}`)
  console.log(`Total Transactions: ${totalTransactions}`)
  console.log(`Total Alerts: ${totalAlerts}`)
  console.log(`Total Audit Logs: ${totalAuditLogs}`)
  console.log(`Total Budget Approvals: ${totalBudgetApprovals}`)
  console.log(`Total Violations: ${violations.length}`)
  console.log('='.repeat(60) + '\n')
}

// ============================================
// STEP 0: WIPE DEMO DATA (only when FORCE_RESEED=true)
// ============================================

async function wipeDemoData() {
  console.log('🧹 Clearing existing demo data…')

  // Find demo association (may not exist if partially cleaned)
  const demoAssociation = await prisma.association.findFirst({
    where: { name: DEMO_ASSOCIATION_NAME },
  })

  // Find all demo teams (linked to the demo association OR orphaned demo teams)
  let demoTeamIds: string[] = []
  if (demoAssociation) {
    const demoTeams = await prisma.team.findMany({
      where: {
        associationTeam: {
          associationId: demoAssociation.id,
        },
      },
      select: { id: true },
    })
    demoTeamIds = demoTeams.map(t => t.id)
  }

  // Also find teams by association name (in case AssociationTeam link is broken)
  const orphanedDemoTeams = await prisma.team.findMany({
    where: {
      associationName: 'Newmarket Minor Hockey Association',
    },
    select: { id: true },
  })
  // Merge and deduplicate
  demoTeamIds = [...new Set([...demoTeamIds, ...orphanedDemoTeams.map(t => t.id)])]

  // Find all demo users (by clerkId prefix)
  const demoUsers = await prisma.user.findMany({
    where: {
      clerkId: { startsWith: DEMO_CLERK_ID_PREFIX },
    },
    select: { id: true },
  })
  const demoUserIds = demoUsers.map(u => u.id)

  // Find all demo families (by email domain)
  const demoFamilies = await prisma.family.findMany({
    where: {
      primaryEmail: { endsWith: DEMO_EMAIL_DOMAIN },
    },
    select: { teamId: true },
  })
  const familyTeamIds = demoFamilies.map(f => f.teamId)
  demoTeamIds = [...new Set([...demoTeamIds, ...familyTeamIds])]

  console.log(`   Found ${demoTeamIds.length} demo teams, ${demoUserIds.length} demo users`)

  if (demoTeamIds.length === 0 && demoUserIds.length === 0 && !demoAssociation) {
    console.log('   ✓ No demo data found, skipping cleanup')
    console.log('🧹 Demo data cleared.\n')
    return
  }

  // Delete in order from most dependent to least dependent

  // 1. NotificationSettings (references User)
  if (demoUserIds.length > 0) {
    const delNotifications = await prisma.notificationSettings.deleteMany({
      where: { userId: { in: demoUserIds } },
    })
    if (delNotifications.count > 0)
      console.log(`   ✓ Deleted ${delNotifications.count} notification settings`)
  }

  // 2. Exports (references Team and User)
  if (demoTeamIds.length > 0) {
    const delExports = await prisma.export.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delExports.count > 0) console.log(`   ✓ Deleted ${delExports.count} exports`)
  }

  // 3. SeasonClosures (references Team and User)
  if (demoTeamIds.length > 0) {
    const delSeasonClosures = await prisma.seasonClosure.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delSeasonClosures.count > 0)
      console.log(`   ✓ Deleted ${delSeasonClosures.count} season closures`)
  }

  // 4. Approvals (references Transaction, Users, Team)
  if (demoTeamIds.length > 0) {
    const delApprovals = await prisma.approval.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delApprovals.count > 0) console.log(`   ✓ Deleted ${delApprovals.count} approvals`)
  }

  // 4b. Acknowledgments (references BudgetApproval, User) - must delete before BudgetApprovals
  if (demoTeamIds.length > 0) {
    const delAcknowledgments = await prisma.acknowledgment.deleteMany({
      where: {
        budgetApproval: {
          teamId: { in: demoTeamIds },
        },
      },
    })
    if (delAcknowledgments.count > 0)
      console.log(`   ✓ Deleted ${delAcknowledgments.count} acknowledgments`)
  }

  // 4c. BudgetApprovals (references Team, User)
  if (demoTeamIds.length > 0) {
    const delBudgetApprovals = await prisma.budgetApproval.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delBudgetApprovals.count > 0)
      console.log(`   ✓ Deleted ${delBudgetApprovals.count} budget approvals`)
  }

  // 5. Transactions (references Team, Category, User via createdBy)
  if (demoTeamIds.length > 0) {
    const delTransactions = await prisma.transaction.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delTransactions.count > 0)
      console.log(`   ✓ Deleted ${delTransactions.count} transactions by teamId`)
  }

  // Also delete transactions created by demo users (in case they created transactions for non-demo teams)
  if (demoUserIds.length > 0) {
    const delTransactionsByUser = await prisma.transaction.deleteMany({
      where: { createdBy: { in: demoUserIds } },
    })
    if (delTransactionsByUser.count > 0)
      console.log(`   ✓ Deleted ${delTransactionsByUser.count} transactions by createdBy`)
  }

  // 6. BankTransactions (references BankAccount)
  if (demoTeamIds.length > 0) {
    const delBankTxs = await prisma.bankTransaction.deleteMany({
      where: {
        bankAccount: {
          teamId: { in: demoTeamIds },
        },
      },
    })
    if (delBankTxs.count > 0) console.log(`   ✓ Deleted ${delBankTxs.count} bank transactions`)
  }

  // 7. BankAccounts (references Team)
  if (demoTeamIds.length > 0) {
    const delBankAccounts = await prisma.bankAccount.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delBankAccounts.count > 0)
      console.log(`   ✓ Deleted ${delBankAccounts.count} bank accounts`)
  }

  // 8. BudgetAllocations (references Team, Category)
  if (demoTeamIds.length > 0) {
    const delBudgetAlloc = await prisma.budgetAllocation.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delBudgetAlloc.count > 0)
      console.log(`   ✓ Deleted ${delBudgetAlloc.count} budget allocations`)
  }

  // 8.5. PreSeasonAllocations (references Category) - Must delete before Categories
  if (demoTeamIds.length > 0) {
    const delPreSeasonAlloc = await prisma.preSeasonAllocation.deleteMany({
      where: {
        category: {
          teamId: { in: demoTeamIds },
        },
      },
    })
    if (delPreSeasonAlloc.count > 0)
      console.log(`   ✓ Deleted ${delPreSeasonAlloc.count} pre-season allocations`)
  }

  // 9. Categories (references Team)
  if (demoTeamIds.length > 0) {
    const delCategories = await prisma.category.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delCategories.count > 0) console.log(`   ✓ Deleted ${delCategories.count} categories`)
  }

  // 10. AuditLogs (references Team, User)
  if (demoTeamIds.length > 0) {
    const delAuditLogs = await prisma.auditLog.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delAuditLogs.count > 0)
      console.log(`   ✓ Deleted ${delAuditLogs.count} audit logs by teamId`)
  }

  // Also delete audit logs by userId to prevent foreign key constraint errors
  if (demoUserIds.length > 0) {
    const delAuditLogsByUser = await prisma.auditLog.deleteMany({
      where: { userId: { in: demoUserIds } },
    })
    if (delAuditLogsByUser.count > 0)
      console.log(`   ✓ Deleted ${delAuditLogsByUser.count} audit logs by userId`)
  }

  // 11. Invitations (references Team)
  if (demoTeamIds.length > 0) {
    const delInvitations = await prisma.invitation.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delInvitations.count > 0) console.log(`   ✓ Deleted ${delInvitations.count} invitations`)
  }

  // 12. Players (references Team, Family)
  if (demoTeamIds.length > 0) {
    const delPlayers = await prisma.player.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delPlayers.count > 0) console.log(`   ✓ Deleted ${delPlayers.count} players`)
  }

  // 13. Families (by demo email domain)
  const delFamilies = await prisma.family.deleteMany({
    where: {
      primaryEmail: { endsWith: DEMO_EMAIL_DOMAIN },
    },
  })
  if (delFamilies.count > 0) console.log(`   ✓ Deleted ${delFamilies.count} families`)

  // 14. TeamSettings (references Team)
  if (demoTeamIds.length > 0) {
    const delTeamSettings = await prisma.teamSettings.deleteMany({
      where: { teamId: { in: demoTeamIds } },
    })
    if (delTeamSettings.count > 0)
      console.log(`   ✓ Deleted ${delTeamSettings.count} team settings`)
  }

  // 15. TeamFinancialSnapshots (references AssociationTeam)
  if (demoAssociation) {
    const delSnapshots = await prisma.teamFinancialSnapshot.deleteMany({
      where: {
        team: {
          associationId: demoAssociation.id,
        },
      },
    })
    if (delSnapshots.count > 0)
      console.log(`   ✓ Deleted ${delSnapshots.count} financial snapshots`)
  }

  // 16. Alerts (references Association, AssociationTeam)
  if (demoAssociation) {
    const delAlerts = await prisma.alert.deleteMany({
      where: {
        associationId: demoAssociation.id,
      },
    })
    if (delAlerts.count > 0) console.log(`   ✓ Deleted ${delAlerts.count} alerts`)
  }

  // 17. Reports (references Association, AssociationUser)
  // First delete reports by association
  if (demoAssociation) {
    const delReports = await prisma.report.deleteMany({
      where: {
        associationId: demoAssociation.id,
      },
    })
    if (delReports.count > 0) console.log(`   ✓ Deleted ${delReports.count} reports by associationId`)
  }

  // Also delete any reports generated by demo association users (prevents FK constraint error)
  const demoAssocUsers = await prisma.associationUser.findMany({
    where: {
      clerkUserId: { startsWith: DEMO_CLERK_ID_PREFIX },
    },
    select: { id: true },
  })
  if (demoAssocUsers.length > 0) {
    const delReportsByUser = await prisma.report.deleteMany({
      where: {
        generatedBy: { in: demoAssocUsers.map(u => u.id) },
      },
    })
    if (delReportsByUser.count > 0)
      console.log(`   ✓ Deleted ${delReportsByUser.count} reports by generatedBy`)
  }

  // 18. DashboardConfig (references Association)
  if (demoAssociation) {
    const delDashboardConfig = await prisma.dashboardConfig.deleteMany({
      where: {
        associationId: demoAssociation.id,
      },
    })
    if (delDashboardConfig.count > 0)
      console.log(`   ✓ Deleted ${delDashboardConfig.count} dashboard configs`)
  }

  // 18.5. RuleViolations (references AssociationRule and Team) - delete before rules
  if (demoTeamIds.length > 0) {
    const delRuleViolations = await prisma.ruleViolation.deleteMany({
      where: {
        teamId: { in: demoTeamIds },
      },
    })
    if (delRuleViolations.count > 0)
      console.log(`   ✓ Deleted ${delRuleViolations.count} rule violations`)
  }

  // 18.6. AssociationRules (references Association)
  if (demoAssociation) {
    const delAssociationRules = await prisma.associationRule.deleteMany({
      where: {
        associationId: demoAssociation.id,
      },
    })
    if (delAssociationRules.count > 0)
      console.log(`   ✓ Deleted ${delAssociationRules.count} association rules`)
  }

  // 19. AssociationTeams (references Association, Team)
  if (demoAssociation) {
    const delAssocTeams = await prisma.associationTeam.deleteMany({
      where: {
        associationId: demoAssociation.id,
      },
    })
    if (delAssocTeams.count > 0)
      console.log(`   ✓ Deleted ${delAssocTeams.count} association teams`)
  }

  // 20. Users (team users with demo clerkId)
  if (demoUserIds.length > 0) {
    const deletedTeamUsers = await prisma.user.deleteMany({
      where: {
        clerkId: { startsWith: DEMO_CLERK_ID_PREFIX },
      },
    })
    console.log(`   ✓ Deleted ${deletedTeamUsers.count} demo team users`)
  }

  // 21. AssociationUsers (association users with demo clerkUserId)
  const deletedAssocUsers = await prisma.associationUser.deleteMany({
    where: {
      clerkUserId: { startsWith: DEMO_CLERK_ID_PREFIX },
    },
  })
  if (deletedAssocUsers.count > 0)
    console.log(`   ✓ Deleted ${deletedAssocUsers.count} demo association users`)

  // 22. Teams
  if (demoTeamIds.length > 0) {
    const delTeams = await prisma.team.deleteMany({
      where: {
        id: { in: demoTeamIds },
      },
    })
    if (delTeams.count > 0) console.log(`   ✓ Deleted ${delTeams.count} teams`)
  }

  // 23. Association
  if (demoAssociation) {
    await prisma.association.delete({
      where: { id: demoAssociation.id },
    })
    console.log('   ✓ Deleted demo association')
  }

  console.log('🧹 Demo data cleared.\n')
}

// ============================================
// SEED FUNCTIONS (IDEMPOTENT VIA UPSERTS)
// ============================================

/**
 * Seed Association + Admin User (Idempotent)
 * Uses upsert to create or update the demo association
 */
async function seedAssociation() {
  const adminClerkId = generateDemoClerkId()
  const adminEmail = `admin${DEMO_EMAIL_DOMAIN}`

  // Upsert association
  const association = await prisma.association.upsert({
    where: { name: DEMO_ASSOCIATION_NAME },
    update: {
      abbreviation: 'GTHL',
      provinceState: 'Ontario',
      country: 'Canada',
      season: DEMO_SEASON,
      updatedAt: NOW,
    },
    create: {
      name: DEMO_ASSOCIATION_NAME,
      abbreviation: 'GTHL',
      provinceState: 'Ontario',
      country: 'Canada',
      season: DEMO_SEASON,
      createdAt: SEASON_START,
      updatedAt: NOW,
    },
  })

  // Find or create admin user
  let adminUser = await prisma.associationUser.findFirst({
    where: {
      associationId: association.id,
      email: adminEmail,
    },
  })

  if (!adminUser) {
    adminUser = await prisma.associationUser.create({
      data: {
        associationId: association.id,
        clerkUserId: adminClerkId,
        email: adminEmail,
        name: 'Association Admin',
        role: 'association_admin',
        lastLoginAt: daysAgo(NOW, randomInt(1, 7)),
        createdAt: SEASON_START,
      },
    })
  }

  return { association, adminUser }
}

/**
 * Seed Dashboard Config (Idempotent)
 * Creates or updates the dashboard config for the association
 */
async function seedDashboardConfig(associationId: string) {
  // Check if config exists
  const existing = await prisma.dashboardConfig.findUnique({
    where: { associationId },
  })

  if (existing) {
    // Update existing config
    return await prisma.dashboardConfig.update({
      where: { associationId },
      data: {
        budgetWarningPct: 80.0,
        budgetCriticalPct: 95.0,
        bankWarningDays: 30,
        bankCriticalDays: 60,
        approvalsWarningCount: 5,
        approvalsCriticalCount: 10,
        inactivityWarningDays: 21,
      },
    })
  }

  // Create new config
  return await prisma.dashboardConfig.create({
    data: {
      associationId,
      budgetWarningPct: 80.0,
      budgetCriticalPct: 95.0,
      bankWarningDays: 30,
      bankCriticalDays: 60,
      approvalsWarningCount: 5,
      approvalsCriticalCount: 10,
      inactivityWarningDays: 21,
    },
  })
}

/**
 * Seed Association Rules (Idempotent)
 * Uses upserts to create or update rules based on (associationId, name)
 */
async function seedRules(associationId: string) {
  const rules = []

  // Rule 1: Max Budget for House League teams
  const houseBudgetRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'House League Budget Cap',
      },
    },
    update: {
      ruleType: 'MAX_BUDGET',
      description: 'Maximum total budget for House League teams',
      isActive: true,
      config: {
        maxAmount: 15000,
        currency: 'CAD',
      },
      teamTypeFilter: ['HOUSE_LEAGUE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'MAX_BUDGET',
      name: 'House League Budget Cap',
      description: 'Maximum total budget for House League teams',
      isActive: true,
      config: {
        maxAmount: 15000,
        currency: 'CAD',
      },
      teamTypeFilter: ['HOUSE_LEAGUE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
  })
  rules.push(houseBudgetRule)

  // Rule 2: Max Budget for Representative teams (AA and above)
  const repBudgetRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'Rep Teams (AA+) Budget Cap',
      },
    },
    update: {
      ruleType: 'MAX_BUDGET',
      description: 'Maximum total budget for Representative teams at AA level and above',
      isActive: true,
      config: {
        maxAmount: 25000,
        currency: 'CAD',
      },
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: ['AA', 'AAA'],
    },
    create: {
      associationId,
      ruleType: 'MAX_BUDGET',
      name: 'Rep Teams (AA+) Budget Cap',
      description: 'Maximum total budget for Representative teams at AA level and above',
      isActive: true,
      config: {
        maxAmount: 25000,
        currency: 'CAD',
      },
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: ['AA', 'AAA'],
    },
  })
  rules.push(repBudgetRule)

  // Rule 3: Max Assessment for all teams (U13 and younger)
  const youngAssessmentRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'U13 and Under Assessment Cap',
      },
    },
    update: {
      ruleType: 'MAX_ASSESSMENT',
      description: 'Maximum registration fee per player for U13 and younger divisions',
      isActive: true,
      config: {
        maxAmount: 2500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: ['U7', 'U9', 'U11', 'U13'],
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'MAX_ASSESSMENT',
      name: 'U13 and Under Assessment Cap',
      description: 'Maximum registration fee per player for U13 and younger divisions',
      isActive: true,
      config: {
        maxAmount: 2500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: ['U7', 'U9', 'U11', 'U13'],
      competitiveLevelFilter: null,
    },
  })
  rules.push(youngAssessmentRule)

  // Rule 4: Max Assessment for older divisions
  const olderAssessmentRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'U15+ Assessment Cap',
      },
    },
    update: {
      ruleType: 'MAX_ASSESSMENT',
      description: 'Maximum registration fee per player for U15 and U18 divisions',
      isActive: true,
      config: {
        maxAmount: 3500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: ['U15', 'U18'],
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'MAX_ASSESSMENT',
      name: 'U15+ Assessment Cap',
      description: 'Maximum registration fee per player for U15 and U18 divisions',
      isActive: true,
      config: {
        maxAmount: 3500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: ['U15', 'U18'],
      competitiveLevelFilter: null,
    },
  })
  rules.push(olderAssessmentRule)

  // Rule 5: Max Buyout for all teams
  const buyoutRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'Fundraising Buyout Cap',
      },
    },
    update: {
      ruleType: 'MAX_BUYOUT',
      description: 'Maximum fundraising buyout amount per family',
      isActive: true,
      config: {
        maxAmount: 500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'MAX_BUYOUT',
      name: 'Fundraising Buyout Cap',
      description: 'Maximum fundraising buyout amount per family',
      isActive: true,
      config: {
        maxAmount: 500,
        currency: 'CAD',
      },
      teamTypeFilter: null,
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
  })
  rules.push(buyoutRule)

  // Rule 6: Zero Balance for all Rep teams
  const zeroBalanceRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'Rep Teams Zero Balance Requirement',
      },
    },
    update: {
      ruleType: 'ZERO_BALANCE',
      description: 'All Representative team budgets must balance to zero',
      isActive: true,
      config: {
        tolerance: 50,
        requireBalancedBudget: true,
        currency: 'CAD',
      },
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'ZERO_BALANCE',
      name: 'Rep Teams Zero Balance Requirement',
      description: 'All Representative team budgets must balance to zero',
      isActive: true,
      config: {
        tolerance: 50,
        requireBalancedBudget: true,
        currency: 'CAD',
      },
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
  })
  rules.push(zeroBalanceRule)

  // Rule 7: Approval Tiers for all teams
  const approvalTiersRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'Expense Approval Requirements',
      },
    },
    update: {
      ruleType: 'APPROVAL_TIERS',
      description: 'Approval requirements based on transaction amount',
      isActive: true,
      config: {
        currency: 'CAD',
      },
      approvalTiers: [
        { min: 0, max: 500, approvals: 1 },
        { min: 500, max: 2000, approvals: 2 },
        { min: 2000, max: 999999, approvals: 3 },
      ],
      teamTypeFilter: null,
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'APPROVAL_TIERS',
      name: 'Expense Approval Requirements',
      description: 'Approval requirements based on transaction amount',
      isActive: true,
      config: {
        currency: 'CAD',
      },
      approvalTiers: [
        { min: 0, max: 500, approvals: 1 },
        { min: 500, max: 2000, approvals: 2 },
        { min: 2000, max: 999999, approvals: 3 },
      ],
      teamTypeFilter: null,
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
  })
  rules.push(approvalTiersRule)

  // Rule 8: Required Expenses for Rep teams
  const requiredExpensesRule = await prisma.associationRule.upsert({
    where: {
      unique_association_rule_name: {
        associationId,
        name: 'Rep Teams Mandatory Categories',
      },
    },
    update: {
      ruleType: 'REQUIRED_EXPENSES',
      description: 'Required budget categories for all Representative teams',
      isActive: true,
      config: {
        enforceStrict: true,
      },
      requiredExpenses: [
        'Ice Time & Facilities',
        'Equipment & Jerseys',
        'Coaching & Officials',
        'League & Registration',
      ],
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
    create: {
      associationId,
      ruleType: 'REQUIRED_EXPENSES',
      name: 'Rep Teams Mandatory Categories',
      description: 'Required budget categories for all Representative teams',
      isActive: true,
      config: {
        enforceStrict: true,
      },
      requiredExpenses: [
        'Ice Time & Facilities',
        'Equipment & Jerseys',
        'Coaching & Officials',
        'League & Registration',
      ],
      teamTypeFilter: ['REPRESENTATIVE'],
      ageDivisionFilter: null,
      competitiveLevelFilter: null,
    },
  })
  rules.push(requiredExpensesRule)

  return rules
}

// ============================================
// VIOLATION SEEDING
// ============================================

async function seedViolations(associationId: string, rules: any[], teamIds: string[]) {
  const violations = []

  if (teamIds.length === 0 || rules.length === 0) {
    return violations
  }

  // Get the first few teams and rules for creating sample violations
  const [team1, team2, team3] = teamIds
  const budgetRule = rules.find(r => r.ruleType === 'MAX_BUDGET')
  const assessmentRule = rules.find(r => r.ruleType === 'MAX_ASSESSMENT')
  const buyoutRule = rules.find(r => r.ruleType === 'MAX_BUYOUT')

  // Violation 1: Budget Cap Exceeded (Critical)
  if (team1 && budgetRule) {
    const violation1 = await prisma.ruleViolation.create({
      data: {
        teamId: team1,
        ruleId: budgetRule.id,
        violationType: 'MAX_BUDGET_EXCEEDED',
        severity: 'CRITICAL',
        description: 'Team budget exceeds association maximum limit',
        violationData: {
          currentBudget: 27500,
          maxAllowed: 25000,
          exceeded: 2500,
          currency: 'CAD',
        },
        resolved: false,
        createdAt: new Date('2026-01-15T10:00:00Z'),
      },
    })
    violations.push(violation1)
  }

  // Violation 2: Assessment Fee Too High (Error)
  if (team2 && assessmentRule) {
    const violation2 = await prisma.ruleViolation.create({
      data: {
        teamId: team2,
        ruleId: assessmentRule.id,
        violationType: 'MAX_ASSESSMENT_EXCEEDED',
        severity: 'ERROR',
        description: 'Player assessment fee exceeds maximum allowed for age division',
        violationData: {
          currentAssessment: 2750,
          maxAllowed: 2500,
          exceeded: 250,
          currency: 'CAD',
          ageDivision: 'U13',
        },
        resolved: false,
        createdAt: new Date('2026-01-18T14:30:00Z'),
      },
    })
    violations.push(violation2)
  }

  // Violation 3: Fundraising Buyout Exceeded (Warning)
  if (team3 && buyoutRule) {
    const violation3 = await prisma.ruleViolation.create({
      data: {
        teamId: team3,
        ruleId: buyoutRule.id,
        violationType: 'MAX_BUYOUT_EXCEEDED',
        severity: 'WARNING',
        description: 'Fundraising buyout amount exceeds recommended maximum per family',
        violationData: {
          currentBuyout: 600,
          maxAllowed: 500,
          exceeded: 100,
          currency: 'CAD',
          familyCount: 3,
        },
        resolved: false,
        createdAt: new Date('2026-02-01T09:00:00Z'),
      },
    })
    violations.push(violation3)
  }

  return violations
}

// ============================================
// TEAM SEEDING (from original seed logic)
// ============================================

interface SeedTeamResult {
  playersCount: number
  transactionsCount: number
  pendingCount: number
  alertsCount: number
  auditLogsCount: number
  budgetApprovalsCount: number
}

async function seedTeam(associationId: string, cfg: TeamConfig): Promise<SeedTeamResult> {
  // Step 1: Prepare user data (don't create yet)
  const usersData = prepareTeamUsersData(cfg)

  // Step 2: Create team
  const team = await createTeam(cfg)

  // Step 3: Create actual users (now that team exists)
  const { treasurer, assistantTreasurer, president, boardMember, parents } =
    await createActualTeamUsers(
      team.id,
      usersData.treasurerData,
      usersData.assistantTreasurerData,
      usersData.presidentData,
      usersData.boardMemberData,
      usersData.parentsData
    )

  // Step 4: Link team to association
  const associationTeam = await linkTeamToAssociation(associationId, team.id, cfg, treasurer)

  // Step 5: Create team settings
  await createTeamSettings(team.id)

  // Step 6: Create bank account
  const bankAccount = await createBankAccount(team.id, cfg)

  // Step 7: Create financial snapshot
  await createFinancialSnapshot(associationTeam.id, cfg, bankAccount.id)

  // Step 8: Create families and players
  const { families, players } = await createFamiliesAndPlayers(team.id, parents, cfg)

  // Step 9: Create categories
  const categories = await createCategories(team.id, cfg)

  // Step 10: Create transactions
  const { transactions, pendingCount } = await createTransactions(
    team.id,
    cfg,
    categories,
    players,
    treasurer.id
  )

  // Step 11: Create approvals for approved expense transactions
  const approvals = await createApprovals(
    team.id,
    transactions,
    treasurer.id,
    assistantTreasurer.id
  )

  // Step 12: Create alerts
  const alerts = await createAlerts(associationId, associationTeam.id, cfg)

  // Step 13: Create audit logs
  const auditLogs = await createAuditLogs(
    team.id,
    cfg,
    treasurer.id,
    president.id,
    boardMember.id,
    transactions
  )

  // Step 14: Create budget approvals
  const budgetApprovals = await createBudgetApprovals(team.id, cfg, treasurer.id, families, parents)

  return {
    playersCount: players.length,
    transactionsCount: transactions.length,
    pendingCount,
    alertsCount: alerts.length,
    auditLogsCount: auditLogs.length,
    budgetApprovalsCount: budgetApprovals.length,
  }
}

// ============================================
// TEAM USERS DATA PREPARATION
// ============================================

function prepareTeamUsersData(cfg: TeamConfig) {
  const treasurerClerkId = generateDemoClerkId()
  const assistantTreasurerClerkId = generateDemoClerkId()
  const presidentClerkId = generateDemoClerkId()
  const boardMemberClerkId = generateDemoClerkId()

  // Generate actual person names for team roles
  const treasurerFirstName = randomChoice(FIRST_NAMES)
  const treasurerLastName = randomChoice(LAST_NAMES)
  const assistantTreasurerFirstName = randomChoice(FIRST_NAMES)
  const assistantTreasurerLastName = randomChoice(LAST_NAMES)
  const presidentFirstName = randomChoice(FIRST_NAMES)
  const presidentLastName = randomChoice(LAST_NAMES)
  const boardMemberFirstName = randomChoice(FIRST_NAMES)
  const boardMemberLastName = randomChoice(LAST_NAMES)

  const treasurerData = {
    clerkId: treasurerClerkId,
    email: `${cfg.code}.treasurer${DEMO_EMAIL_DOMAIN}`,
    name: `${treasurerFirstName} ${treasurerLastName}`,
    role: UserRole.TREASURER,
  }

  const assistantTreasurerData = {
    clerkId: assistantTreasurerClerkId,
    email: `${cfg.code}.assistant-treasurer${DEMO_EMAIL_DOMAIN}`,
    name: `${assistantTreasurerFirstName} ${assistantTreasurerLastName}`,
    role: UserRole.ASSISTANT_TREASURER,
  }

  const presidentData = {
    clerkId: presidentClerkId,
    email: `${cfg.code}.president${DEMO_EMAIL_DOMAIN}`,
    name: `${presidentFirstName} ${presidentLastName}`,
    role: UserRole.PRESIDENT,
  }

  const boardMemberData = {
    clerkId: boardMemberClerkId,
    email: `${cfg.code}.board${DEMO_EMAIL_DOMAIN}`,
    name: `${boardMemberFirstName} ${boardMemberLastName}`,
    role: UserRole.BOARD_MEMBER,
  }

  const parentsData: Array<{
    clerkId: string
    email: string
    name: string
    role: UserRole
  }> = []

  const parentsNeeded = cfg.playersCount * 2
  for (let i = 0; i < parentsNeeded; i++) {
    const first = randomChoice(FIRST_NAMES)
    const last = randomChoice(LAST_NAMES)
    parentsData.push({
      clerkId: generateDemoClerkId(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}.${cfg.code}.p${i}${DEMO_EMAIL_DOMAIN}`,
      name: `${first} ${last}`,
      role: UserRole.PARENT,
    })
  }

  return { treasurerData, assistantTreasurerData, presidentData, boardMemberData, parentsData }
}

// ============================================
// TEAM CREATION
// ============================================

async function createTeam(cfg: TeamConfig) {
  return await prisma.team.create({
    data: {
      name: cfg.name,
      teamType: TeamType.REPRESENTATIVE,
      ageDivision: cfg.ageDivision,
      competitiveLevel: cfg.competitiveLevel,
      season: DEMO_SEASON,
      budgetTotal: cfg.budgetTotal,
      seasonStartDate: SEASON_START,
      seasonEndDate: SEASON_END,
      associationName: 'Newmarket Minor Hockey Association',
      createdAt: SEASON_START,
      updatedAt: NOW,
    },
  })
}

// ============================================
// TEAM USERS (ACTUAL CREATION)
// ============================================

async function createActualTeamUsers(
  teamId: string,
  treasurerData: any,
  assistantTreasurerData: any,
  presidentData: any,
  boardMemberData: any,
  parentsData: any[]
) {
  const treasurer = await prisma.user.create({
    data: { ...treasurerData, teamId, createdAt: SEASON_START },
  })

  const assistantTreasurer = await prisma.user.create({
    data: { ...assistantTreasurerData, teamId, createdAt: SEASON_START },
  })

  const president = await prisma.user.create({
    data: { ...presidentData, teamId, createdAt: SEASON_START },
  })

  const boardMember = await prisma.user.create({
    data: { ...boardMemberData, teamId, createdAt: SEASON_START },
  })

  // Create parents sequentially to avoid connection pool timeout
  const parents: any[] = []
  for (let i = 0; i < parentsData.length; i++) {
    const pd = parentsData[i]
    const parent = await prisma.user.create({
      data: { ...pd, teamId, createdAt: SEASON_START },
    })
    parents.push(parent)

    // Progress indicator for large batches
    if ((i + 1) % 10 === 0 || i === parentsData.length - 1) {
      process.stdout.write(`\r   Creating users: ${i + 1}/${parentsData.length}`)
    }
  }
  console.log() // New line after progress

  return { treasurer, assistantTreasurer, president, boardMember, parents }
}

// ============================================
// LINK TEAM TO ASSOCIATION
// ============================================

async function linkTeamToAssociation(
  associationId: string,
  teamId: string,
  cfg: TeamConfig,
  treasurer: any
) {
  return await prisma.associationTeam.create({
    data: {
      associationId,
      teamId,
      teamName: cfg.name,
      division: cfg.ageDivision,
      season: DEMO_SEASON,
      isActive: true,
      treasurerName: treasurer.name,
      treasurerEmail: treasurer.email,
      connectedAt: SEASON_START,
      lastSyncedAt: daysAgo(NOW, randomInt(0, 3)),
      createdAt: SEASON_START,
      updatedAt: NOW,
    },
  })
}

// ============================================
// TEAM SETTINGS
// ============================================

async function createTeamSettings(teamId: string) {
  return await prisma.teamSettings.create({
    data: {
      teamId,
      dualApprovalEnabled: true,
      dualApprovalThreshold: 200.0,
      receiptRequired: true,
      allowSelfReimbursement: false,
      duplicateDetectionEnabled: true,
      duplicateDetectionWindow: 7,
      allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
    },
  })
}

// ============================================
// BANK ACCOUNT
// ============================================

async function createBankAccount(teamId: string, cfg: TeamConfig) {
  // Calculate realistic cash position based on income vs expenses
  // Income comes from registration fees + fundraising
  const feeRange = FAMILY_FEE_RANGE[cfg.competitiveLevel]
  const avgFee = (feeRange.min + feeRange.max) / 2
  const registrationIncome = cfg.playersCount * avgFee

  // Estimate fundraising income (~6 events over season at avg $800 each)
  const fundraisingIncome = 6 * 800

  const totalIncome = registrationIncome + fundraisingIncome

  // Expenses spent so far
  const expensesSpent = cfg.budgetTotal * cfg.percentSpent

  // Cash position = income collected - expenses paid + small timing variance
  // This gives a realistic small positive or negative balance
  const currentBalance = totalIncome - expensesSpent + randomInt(-500, 1500)

  return await prisma.bankAccount.create({
    data: {
      teamId,
      accountName: `${cfg.name} Operating Account`,
      accountType: BankAccountType.CHECKING,
      lastFour: String(randomInt(1000, 9999)),
      currentBalance,
      isActive: true,
      createdAt: SEASON_START,
    },
  })
}

// ============================================
// FINANCIAL SNAPSHOT
// ============================================

async function createFinancialSnapshot(
  associationTeamId: string,
  cfg: TeamConfig,
  bankAccountId: string
) {
  const spent = cfg.budgetTotal * cfg.percentSpent
  const remaining = cfg.budgetTotal - spent
  const bankReconciledThrough = daysAgo(NOW, cfg.bankReconciliationDaysAgo)

  // Calculate health score (0-100)
  let healthScore = 100
  if (cfg.percentSpent >= 0.95) healthScore -= 30
  else if (cfg.percentSpent >= 0.85) healthScore -= 15

  if (cfg.bankReconciliationDaysAgo >= 60) healthScore -= 25
  else if (cfg.bankReconciliationDaysAgo >= 30) healthScore -= 10

  if (cfg.pendingReviewsCount >= 10) healthScore -= 20
  else if (cfg.pendingReviewsCount >= 5) healthScore -= 10

  return await prisma.teamFinancialSnapshot.create({
    data: {
      associationTeamId,
      snapshotAt: NOW,
      healthStatus: cfg.healthStatus,
      healthScore: Math.max(0, healthScore),
      budgetTotal: cfg.budgetTotal,
      spent,
      remaining,
      percentUsed: cfg.percentSpent * 100,
      pendingReviews: cfg.pendingReviewsCount,
      missingReceipts: randomInt(0, 3),
      bankReconciledThrough,
      bankConnected: true,
      lastActivityAt: daysAgo(NOW, randomInt(0, 3)),
      createdAt: NOW,
    },
  })
}

// ============================================
// FAMILIES & PLAYERS
// ============================================

async function createFamiliesAndPlayers(teamId: string, parents: any[], cfg: TeamConfig) {
  const families: any[] = []
  const players: any[] = []

  for (let i = 0; i < cfg.playersCount; i++) {
    const parent1 = parents[i * 2]
    const parent2 = parents[i * 2 + 1]

    const lastName = randomChoice(LAST_NAMES)
    const familyName = `${lastName} Family`

    const family = await prisma.family.create({
      data: {
        teamId,
        familyName,
        primaryName: parent1.name,
        primaryEmail: parent1.email,
        primaryPhone: `416-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        secondaryName: parent2.name,
        secondaryEmail: parent2.email,
        secondaryPhone: `416-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        createdAt: SEASON_START,
      },
    })

    families.push(family)

    const firstName = randomChoice(FIRST_NAMES)
    const jerseyNumber = String(randomInt(1, 99))
    const positions = ['Center', 'Left Wing', 'Right Wing', 'Defense', 'Goalie']

    const player = await prisma.player.create({
      data: {
        teamId,
        familyId: family.id,
        firstName,
        lastName,
        jerseyNumber,
        position: randomChoice(positions),
        dateOfBirth: new Date(
          `${2025 - parseInt(cfg.ageDivision.substring(1))}-${randomInt(1, 12)}-${randomInt(1, 28)}`
        ),
        status: PlayerStatus.ACTIVE,
        createdAt: SEASON_START,
      },
    })

    players.push(player)
  }

  return { families, players }
}

// ============================================
// CATEGORIES
// ============================================

async function createCategories(teamId: string, cfg: TeamConfig) {
  const categories: any[] = []

  for (const categoryConfig of BUDGET_CATEGORY_CONFIG) {
    const allocated = (cfg.budgetTotal * categoryConfig.percent) / 100

    const mainCategory = await prisma.category.create({
      data: {
        teamId,
        name: categoryConfig.heading,
        heading: categoryConfig.heading,
        color: getColorForHeading(categoryConfig.heading),
        type: categoryConfig.heading.includes('Income')
          ? CategoryType.INCOME
          : CategoryType.EXPENSE,
        sortOrder: categories.length,
        isDefault: true,
        isActive: true,
        createdAt: SEASON_START,
      },
    })

    // Create budget allocation
    await prisma.budgetAllocation.create({
      data: {
        teamId,
        categoryId: mainCategory.id,
        season: DEMO_SEASON,
        allocated,
        createdAt: SEASON_START,
      },
    })

    categories.push(mainCategory)
  }

  // Add income categories
  const incomeCategories = [
    { name: 'Registration Fees', heading: 'Fundraising & Income' },
    { name: 'Fundraising Events', heading: 'Fundraising & Income' },
  ]

  for (const inc of incomeCategories) {
    const cat = await prisma.category.create({
      data: {
        teamId,
        name: inc.name,
        heading: inc.heading,
        color: '#14B8A6',
        type: CategoryType.INCOME,
        sortOrder: categories.length,
        isDefault: true,
        isActive: true,
        createdAt: SEASON_START,
      },
    })
    categories.push(cat)
  }

  return categories
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
// TRANSACTIONS
// ============================================

async function createTransactions(
  teamId: string,
  cfg: TeamConfig,
  categories: any[],
  players: any[],
  treasurerId: string
) {
  const transactions: any[] = []
  let pendingCount = 0

  // Helper to find category by heading
  const findCategory = (heading: string) => categories.find(c => c.heading === heading)
  // Helper to find category by name
  const findCategoryByName = (name: string) => categories.find(c => c.name === name)

  // 1. Registration income (September)
  const registrationCat = findCategoryByName('Registration Fees')
  if (registrationCat) {
    process.stdout.write('   Creating registration income...')
    const range = FAMILY_FEE_RANGE[cfg.competitiveLevel]
    for (const player of players) {
      const fee = randomInt(range.min, range.max)
      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.INCOME,
          status: TransactionStatus.VALIDATED,
          amount: fee,
          categoryId: registrationCat.id,
          vendor: 'Registration Fees',
          description: `Season registration for ${player.firstName} ${player.lastName}`,
          transactionDate: randomDateBetween(SEASON_START, addDays(SEASON_START, 30)),
          createdBy: treasurerId,
          createdAt: SEASON_START,
        },
      })
      transactions.push(tx)
    }
    console.log(` ${transactions.length} transactions`)
  }

  // 2. Equipment purchases (September)
  const equipmentCat = findCategory('Equipment & Jerseys')
  if (equipmentCat) {
    const equipmentBudget = cfg.budgetTotal * 0.15 * 0.85
    let spent = 0

    while (spent < equipmentBudget) {
      const amount = randomInt(500, 2500)
      spent += amount

      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount,
          categoryId: equipmentCat.id,
          vendor: randomChoice(VENDORS.retail),
          description: 'Team equipment purchase',
          transactionDate: randomDateBetween(SEASON_START, addDays(SEASON_START, 30)),
          receiptUrl: receiptUrl(cfg.code, SEASON_START),
          createdBy: treasurerId,
          createdAt: SEASON_START,
        },
      })
      transactions.push(tx)
    }
  }

  // 3. Monthly ice time (October - February)
  const iceCat = findCategory('Ice Time & Facilities')
  if (iceCat) {
    let monthStart = new Date('2025-10-01T00:00:00Z')
    while (monthStart < NOW) {
      const amount = randomInt(2000, 4000)
      const txDate = randomDateBetween(monthStart, addDays(monthStart, 7))

      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount,
          categoryId: iceCat.id,
          vendor: randomChoice(VENDORS.arenas),
          description: 'Monthly ice rental',
          transactionDate: txDate,
          receiptUrl: receiptUrl(cfg.code, txDate),
          createdBy: treasurerId,
          createdAt: txDate,
        },
      })
      transactions.push(tx)

      monthStart = addDays(monthStart, 30)
    }
  }

  // 4. Tournament fees (Oct, Nov, Jan)
  const tournamentCat = findCategory('Travel & Tournaments')
  if (tournamentCat) {
    const tournamentDates = [
      new Date('2025-10-10T00:00:00Z'),
      new Date('2025-11-10T00:00:00Z'),
      new Date('2026-01-10T00:00:00Z'),
    ]

    for (const tourneyDate of tournamentDates) {
      const amount = randomInt(400, 800)
      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount,
          categoryId: tournamentCat.id,
          vendor: 'Tournament Organizer',
          description: 'Tournament entry fee',
          transactionDate: tourneyDate,
          receiptUrl: receiptUrl(cfg.code, tourneyDate),
          createdBy: treasurerId,
          createdAt: daysAgo(tourneyDate, 7),
        },
      })
      transactions.push(tx)
    }
  }

  // 5. Weekly referee fees
  const refCat = findCategory('Coaching & Officials')
  if (refCat) {
    let gameDate = new Date('2025-10-05T00:00:00Z')
    while (gameDate < NOW) {
      const amount = randomInt(120, 220)
      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount,
          categoryId: refCat.id,
          vendor: 'Game Officials',
          description: 'Referee fees',
          transactionDate: gameDate,
          createdBy: treasurerId,
          createdAt: gameDate,
        },
      })
      transactions.push(tx)
      gameDate = addDays(gameDate, 7)
    }
  }

  // 6. Travel & hotels (tournament weekends)
  if (tournamentCat) {
    const tournamentWeekends = [
      new Date('2025-10-18T00:00:00Z'),
      new Date('2025-11-22T00:00:00Z'),
      new Date('2026-01-24T00:00:00Z'),
    ]

    for (const weekend of tournamentWeekends) {
      // Hotel
      const hotelAmount = randomInt(600, 1000)
      const hotelTx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount: hotelAmount,
          categoryId: tournamentCat.id,
          vendor: randomChoice(VENDORS.hotels),
          description: 'Tournament hotel accommodation',
          transactionDate: weekend,
          receiptUrl: receiptUrl(cfg.code, weekend),
          createdBy: treasurerId,
          createdAt: daysAgo(weekend, 14),
        },
      })
      transactions.push(hotelTx)

      // Gas
      const gasAmount = randomInt(150, 350)
      const gasTx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.EXPENSE,
          status: TransactionStatus.VALIDATED,
          amount: gasAmount,
          categoryId: tournamentCat.id,
          vendor: randomChoice(VENDORS.gas),
          description: 'Team travel fuel',
          transactionDate: daysAgo(weekend, 1),
          receiptUrl: receiptUrl(cfg.code, daysAgo(weekend, 1)),
          createdBy: treasurerId,
          createdAt: daysAgo(weekend, 1),
        },
      })
      transactions.push(gasTx)
    }
  }

  // 7. Fundraising income
  const fundraisingCat = findCategoryByName('Fundraising Events')
  if (fundraisingCat) {
    let fundraisingDate = new Date('2025-10-05T00:00:00Z')
    const fundraisingEvents = ['Bottle drive', '50/50 draw', 'Raffle night', 'Pub night fundraiser']

    while (fundraisingDate < NOW) {
      const amount = randomInt(500, 1500)
      const tx = await prisma.transaction.create({
        data: {
          teamId,
          type: TransactionType.INCOME,
          status: TransactionStatus.VALIDATED,
          amount,
          categoryId: fundraisingCat.id,
          vendor: randomChoice(fundraisingEvents),
          description: 'Fundraising income',
          transactionDate: fundraisingDate,
          createdBy: treasurerId,
          createdAt: fundraisingDate,
        },
      })
      transactions.push(tx)
      fundraisingDate = addDays(fundraisingDate, 21)
    }
  }

  // 8. Exception transactions (validation failures)
  for (let i = 0; i < cfg.pendingReviewsCount; i++) {
    const anyCat = randomChoice(categories.filter(c => c.type === CategoryType.EXPENSE))
    const amount = randomInt(150, 800)
    const txDate = randomDateBetween(addDays(NOW, -21), NOW)
    const needsReceipt = amount >= MANDATORY_RECEIPT_THRESHOLD
    const hasReceipt = needsReceipt ? Math.random() > 0.7 : false // 30% have receipts if required

    const tx = await prisma.transaction.create({
      data: {
        teamId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.EXCEPTION,
        exception_severity: needsReceipt && !hasReceipt ? 'MEDIUM' : 'LOW',
        amount,
        categoryId: anyCat.id,
        vendor: randomChoice([...VENDORS.retail, ...VENDORS.gas]),
        description: 'Expense requiring review',
        transactionDate: txDate,
        receiptUrl: hasReceipt ? receiptUrl(cfg.code, txDate) : undefined,
        createdBy: treasurerId,
        createdAt: txDate,
        validation_json: {
          compliant: false,
          violations: needsReceipt && !hasReceipt
            ? [{ code: 'MISSING_RECEIPT', severity: 'ERROR', message: 'Receipt required for transactions $100 or more' }]
            : [{ code: 'REQUIRES_REVIEW', severity: 'WARNING', message: 'Transaction requires manual review' }],
          score: needsReceipt && !hasReceipt ? 70 : 85,
          validatedAt: txDate.toISOString(),
        },
      },
    })
    transactions.push(tx)
    pendingCount++
  }

  // 9. A few rejected transactions
  for (let i = 0; i < 2; i++) {
    const anyCat = randomChoice(categories.filter(c => c.type === CategoryType.EXPENSE))
    const amount = randomInt(100, 400)
    const txDate = randomDateBetween(addDays(NOW, -60), addDays(NOW, -30))

    const tx = await prisma.transaction.create({
      data: {
        teamId,
        type: TransactionType.EXPENSE,
        status: TransactionStatus.REJECTED,
        amount,
        categoryId: anyCat.id,
        vendor: 'Miscellaneous',
        description: 'Rejected expense (demo)',
        transactionDate: txDate,
        createdBy: treasurerId,
        createdAt: txDate,
      },
    })
    transactions.push(tx)
  }

  return { transactions, pendingCount }
}

// ============================================
// APPROVALS
// ============================================

async function createApprovals(
  teamId: string,
  transactions: any[],
  treasurerId: string,
  assistantTreasurerId: string
) {
  const approvals: any[] = []
  const approvalComments = [
    'Approved - looks good',
    'Approved',
    'Receipt verified, approved',
    null, // No comment
    null,
    'Approved for payment',
  ]

  for (const tx of transactions) {
    // Only create approvals for APPROVED expense transactions
    if (tx.status === TransactionStatus.APPROVED && tx.type === TransactionType.EXPENSE) {
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : Number(tx.amount)

      if (amount > 200) {
        // Dual approval required (Treasurer + Assistant Treasurer)

        // First approval (Treasurer)
        const firstApprovalDate = addDays(tx.createdAt, randomInt(0, 1))
        const firstApproval = await prisma.approval.create({
          data: {
            teamId,
            transactionId: tx.id,
            approvedBy: treasurerId,
            createdBy: tx.createdBy,
            status: ApprovalStatus.APPROVED,
            approvedAt: firstApprovalDate,
            comment: randomChoice(approvalComments),
          },
        })
        approvals.push(firstApproval)

        // Second approval (Assistant Treasurer) - comes after first
        const secondApprovalDate = addDays(firstApprovalDate, randomInt(0, 2))
        const secondApproval = await prisma.approval.create({
          data: {
            teamId,
            transactionId: tx.id,
            approvedBy: assistantTreasurerId,
            createdBy: tx.createdBy,
            status: ApprovalStatus.APPROVED,
            approvedAt: secondApprovalDate,
            comment: randomChoice(approvalComments),
          },
        })
        approvals.push(secondApproval)
      } else {
        // Single approval (Treasurer only)
        const approvalDate = addDays(tx.createdAt, randomInt(0, 1))
        const approval = await prisma.approval.create({
          data: {
            teamId,
            transactionId: tx.id,
            approvedBy: treasurerId,
            createdBy: tx.createdBy,
            status: ApprovalStatus.APPROVED,
            approvedAt: approvalDate,
            comment: randomChoice(approvalComments),
          },
        })
        approvals.push(approval)
      }
    }
  }

  console.log(`   Created ${approvals.length} approval records`)
  return approvals
}

// ============================================
// ALERTS
// ============================================

async function createAlerts(associationId: string, associationTeamId: string, cfg: TeamConfig) {
  const alerts: any[] = []
  const percentUsed = cfg.percentSpent * 100

  // Budget utilization alerts
  if (percentUsed >= 95) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'BUDGET_UTILIZATION',
        severity: 'critical',
        title: 'Critical Budget Usage',
        description: `Team has used ${percentUsed.toFixed(1)}% of its budget`,
        status: 'active',
        createdAt: daysAgo(NOW, randomInt(1, 10)),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 3)),
      },
    })
    alerts.push(alert)
  } else if (percentUsed >= 85) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'BUDGET_UTILIZATION',
        severity: 'warning',
        title: 'High Budget Usage',
        description: `Team has used ${percentUsed.toFixed(1)}% of its budget`,
        status: 'active',
        createdAt: daysAgo(NOW, randomInt(5, 20)),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 3)),
      },
    })
    alerts.push(alert)
  }

  // Bank reconciliation alerts
  if (cfg.bankReconciliationDaysAgo >= 60) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'BANK_RECONCILIATION',
        severity: 'critical',
        title: 'Bank Reconciliation Overdue',
        description: `Bank reconciliation overdue by ${cfg.bankReconciliationDaysAgo} days`,
        status: 'active',
        createdAt: daysAgo(NOW, cfg.bankReconciliationDaysAgo - 60),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 3)),
      },
    })
    alerts.push(alert)
  } else if (cfg.bankReconciliationDaysAgo >= 30) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'BANK_RECONCILIATION',
        severity: 'warning',
        title: 'Bank Reconciliation Due Soon',
        description: `Bank reconciliation overdue by ${cfg.bankReconciliationDaysAgo} days`,
        status: 'active',
        createdAt: daysAgo(NOW, cfg.bankReconciliationDaysAgo - 30),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 3)),
      },
    })
    alerts.push(alert)
  }

  // Pending reviews alerts
  if (cfg.pendingReviewsCount >= 10) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'PENDING_REVIEW',
        severity: 'critical',
        title: 'Many Pending Reviews',
        description: `${cfg.pendingReviewsCount} pending reviews require attention`,
        status: 'active',
        createdAt: daysAgo(NOW, randomInt(3, 15)),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 2)),
      },
    })
    alerts.push(alert)
  } else if (cfg.pendingReviewsCount >= 5) {
    const alert = await prisma.alert.create({
      data: {
        associationId,
        associationTeamId,
        alertType: 'PENDING_REVIEW',
        severity: 'warning',
        title: 'Pending Reviews',
        description: `${cfg.pendingReviewsCount} pending reviews require attention`,
        status: 'active',
        createdAt: daysAgo(NOW, randomInt(3, 10)),
        lastTriggeredAt: daysAgo(NOW, randomInt(0, 2)),
      },
    })
    alerts.push(alert)
  }

  return alerts
}

// ============================================
// AUDIT LOGS
// ============================================

async function createAuditLogs(
  teamId: string,
  cfg: TeamConfig,
  treasurerId: string,
  presidentId: string,
  boardMemberId: string,
  transactions: any[]
) {
  const auditLogs: any[] = []

  // User login events (10-15 per key role)
  for (let i = 0; i < 12; i++) {
    const log = await prisma.auditLog.create({
      data: {
        teamId,
        userId: treasurerId,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: treasurerId,
        metadata: {
          is_demo: true,
          source: DEMO_SOURCE,
          device: 'Chrome on Windows',
          ip: `192.168.1.${randomInt(10, 250)}`,
        },
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        createdAt: randomDateBetween(SEASON_START, NOW),
      },
    })
    auditLogs.push(log)
  }

  for (let i = 0; i < 8; i++) {
    const log = await prisma.auditLog.create({
      data: {
        teamId,
        userId: presidentId,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: presidentId,
        metadata: {
          is_demo: true,
          source: DEMO_SOURCE,
          device: 'Safari on iPhone',
          ip: `192.168.1.${randomInt(10, 250)}`,
        },
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        createdAt: randomDateBetween(SEASON_START, NOW),
      },
    })
    auditLogs.push(log)
  }

  // Transaction events (create, approve, reject)
  for (const tx of transactions.slice(0, 60)) {
    // CREATE event
    const createLog = await prisma.auditLog.create({
      data: {
        teamId,
        userId: treasurerId,
        action: 'CREATE_TRANSACTION',
        entityType: 'Transaction',
        entityId: tx.id,
        newValues: {
          id: tx.id,
          type: tx.type,
          amount: tx.amount.toString(),
          vendor: tx.vendor,
          status: tx.status,
        },
        metadata: {
          is_demo: true,
          source: DEMO_SOURCE,
          transactionType: tx.type,
          amount: tx.amount.toString(),
        },
        createdAt: tx.createdAt,
      },
    })
    auditLogs.push(createLog)

    // APPROVE/REJECT events
    if (tx.status === TransactionStatus.APPROVED) {
      const approverId = randomChoice([presidentId, boardMemberId])
      const approveLog = await prisma.auditLog.create({
        data: {
          teamId,
          userId: approverId,
          action: 'APPROVE_TRANSACTION',
          entityType: 'Transaction',
          entityId: tx.id,
          oldValues: { status: 'PENDING' },
          newValues: { status: 'APPROVED' },
          metadata: {
            is_demo: true,
            source: DEMO_SOURCE,
            transactionId: tx.id,
            amount: tx.amount.toString(),
          },
          createdAt: addDays(tx.createdAt, randomInt(0, 2)),
        },
      })
      auditLogs.push(approveLog)
    } else if (tx.status === TransactionStatus.REJECTED) {
      const approverId = randomChoice([presidentId, boardMemberId])
      const rejectLog = await prisma.auditLog.create({
        data: {
          teamId,
          userId: approverId,
          action: 'REJECT_TRANSACTION',
          entityType: 'Transaction',
          entityId: tx.id,
          oldValues: { status: 'PENDING' },
          newValues: { status: 'REJECTED' },
          metadata: {
            is_demo: true,
            source: DEMO_SOURCE,
            transactionId: tx.id,
            reason: 'Out of policy (demo)',
          },
          createdAt: addDays(tx.createdAt, randomInt(0, 3)),
        },
      })
      auditLogs.push(rejectLog)
    }
  }

  // Settings change events
  const settingsLog = await prisma.auditLog.create({
    data: {
      teamId,
      userId: treasurerId,
      action: 'UPDATE_SETTINGS',
      entityType: 'TeamSettings',
      entityId: teamId,
      oldValues: { dualApprovalThreshold: '100.00' },
      newValues: { dualApprovalThreshold: '200.00' },
      metadata: {
        is_demo: true,
        source: DEMO_SOURCE,
        setting: 'dualApprovalThreshold',
      },
      createdAt: randomDateBetween(SEASON_START, addDays(SEASON_START, 30)),
    },
  })
  auditLogs.push(settingsLog)

  return auditLogs
}

// ============================================
// BUDGET APPROVALS
// ============================================

async function createBudgetApprovals(
  teamId: string,
  cfg: TeamConfig,
  treasurerId: string,
  families: any[],
  parents: any[]
) {
  const budgetApprovals: any[] = []

  // 1. COMPLETED Initial Budget Approval (all families acknowledged)
  const initialBudgetApproval = await prisma.budgetApproval.create({
    data: {
      teamId,
      season: DEMO_SEASON,
      budgetTotal: cfg.budgetTotal,
      approvalType: BudgetApprovalType.INITIAL,
      description: 'Initial Season Budget for approval',
      requiredCount: families.length,
      acknowledgedCount: families.length,
      status: BudgetApprovalStatus.COMPLETED,
      createdBy: treasurerId,
      createdAt: addDays(SEASON_START, 5),
      completedAt: addDays(SEASON_START, 15),
      expiresAt: addDays(SEASON_START, 30),
    },
  })
  budgetApprovals.push(initialBudgetApproval)

  // Create acknowledgments for all families (all acknowledged)
  for (let i = 0; i < families.length; i++) {
    const family = families[i]
    const parent = parents[i * 2] // Use first parent for each family
    const acknowledgedDate = randomDateBetween(addDays(SEASON_START, 5), addDays(SEASON_START, 15))
    await prisma.acknowledgment.create({
      data: {
        budgetApprovalId: initialBudgetApproval.id,
        userId: parent.id,
        familyName: family.familyName,
        email: family.primaryEmail,
        acknowledged: true,
        acknowledgedAt: acknowledgedDate,
        viewedAt: acknowledgedDate,
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: randomChoice([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]),
      },
    })
  }

  // Note: Budget revisions removed as per requirements - no voting on mid-season budget changes

  // 3. PENDING Financial Report (recently created, very few acknowledgments)
  const reportApproval = await prisma.budgetApproval.create({
    data: {
      teamId,
      season: DEMO_SEASON,
      budgetTotal: cfg.budgetTotal * cfg.percentSpent, // Current spending
      approvalType: BudgetApprovalType.REPORT,
      description: 'Monthly Financial Report - January 2026',
      requiredCount: families.length,
      acknowledgedCount: Math.floor(families.length * 0.2), // Only 20% acknowledged
      status: BudgetApprovalStatus.PENDING,
      createdBy: treasurerId,
      createdAt: daysAgo(NOW, 3),
      expiresAt: addDays(NOW, 7), // Due in 1 week
    },
  })
  budgetApprovals.push(reportApproval)

  // Create acknowledgments (20% acknowledged, 80% pending)
  const reportAckCount = Math.floor(families.length * 0.2)
  for (let i = 0; i < families.length; i++) {
    const family = families[i]
    const parent = parents[i * 2] // Use first parent for each family
    const isAcknowledged = i < reportAckCount
    const acknowledgedDate = isAcknowledged ? randomDateBetween(daysAgo(NOW, 3), NOW) : null

    await prisma.acknowledgment.create({
      data: {
        budgetApprovalId: reportApproval.id,
        userId: parent.id,
        familyName: family.familyName,
        email: family.primaryEmail,
        acknowledged: isAcknowledged,
        acknowledgedAt: acknowledgedDate,
        viewedAt: acknowledgedDate || daysAgo(NOW, randomInt(0, 3)),
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: randomChoice([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]),
      },
    })
  }

  console.log(`   Created ${budgetApprovals.length} budget approvals with acknowledgments`)
  return budgetApprovals
}

// ============================================
// RUNNER
// ============================================

main()
  .catch(e => {
    console.error('❌ Error while seeding demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
