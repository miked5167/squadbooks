import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Find the user with email miked5167@gmail.com
    const user = await prisma.user.findFirst({
      where: {
        email: 'miked5167@gmail.com',
      },
      include: {
        team: true,
      },
    })

    if (!user) {
      console.log('❌ User not found')
      return
    }

    console.log('👤 User Info:')
    console.log(`   Name: ${user.name}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Team ID: ${user.teamId}`)
    console.log(`   Team Name: ${user.team.name}`)
    console.log(`   Team Budget: $${user.team.budgetTotal}`)
    console.log(`   Season: ${user.team.season}`)
    console.log('')

    // Check budget allocations for this team
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      where: {
        teamId: user.teamId,
        season: user.team.season,
      },
      include: {
        category: true,
      },
    })

    console.log(`📊 Budget Allocations: ${budgetAllocations.length} found`)

    if (budgetAllocations.length > 0) {
      const totalAllocated = budgetAllocations.reduce(
        (sum, alloc) => sum + Number(alloc.allocated),
        0
      )
      console.log(`   Total Allocated: $${totalAllocated.toLocaleString()}`)
      console.log('')
      console.log('   Top 5 allocations:')
      budgetAllocations
        .sort((a, b) => Number(b.allocated) - Number(a.allocated))
        .slice(0, 5)
        .forEach(alloc => {
          console.log(`   - ${alloc.category.name}: $${Number(alloc.allocated).toLocaleString()}`)
        })
    } else {
      console.log('   ⚠️ No budget allocations found for this team/season')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
