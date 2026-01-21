const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixTreasurer() {
  try {
    console.log('\n🔧 Fixing U13 AA Storm Treasurer...\n')

    // Get the correct U13 AA Storm team ID
    const correctTeam = await prisma.team.findFirst({
      where: {
        name: 'U13 AA Storm',
        id: 'cminhmzhi000gtgpcgvw5ogk9',
      },
      select: {
        id: true,
        name: true,
      },
    })

    if (!correctTeam) {
      console.error('❌ Could not find U13 AA Storm team with ID cminhmzhi000gtgpcgvw5ogk9')
      return
    }

    console.log('✅ Found correct team:', correctTeam.name, '(', correctTeam.id, ')')

    // Update Abigail Thompson to be treasurer on the correct team
    const updated = await prisma.user.update({
      where: {
        clerkId: 'demo_2025_2026_000002',
      },
      data: {
        role: 'TREASURER',
        teamId: correctTeam.id,
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

    console.log('\n✅ Successfully updated user:')
    console.log('─────────────────────────────────')
    console.log('Name:', updated.name)
    console.log('Email:', updated.email)
    console.log('Clerk ID:', updated.clerkId)
    console.log('Role:', updated.role)
    console.log('Team:', updated.team?.name)
    console.log('Team ID:', updated.team?.id)
    console.log('─────────────────────────────────\n')

    console.log('✅ U13 AA Storm now has a TREASURER!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixTreasurer()
