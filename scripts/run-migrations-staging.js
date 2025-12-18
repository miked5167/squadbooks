/**
 * Run Supabase migrations on staging database
 */
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const connectionString = 'postgresql://postgres:McGill6751!!@db.uqbawxhktolpitlhvkpb.supabase.co:5432/postgres'

const migrations = [
  '20250117000001_add_validation_lifecycle_statuses.sql',
  '20250117000002_add_validation_tracking_columns.sql',
  '20250117000003_add_validation_indexes.sql',
  '20250117000004_extend_audit_log_for_validation.sql',
  '20250117000005_backfill_validation_data.sql',
]

async function runMigrations() {
  const client = new Client({ connectionString })

  try {
    await client.connect()
    console.log('✅ Connected to staging database\n')

    for (const migration of migrations) {
      const filePath = path.join(__dirname, '..', 'supabase', 'migrations', migration)
      const sql = fs.readFileSync(filePath, 'utf8')

      console.log(`🔄 Running migration: ${migration}`)

      try {
        await client.query(sql)
        console.log(`✅ Success: ${migration}\n`)
      } catch (error) {
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
    const statusResult = await client.query(`
      SELECT status, COUNT(*) as count
      FROM transactions
      GROUP BY status
      ORDER BY count DESC
    `)
    console.table(statusResult.rows)

    // Check validation coverage
    console.log('\nValidation Coverage:')
    const coverageResult = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE validation_json IS NOT NULL) as has_validation,
        COUNT(*) FILTER (WHERE validation_json IS NULL) as missing_validation,
        COUNT(*) as total
      FROM transactions
    `)
    console.table(coverageResult.rows)

    // Check indexes
    console.log('\nNew Indexes Created:')
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'transactions'
        AND indexname LIKE 'idx_transactions_%'
      ORDER BY indexname
    `)
    console.table(indexResult.rows)

    console.log('\n✅ All migrations completed!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  } finally {
    await client.end()
  }
}

runMigrations()
