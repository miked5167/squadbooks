const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function findTreasurer() {
  try {
    // Find U13 AA Storm Treasurer
    const treasurer = await prisma.user.findFirst({
      where: {
        email: 'u13-aa-storm.treasurer@demo.huddlebooks.app',
      },
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

    if (treasurer) {
      console.log('\n✅ Found U13 AA Storm Treasurer:')
      console.log('─────────────────────────────────')
      console.log('Database ID:', treasurer.id)
      console.log('Clerk ID:', treasurer.clerkId)
      console.log('Name:', treasurer.name)
      console.log('Email:', treasurer.email)
      console.log('Role:', treasurer.role)
      console.log('Team ID:', treasurer.team?.id)
      console.log('Team Name:', treasurer.team?.name)
      console.log('─────────────────────────────────\n')
    } else {
      console.log('\n❌ No user found with email: u13-aa-storm.treasurer@demo.huddlebooks.app\n')

      // Try to find the team and list all users
      const team = await prisma.team.findFirst({
        where: {
          name: {
            contains: 'U13 AA Storm',
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
          },
        },
      })

      if (team) {
        console.log('Found U13 AA Storm team:', team.name)
        console.log('Users on this team:')
        team.users.forEach((user) => {
          console.log(`  - ${user.role}: ${user.name} (${user.email}) - clerkId: ${user.clerkId}`)
        })
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

findTreasurer()
