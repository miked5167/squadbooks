import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const team = await prisma.team.findFirst({
      where: {
        name: {
          contains: 'Ice Hawks',
        },
      },
      include: {
        categories: {
          orderBy: [
            { heading: 'asc' },
            { sortOrder: 'asc' },
          ],
        },
      },
    })

    if (!team) {
      console.log('❌ Team not found')
      return
    }

    console.log(`Team: ${team.name}`)
    console.log(`Total Budget: $${team.budgetTotal}`)
    console.log(`\nCategories (${team.categories.length} total):\n`)

    let currentHeading = ''
    for (const cat of team.categories) {
      if (cat.heading !== currentHeading) {
        currentHeading = cat.heading
        console.log(`\n${cat.heading}:`)
      }
      console.log(`  - ${cat.name}`)
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
