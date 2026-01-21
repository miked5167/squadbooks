const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findU13Team() {
  try {
    // Find all teams with "U13" in the name
    const teams = await prisma.team.findMany({
      where: {
        name: {
          contains: 'U13',
        },
      },
      include: {
        users: {
          select: {
            id: true,
            clerkId: true,
            name: true,
            email: true,
            role: true,
          },
          orderBy: {
            role: 'asc',
          },
        },
      },
    })

    console.log(`\nFound ${teams.length} teams with "U13" in name:\n`)

    teams.forEach((team) => {
      console.log('═════════════════════════════════════════')
      console.log(`Team: ${team.name}`)
      console.log(`Team ID: ${team.id}`)
      console.log(`Division: ${team.division}`)
      console.log(`Season: ${team.season}`)
      console.log('Users:')
      team.users.forEach((user) => {
        console.log(`  ├─ ${user.role.padEnd(20)} ${user.name}`)
        console.log(`  │  Email: ${user.email}`)
        console.log(`  │  Clerk ID: ${user.clerkId}`)
        console.log(`  │  DB ID: ${user.id}`)
        console.log(`  │`)
      })
      console.log('═════════════════════════════════════════\n')
    })

    // Also check if there's a budget approval for U13 AA Storm
    const budgetApproval = await prisma.budgetApproval.findFirst({
      where: {
        team: {
          name: {
            contains: 'U13 AA Storm',
          },
        },
      },
      include: {
        team: true,
        acknowledgments: {
          take: 3,
        },
      },
    })

    if (budgetApproval) {
      console.log('\n✅ Found budget approval for U13 AA Storm:')
      console.log('─────────────────────────────────')
      console.log('Budget Approval ID:', budgetApproval.id)
      console.log('Team:', budgetApproval.team.name)
      console.log('Team ID:', budgetApproval.teamId)
      console.log('Budget Total:', budgetApproval.budgetTotal)
      console.log('Required Count:', budgetApproval.requiredCount)
      console.log('Acknowledgments count:', budgetApproval.acknowledgments.length)
      console.log('─────────────────────────────────\n')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findU13Team()
