const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findAllTreasurers() {
  try {
    // Find all users with TREASURER role
    const treasurers = await prisma.user.findMany({
      where: {
        role: 'TREASURER',
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            season: true,
          },
        },
      },
      orderBy: {
        clerkId: 'asc',
      },
    })

    console.log(`\nFound ${treasurers.length} TREASURER users:\n`)

    treasurers.forEach((treasurer) => {
      console.log('─────────────────────────────────')
      console.log('Name:', treasurer.name)
      console.log('Email:', treasurer.email)
      console.log('Clerk ID:', treasurer.clerkId)
      console.log('Team:', treasurer.team?.name || 'NO TEAM')
      console.log('Team ID:', treasurer.team?.id || 'NO TEAM')
      console.log('Active:', treasurer.isActive)
    })
    console.log('─────────────────────────────────\n')

    // Also check for user with email containing "u13-aa-storm.treasurer"
    const u13Treasurer = await prisma.user.findFirst({
      where: {
        email: {
          contains: 'u13-aa-storm.treasurer',
        },
      },
      include: {
        team: true,
      },
    })

    if (u13Treasurer) {
      console.log('\nUser with email containing "u13-aa-storm.treasurer":')
      console.log('═════════════════════════════════════════')
      console.log('Name:', u13Treasurer.name)
      console.log('Email:', u13Treasurer.email)
      console.log('Role:', u13Treasurer.role)
      console.log('Clerk ID:', u13Treasurer.clerkId)
      console.log('Team:', u13Treasurer.team?.name)
      console.log('Team ID:', u13Treasurer.teamId)
      console.log('Active:', u13Treasurer.isActive)
      console.log('═════════════════════════════════════════\n')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findAllTreasurers()
