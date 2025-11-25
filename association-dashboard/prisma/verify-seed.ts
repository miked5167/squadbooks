/**
 * Verify Seed Data
 */

import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database...\n')

  const clerkUserId = process.env.SEED_CLERK_USER_ID || 'user_35mxqUEnd8SXJxf6VCvRJW0zMTi'

  // Check associations
  const associations = await prisma.association.findMany()
  console.log(`📊 Associations: ${associations.length}`)
  associations.forEach(a => console.log(`  - ${a.name} (${a.id})`))

  // Check association users
  const users = await prisma.associationUser.findMany({
    where: { clerkUserId },
    include: { association: true }
  })
  console.log(`\n👤 Association Users for ${clerkUserId}: ${users.length}`)
  users.forEach(u => console.log(`  - ${u.name} (${u.email}) -> ${u.association?.name || 'No association'}`))

  // Check teams
  const teams = await prisma.associationTeam.count()
  console.log(`\n🏒 Teams: ${teams}`)

  // Check snapshots
  const snapshots = await prisma.teamFinancialSnapshot.count()
  console.log(`📸 Snapshots: ${snapshots}`)

  // Check alerts
  const alerts = await prisma.alert.count()
  console.log(`🚨 Alerts: ${alerts}`)

  if (users.length === 0) {
    console.log('\n❌ No user found with that Clerk ID!')
    console.log('Make sure you set SEED_CLERK_USER_ID correctly')
  } else {
    console.log('\n✅ Data looks good!')
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
