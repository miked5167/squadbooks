/**
 * Check unmigrated budget allocations and their teams
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUnmigratedBudgets() {
  console.log('🔍 Checking unmigrated budget allocations...\n')

  // Get allocations that still need migration
  const unmigrated = await prisma.budgetAllocation.findMany({
    where: {
      budgetVersionId: null,
      teamId: { not: null },
      season: { not: null },
    },
    include: {
      category: {
        include: {
          team: {
            include: {
              users: true,
            },
          },
        },
      },
    },
    orderBy: [
      { teamId: 'asc' },
      { season: 'asc' },
    ],
  })

  console.log(`Found ${unmigrated.length} unmigrated allocations\n`)

  // Group by team
  const byTeam = new Map<string, typeof unmigrated>()
  for (const alloc of unmigrated) {
    if (!byTeam.has(alloc.teamId!)) {
      byTeam.set(alloc.teamId!, [])
    }
    byTeam.get(alloc.teamId!)!.push(alloc)
  }

  console.log(`Teams with unmigrated allocations: ${byTeam.size}\n`)

  for (const [teamId, allocations] of byTeam.entries()) {
    const team = allocations[0].category.team
    console.log(`Team: ${teamId}`)
    console.log(`  Name: ${team.name}`)
    console.log(`  Season: ${allocations[0].season}`)
    console.log(`  Allocations: ${allocations.length}`)
    console.log(`  Users: ${team.users.length}`)
    if (team.users.length === 0) {
      console.log(`  ⚠️  NO USERS - Cannot migrate without creating a default user`)
    }
    console.log('')
  }

  await prisma.$disconnect()
}

checkUnmigratedBudgets().catch(console.error)
