import { prisma } from '../lib/prisma'

/**
 * List all users in the database
 * Usage: npx tsx scripts/list-users.ts
 */

async function main() {
  console.log('\n📋 Fetching all users...\n')

  const users = await prisma.user.findMany({
    select: {
      clerkId: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      team: {
        select: {
          name: true,
        },
      },
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (users.length === 0) {
    console.log('No users found in database.\n')
    process.exit(0)
  }

  console.log(`Found ${users.length} user(s):\n`)

  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Clerk ID: ${user.clerkId}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Team: ${user.team.name}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   Created: ${user.createdAt.toLocaleString()}`)
    console.log('')
  })

  console.log('💡 To make yourself a TREASURER, run:')
  console.log('   npx tsx scripts/make-me-treasurer.ts <your-clerk-id>\n')
}

main()
  .catch((error) => {
    console.error('\n❌ Error fetching users:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
