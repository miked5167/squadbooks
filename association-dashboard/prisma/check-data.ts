import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Checking Database Data ===\n')

  // Check associations
  const associations = await prisma.association.findMany()
  console.log('Associations:', associations.length)
  associations.forEach(a => console.log(`  - ${a.name} (${a.id})`))

  // Check association users
  const users = await prisma.associationUser.findMany()
  console.log('\nAssociation Users:', users.length)
  users.forEach(u => console.log(`  - ${u.name} (${u.clerkUserId}) -> Association: ${u.associationId}`))

  // Check teams
  const teams = await prisma.associationTeam.findMany()
  console.log('\nTeams:', teams.length)
  teams.forEach(t => console.log(`  - ${t.teamName} -> Association: ${t.associationId}`))

  // Check snapshots
  const snapshots = await prisma.teamFinancialSnapshot.findMany()
  console.log('\nSnapshots:', snapshots.length)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
