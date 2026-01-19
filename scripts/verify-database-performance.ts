#!/usr/bin/env tsx
import { prisma } from '@/lib/prisma'
import { getTransactionsWithCursor } from '@/lib/db/transactions'

// Colors for console output
const colors = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', reset: '\x1b[0m' }

async function main() {
  console.log('Database Performance Verification for Phase 1\n')

  // Test 1: Verify composite indexes exist
  await verifyIndexes()

  // Test 2: Test multi-team query with EXPLAIN ANALYZE
  await testMultiTeamQuery()

  // Test 3: Test cursor pagination performance
  await testCursorPagination()

  // Test 4: Simulate realistic association dashboard load
  await testAssociationDashboardLoad()

  console.log('\n✅ Performance verification complete')
}

async function verifyIndexes() {
  console.log('1. Verifying composite indexes on transactions table...')

  // Query PostgreSQL system catalogs to check indexes
  const indexes = await prisma.$queryRaw<Array<{ indexname: string; indexdef: string }>>`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'transactions'
    AND indexdef LIKE '%team_id%'
    ORDER BY indexname;
  `

  console.log(`Found ${indexes.length} indexes on transactions table:`)
  indexes.forEach(idx => console.log(`  - ${idx.indexname}`))

  // Check for required composite index
  const hasCompositeIndex = indexes.some(
    idx => idx.indexdef.includes('team_id') && idx.indexdef.includes('transaction_date')
  )

  if (hasCompositeIndex) {
    console.log(
      `${colors.green}✓${colors.reset} Composite index on (teamId, transactionDate) exists\n`
    )
  } else {
    console.log(
      `${colors.red}✗${colors.reset} Missing composite index - performance may be degraded\n`
    )
  }
}

async function testMultiTeamQuery() {
  console.log('2. Testing multi-team query performance...')

  // Get sample teams (up to 50)
  const teams = await prisma.team.findMany({ take: 50, select: { id: true } })
  const teamIds = teams.map(t => t.id)

  console.log(`Testing with ${teamIds.length} teams`)

  if (teamIds.length === 0) {
    console.log(
      `${colors.yellow}⚠${colors.reset} No teams found in database - skipping multi-team query test\n`
    )
    return
  }

  // Run EXPLAIN ANALYZE on multi-team query
  const explainResult = await prisma.$queryRaw<Array<{ 'QUERY PLAN': string }>>`
    EXPLAIN ANALYZE
    SELECT * FROM transactions
    WHERE team_id = ANY(${teamIds})
      AND deleted_at IS NULL
    ORDER BY transaction_date DESC, id DESC
    LIMIT 20;
  `

  console.log('Query execution plan:')
  explainResult.forEach(row => console.log(`  ${row['QUERY PLAN']}`))

  // Check for efficient index usage
  const plan = JSON.stringify(explainResult)
  const usesIndexScan = plan.includes('Index Scan') || plan.includes('Index Only Scan')
  const usesSeqScan = plan.includes('Seq Scan')

  if (usesIndexScan && !usesSeqScan) {
    console.log(`${colors.green}✓${colors.reset} Query uses index scan (efficient)\n`)
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} Query may not use indexes optimally\n`)
  }
}

async function testCursorPagination() {
  console.log('3. Testing cursor pagination performance...')

  const teams = await prisma.team.findMany({ take: 10, select: { id: true } })
  const teamIds = teams.map(t => t.id)

  if (teamIds.length === 0) {
    console.log(
      `${colors.yellow}⚠${colors.reset} No teams found in database - skipping cursor pagination test\n`
    )
    return
  }

  const start = Date.now()
  const result = await getTransactionsWithCursor({
    teamIds,
    limit: 50,
    filters: {},
  })
  const duration = Date.now() - start

  console.log(`Fetched ${result.items.length} transactions in ${duration}ms`)

  if (duration < 1000) {
    console.log(`${colors.green}✓${colors.reset} Query completed in <1s (${duration}ms)\n`)
  } else {
    console.log(`${colors.yellow}⚠${colors.reset} Query took ${duration}ms (target: <1000ms)\n`)
  }
}

async function testAssociationDashboardLoad() {
  console.log('4. Simulating association dashboard load (PERF-03)...')

  // Get up to 50 teams
  const teams = await prisma.team.findMany({ take: 50, select: { id: true } })
  const teamIds = teams.map(t => t.id)

  console.log(`Simulating dashboard load for association with ${teamIds.length} teams`)

  if (teamIds.length === 0) {
    console.log(
      `${colors.yellow}⚠${colors.reset} No teams found in database - skipping dashboard load test\n`
    )
    return
  }

  const start = Date.now()

  // Simulate typical dashboard queries
  const [transactions, teamCount, transactionCount] = await Promise.all([
    getTransactionsWithCursor({
      teamIds,
      limit: 50,
      filters: {},
    }),
    prisma.team.count({ where: { id: { in: teamIds } } }),
    prisma.transaction.count({
      where: {
        teamId: { in: teamIds },
        deletedAt: null,
      },
    }),
  ])

  const duration = Date.now() - start

  console.log(`Dashboard data fetched:`)
  console.log(`  - ${transactions.items.length} transactions`)
  console.log(`  - ${teamCount} teams`)
  console.log(`  - ${transactionCount} total transactions`)
  console.log(`  - Duration: ${duration}ms`)

  if (duration < 2000) {
    console.log(
      `${colors.green}✓${colors.reset} Dashboard load <2s (${duration}ms) - PERF-03 met\n`
    )
  } else {
    console.log(
      `${colors.red}✗${colors.reset} Dashboard load ${duration}ms exceeds 2s target - PERF-03 not met\n`
    )
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
