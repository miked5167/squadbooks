const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

;(async () => {
  try {
    // Get Lightning team with association link
    const lightningUser = await prisma.user.findFirst({
      where: { clerkId: 'demo_2025_2026_000078' },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            associationTeam: {
              select: {
                id: true,
                associationId: true,
              },
            },
          },
        },
      },
    })
    console.log('Lightning Team:', JSON.stringify(lightningUser?.team, null, 2))

    if (lightningUser?.team?.associationTeam?.associationId) {
      // Check for association rules
      const rules = await prisma.associationRule.findMany({
        where: {
          associationId: lightningUser.team.associationTeam.associationId,
          isActive: true,
        },
      })
      console.log('\nAssociation Rules found:', rules.length)
      if (rules.length > 0) {
        console.log(JSON.stringify(rules, null, 2))
      }
    } else {
      console.log('\nNo association found for this team')
    }

    // Check team settings for dual approval threshold
    const teamSettings = await prisma.teamSettings.findUnique({
      where: { teamId: lightningUser?.team?.id },
    })
    console.log('\nTeam Settings:')
    console.log(JSON.stringify(teamSettings, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
})()
