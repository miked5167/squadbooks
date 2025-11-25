/**
 * Test Database Connection
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function main() {
  console.log('🔌 Testing database connection...\n')

  try {
    // Simple query to test connection
    await prisma.$connect()
    console.log('✅ Connected to database!')

    // Try a simple raw query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`
    console.log('✅ Query executed:', result)

  } catch (error) {
    console.error('❌ Connection failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
