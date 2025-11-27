import { prisma } from '../lib/prisma'

/**
 * Simple script to grant TREASURER role to a user
 * Usage: npx tsx scripts/make-me-treasurer.ts <clerkId>
 *
 * To find your Clerk ID:
 * 1. Sign in to the app
 * 2. Navigate to http://localhost:3000/api/debug/clerk-id
 * 3. Copy your Clerk ID
 * 4. Run: npx tsx scripts/make-me-treasurer.ts <your-clerk-id>
 */

async function main() {
  const clerkId = process.argv[2]

  if (!clerkId) {
    console.log('\n❌ Error: Clerk ID is required\n')
    console.log('Usage: npx tsx scripts/make-me-treasurer.ts <clerkId>\n')
    console.log('To find your Clerk ID:')
    console.log('1. Sign in to http://localhost:3000')
    console.log('2. Navigate to http://localhost:3000/api/debug/clerk-id')
    console.log('3. Copy your Clerk ID')
    console.log('4. Run this script with your Clerk ID\n')
    process.exit(1)
  }

  console.log(`\n🔍 Looking for user with Clerk ID: ${clerkId}...\n`)

  // Find the user
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      role: true,
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!user) {
    console.log('❌ Error: User not found with that Clerk ID\n')
    console.log('Make sure you:')
    console.log('1. Have signed up/signed in to the app')
    console.log('2. Copied the correct Clerk ID from /api/debug/clerk-id\n')
    process.exit(1)
  }

  console.log('✅ Found user:')
  console.log(`   Name: ${user.name}`)
  console.log(`   Email: ${user.email}`)
  console.log(`   Team: ${user.team.name}`)
  console.log(`   Current Role: ${user.role}\n`)

  if (user.role === 'TREASURER') {
    console.log('ℹ️  User is already a TREASURER. No changes needed.\n')
    process.exit(0)
  }

  // Update to TREASURER
  const updated = await prisma.user.update({
    where: { clerkId },
    data: { role: 'TREASURER' },
  })

  console.log('🎉 SUCCESS! User role updated:')
  console.log(`   ${user.role} → TREASURER\n`)
  console.log('You now have full TREASURER access!')
  console.log('Refresh your browser to see the changes.\n')
}

main()
  .catch((error) => {
    console.error('\n❌ Error updating user role:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
