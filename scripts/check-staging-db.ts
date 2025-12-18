/**
 * Check what's in the staging database
 */
import { prisma } from '../lib/prisma'

async function checkDatabase() {
  try {
    // Check if transactions table exists
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('📋 Tables in database:')
    console.table(tables)

    // Count transactions if table exists
    try {
      const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM transactions`
      console.log('\n📊 Transaction count:', count)
    } catch (e) {
      console.log('\n⚠️  No transactions table found')
    }

    // Check current enum values
    const enums = await prisma.$queryRaw`
      SELECT
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'TransactionStatus'
      ORDER BY e.enumsortorder
    `
    console.log('\n📋 TransactionStatus enum values:')
    console.table(enums)

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
