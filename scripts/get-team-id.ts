/**
 * Quick script to get team IDs for testing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const teams = await prisma.associationTeam.findMany({
    select: {
      id: true,
      teamName: true,
      division: true,
      association: {
        select: {
          id: true,
          name: true,
        },
      },
      team: {
        select: {
          level: true,
        },
      },
    },
  })

  if (teams.length === 0) {
    console.log('❌ No teams found. Run seed script first.')
    console.log('   npx tsx scripts/seed-dev-test-data.ts')
    return
  }

  console.log('\n🏒 Teams in database:\n')
  teams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.teamName}`)
    console.log(`   Association: ${team.association.name}`)
    console.log(`   Level: ${team.team?.level || 'N/A'}`)
    console.log(`   Division: ${team.division || 'N/A'}`)
    console.log(`   Team ID: ${team.id}`)
    console.log(`   Association ID: ${team.association.id}`)
    console.log(`   URL: http://localhost:3000/association/${team.association.id}/teams/${team.id}\n`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
