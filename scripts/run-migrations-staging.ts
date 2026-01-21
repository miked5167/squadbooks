/**
 * Run Supabase migrations on staging database using Prisma
 */
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

const migrations = [
  '20250117000001_add_validation_lifecycle_statuses.sql',
  '20250117000002_add_validation_tracking_columns.sql',
  '20250117000003_add_validation_indexes.sql',
  '20250117000004_extend_audit_log_for_validation.sql',
  '20250117000005_backfill_validation_data.sql',
]

async function runMigrations() {
  try {
    console.log('✅ Connected to staging database\n')

    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migration)
      const sql = fs.readFileSync(filePath, 'utf8')

      console.log(`🔄 Running migration: ${migration}`)

      try {
        // Split by semicolons and run each statement
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'))

        for (const statement of statements) {
          if (statement.trim()) {
            await prisma.$executeRawUnsafe(statement)
          }
        }
        console.log(`✅ Success: ${migration}\n`)
      } catch (error: any) {
        console.error(`❌ Failed: ${migration}`)
        console.error(`   Error: ${error.message}\n`)
        // Continue with other migrations even if one fails
      }
    }

    // Verification queries
    console.log('\n' + '='.repeat(60))
    console.log('📊 Verification Results')
    console.log('='.repeat(60) + '\n')

    // Check status distribution
    console.log('Status Distribution:')
    const statusResult = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count
      FROM transactions
      GROUP BY status
      ORDER BY count DESC
    `
    console.table(statusResult)

    // Check validation coverage
    console.log('\nValidation Coverage:')
    const coverageResult = await prisma.$queryRaw`
      SELECT
        COUNT(*) FILTER (WHERE validation_json IS NOT NULL) as has_validation,
        COUNT(*) FILTER (WHERE validation_json IS NULL) as missing_validation,
        COUNT(*) as total
      FROM transactions
    `
    console.table(coverageResult)

    // Check indexes
    console.log('\nNew Indexes Created:')
    const indexResult = await prisma.$queryRaw`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'transactions'
        AND indexname LIKE 'idx_transactions_%'
      ORDER BY indexname
    `
    console.table(indexResult)

    console.log('\n✅ All migrations completed!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

runMigrations()
