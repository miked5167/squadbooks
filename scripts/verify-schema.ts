import { prisma } from '../lib/prisma'

async function verifySchema() {
  try {
    console.log('🔍 Verifying database schema...\n')

    // Check if tables exist by querying them
    const userCount = await prisma.user.count()
    console.log(`✅ Users table exists (${userCount} users)`)

    const transactionCount = await prisma.transaction.count()
    console.log(`✅ Transactions table exists (${transactionCount} transactions)`)

    const approvalCount = await prisma.approval.count()
    console.log(`✅ Approvals table exists (${approvalCount} approvals)`)

    const teamCount = await prisma.team.count()
    console.log(`✅ Teams table exists (${teamCount} teams)`)

    const categoryCount = await prisma.category.count()
    console.log(`✅ Categories table exists (${categoryCount} categories)`)

    // Check UserRole enum values
    const users = await prisma.user.findMany({
      select: { role: true },
      distinct: ['role']
    })
    console.log('\n📋 User roles in database:', users.map(u => u.role))

    console.log('\n✅ Schema verification complete!')
  } catch (error) {
    console.error('❌ Error verifying schema:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

verifySchema()
