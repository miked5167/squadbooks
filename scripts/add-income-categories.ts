import { prisma } from '../lib/prisma'

async function addIncomeCategories() {
  try {
    // Get the user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: 'user_35mxqUEnd8SXJxf6VCvRJW0zMTi' },
      select: { teamId: true },
    })

    if (!user?.teamId) {
      console.error('User or team not found')
      process.exit(1)
    }

    const teamId = user.teamId

    // Check if income categories already exist
    const existingIncome = await prisma.category.findFirst({
      where: {
        teamId,
        type: 'INCOME',
      },
    })

    if (existingIncome) {
      console.log('Income categories already exist!')
      process.exit(0)
    }

    // Create income categories
    const incomeCategories = [
      { name: 'Registration Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 101 },
      { name: 'Tryout Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 102 },
      { name: 'Team Fees', heading: 'Fundraising & Income', color: '#10B981', type: 'INCOME', sortOrder: 103 },
      { name: 'Fundraising Revenue', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 104 },
      { name: 'Sponsorships', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 105 },
      { name: 'Donations', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 106 },
      { name: 'Grants', heading: 'Fundraising & Income', color: '#22C55E', type: 'INCOME', sortOrder: 107 },
      { name: 'Apparel Sales', heading: 'Fundraising & Income', color: '#059669', type: 'INCOME', sortOrder: 108 },
      { name: 'Raffle/50-50', heading: 'Fundraising & Income', color: '#059669', type: 'INCOME', sortOrder: 109 },
      { name: 'Other Income', heading: 'Fundraising & Income', color: '#047857', type: 'INCOME', sortOrder: 110 },
    ]

    await prisma.category.createMany({
      data: incomeCategories.map((cat) => ({
        teamId,
        name: cat.name,
        heading: cat.heading,
        color: cat.color,
        type: cat.type,
        sortOrder: cat.sortOrder,
        isDefault: true,
      })),
    })

    console.log('✅ Successfully created 10 income categories!')
  } catch (error) {
    console.error('Error adding income categories:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

addIncomeCategories()
