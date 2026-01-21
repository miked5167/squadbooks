import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get Mike's team
    const team = await prisma.team.findFirst({
      where: {
        name: "Mike's Team",
      },
      include: {
        categories: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    })

    if (!team) {
      console.log('❌ Team not found')
      return
    }

    console.log(`✅ Found team: ${team.name}`)
    console.log(`   Season: ${team.season}`)
    console.log(`   Total Budget: $${team.budgetTotal}`)
    console.log(`   Categories: ${team.categories.length}`)
    console.log('')

    // Budget allocation amounts (totaling $9,500 out of $10,000)
    const budgetAllocations: Record<string, number> = {
      // Coaching & Officials ($1,800)
      'Head Coach Fee': 600,
      'Assistant Coach Fees': 400,
      'Referee Fees': 600,
      'Coaching Certifications': 200,

      // Equipment & Jerseys ($1,400)
      'Team Jerseys': 500,
      'Practice Jerseys': 300,
      'Team Equipment': 400,
      'Goalie Equipment': 200,

      // Ice Time & Facilities ($2,500)
      'Ice Time - Practice': 1200,
      'Ice Time - Games': 800,
      'Facility Rentals': 300,
      'Locker Room Fees': 200,

      // League & Registration ($1,500)
      'League Registration': 400,
      'USA Hockey Registration': 300,
      'Tournament Fees': 500,
      'Insurance': 300,

      // Team Operations ($700)
      'Team Photos': 200,
      'Team Party/Events': 300,
      'Awards & Trophies': 150,
      'Office Supplies': 50,

      // Travel & Tournaments ($1,600)
      'Tournament Registration': 400,
      'Hotel Accommodations': 600,
      'Team Meals': 400,
      'Transportation': 200,
    }

    console.log('📊 Creating budget allocations...\n')

    for (const category of team.categories) {
      const allocated = budgetAllocations[category.name] || 0

      if (allocated > 0) {
        const result = await prisma.budgetAllocation.upsert({
          where: {
            teamId_categoryId_season: {
              teamId: team.id,
              categoryId: category.id,
              season: team.season,
            },
          },
          update: {
            allocated,
          },
          create: {
            teamId: team.id,
            categoryId: category.id,
            season: team.season,
            allocated,
          },
        })

        console.log(`   ✅ ${category.name}: $${allocated.toLocaleString()}`)
      }
    }

    // Calculate total allocated
    const totalAllocated = Object.values(budgetAllocations).reduce((sum, amt) => sum + amt, 0)
    const unallocated = Number(team.budgetTotal) - totalAllocated

    console.log('')
    console.log('📈 Budget Summary:')
    console.log(`   Total Budget: $${Number(team.budgetTotal).toLocaleString()}`)
    console.log(`   Total Allocated: $${totalAllocated.toLocaleString()}`)
    console.log(`   Unallocated: $${unallocated.toLocaleString()}`)
    console.log('')
    console.log('✅ Budget allocations created successfully!')
  } catch (error) {
    console.error('❌ Error creating budget allocations:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
