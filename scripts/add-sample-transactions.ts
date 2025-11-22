import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    // Get Mike's team
    const team = await prisma.team.findFirst({
      where: { name: "Mike's Team" },
      include: {
        categories: true,
        users: true,
      },
    })

    if (!team) {
      console.log('❌ Team not found')
      return
    }

    const treasurer = team.users.find((u) => u.role === 'TREASURER')
    if (!treasurer) {
      console.log('❌ Treasurer not found')
      return
    }

    console.log(`✅ Found team: ${team.name}`)
    console.log(`   Season: ${team.season}`)
    console.log(`   Treasurer: ${treasurer.name}`)
    console.log('')

    // Helper to find category by name
    const findCategory = (name: string) =>
      team.categories.find((c) => c.name === name)

    // Delete existing transactions to start fresh
    await prisma.transaction.deleteMany({
      where: { teamId: team.id },
    })
    console.log('🗑️  Cleared existing transactions\n')

    // INCOME: Registration fees - $4,000 per family, collected in 2 installments
    // Assuming 15 families on the team
    const families = [
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
      'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
    ]

    const regFeesCategory = findCategory('Registration Fees')

    console.log('💰 Creating Income Transactions (Registration Fees)...\n')

    for (const family of families) {
      // First installment - August 2025 ($2,000)
      await prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'INCOME',
          status: 'APPROVED',
          amount: 2000,
          categoryId: regFeesCategory!.id,
          vendor: `${family} Family`,
          description: `First installment - Registration fee`,
          transactionDate: new Date('2025-08-15'),
          createdBy: treasurer.id,
        },
      })

      // Second installment - December 2025 ($2,000)
      await prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'INCOME',
          status: 'APPROVED',
          amount: 2000,
          categoryId: regFeesCategory!.id,
          vendor: `${family} Family`,
          description: `Second installment - Registration fee`,
          transactionDate: new Date('2025-12-15'),
          createdBy: treasurer.id,
        },
      })
    }

    console.log(`   ✅ Added ${families.length * 2} registration fee payments ($${families.length * 4000} total)`)
    console.log('')

    // EXPENSES: Create realistic expense transactions
    console.log('💸 Creating Expense Transactions...\n')

    const expenses = [
      // Ice Time - Practice (August - November)
      { date: '2025-08-05', category: 'Ice Time - Practice', vendor: 'Springfield Ice Arena', amount: 300, desc: 'Practice ice time - August' },
      { date: '2025-09-05', category: 'Ice Time - Practice', vendor: 'Springfield Ice Arena', amount: 300, desc: 'Practice ice time - September' },
      { date: '2025-10-05', category: 'Ice Time - Practice', vendor: 'Springfield Ice Arena', amount: 300, desc: 'Practice ice time - October' },
      { date: '2025-11-05', category: 'Ice Time - Practice', vendor: 'Springfield Ice Arena', amount: 300, desc: 'Practice ice time - November' },

      // Ice Time - Games
      { date: '2025-09-15', category: 'Ice Time - Games', vendor: 'Springfield Ice Arena', amount: 400, desc: 'Home game ice time - Sept' },
      { date: '2025-10-15', category: 'Ice Time - Games', vendor: 'Springfield Ice Arena', amount: 400, desc: 'Home game ice time - Oct' },

      // Team Jerseys
      { date: '2025-08-20', category: 'Team Jerseys', vendor: 'Pro Hockey Gear', amount: 500, desc: 'Home and away jerseys' },

      // Practice Jerseys
      { date: '2025-08-22', category: 'Practice Jerseys', vendor: 'Pro Hockey Gear', amount: 300, desc: 'Practice pinnies and jerseys' },

      // Team Equipment
      { date: '2025-08-25', category: 'Team Equipment', vendor: 'Hockey Equipment Supply', amount: 400, desc: 'Pucks, cones, training aids' },

      // Goalie Equipment
      { date: '2025-09-01', category: 'Goalie Equipment', vendor: 'Goalie Gear Pro', amount: 200, desc: 'Goalie pads and equipment' },

      // Head Coach Fee
      { date: '2025-08-30', category: 'Head Coach Fee', vendor: 'Coach Anderson', amount: 600, desc: 'Season coaching fee' },

      // Assistant Coach Fees
      { date: '2025-08-30', category: 'Assistant Coach Fees', vendor: 'Coach Martinez', amount: 400, desc: 'Season assistant coaching fee' },

      // Referee Fees
      { date: '2025-09-20', category: 'Referee Fees', vendor: 'Springfield Officials Association', amount: 150, desc: 'Sept game officials' },
      { date: '2025-10-20', category: 'Referee Fees', vendor: 'Springfield Officials Association', amount: 150, desc: 'Oct game officials' },
      { date: '2025-11-20', category: 'Referee Fees', vendor: 'Springfield Officials Association', amount: 150, desc: 'Nov game officials' },

      // Coaching Certifications
      { date: '2025-08-10', category: 'Coaching Certifications', vendor: 'USA Hockey', amount: 200, desc: 'Coaching certification renewals' },

      // Tournament Registration
      { date: '2025-09-25', category: 'Tournament Registration', vendor: 'Columbus Hockey Classic', amount: 400, desc: 'Tournament entry fee' },

      // Hotel Accommodations
      { date: '2025-10-10', category: 'Hotel Accommodations', vendor: 'Hampton Inn Columbus', amount: 600, desc: 'Columbus tournament lodging' },

      // Team Meals
      { date: '2025-10-12', category: 'Team Meals', vendor: 'Team Dinner - Columbus', amount: 250, desc: 'Team dinner at tournament' },
      { date: '2025-11-15', category: 'Team Meals', vendor: 'Pizza Palace', amount: 150, desc: 'Post-practice team meal' },

      // Transportation
      { date: '2025-10-11', category: 'Transportation', vendor: 'Charter Bus Rental', amount: 200, desc: 'Bus to Columbus tournament' },

      // League Registration
      { date: '2025-08-01', category: 'League Registration', vendor: 'Springfield Youth Hockey League', amount: 400, desc: 'League registration fee' },

      // USA Hockey Registration
      { date: '2025-08-01', category: 'USA Hockey Registration', vendor: 'USA Hockey', amount: 300, desc: 'Team USA Hockey registration' },

      // Tournament Fees
      { date: '2025-10-01', category: 'Tournament Fees', vendor: 'Fall Hockey Festival', amount: 500, desc: 'Tournament entry and ice fees' },

      // Insurance
      { date: '2025-08-05', category: 'Insurance', vendor: 'Sport Insurance Co', amount: 300, desc: 'Team liability insurance' },

      // Team Photos
      { date: '2025-09-10', category: 'Team Photos', vendor: 'Pro Sports Photography', amount: 200, desc: 'Team and individual photos' },

      // Team Party/Events
      { date: '2025-10-31', category: 'Team Party/Events', vendor: 'Party City', amount: 150, desc: 'Halloween party supplies' },

      // Awards & Trophies (PENDING - needs approval)
      { date: '2025-11-25', category: 'Awards & Trophies', vendor: 'Trophy Shop', amount: 150, desc: 'End of season awards', pending: true },

      // Office Supplies
      { date: '2025-08-15', category: 'Office Supplies', vendor: 'Office Depot', amount: 50, desc: 'Folders, pens, clipboard' },

      // Facility Rentals (PENDING - needs approval)
      { date: '2025-12-01', category: 'Facility Rentals', vendor: 'Community Center', amount: 300, desc: 'Holiday party venue rental', pending: true },

      // Locker Room Fees
      { date: '2025-08-20', category: 'Locker Room Fees', vendor: 'Springfield Ice Arena', amount: 200, desc: 'Season locker room rental' },
    ]

    for (const expense of expenses) {
      const category = findCategory(expense.category)
      if (!category) {
        console.log(`   ⚠️ Category not found: ${expense.category}`)
        continue
      }

      const status = expense.pending ? 'PENDING' : 'APPROVED'

      await prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'EXPENSE',
          status,
          amount: expense.amount,
          categoryId: category.id,
          vendor: expense.vendor,
          description: expense.desc,
          transactionDate: new Date(expense.date),
          createdBy: treasurer.id,
        },
      })
    }

    console.log(`   ✅ Added ${expenses.length} expense transactions`)
    console.log('')

    // Calculate totals
    const totalIncome = families.length * 4000
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const approved = expenses.filter((e) => !e.pending).reduce((sum, e) => sum + e.amount, 0)
    const pending = expenses.filter((e) => e.pending).reduce((sum, e) => sum + e.amount, 0)

    console.log('📊 Transaction Summary:')
    console.log(`   Total Income: $${totalIncome.toLocaleString()}`)
    console.log(`   Total Expenses: $${totalExpenses.toLocaleString()}`)
    console.log(`     - Approved: $${approved.toLocaleString()}`)
    console.log(`     - Pending: $${pending.toLocaleString()}`)
    console.log(`   Net: $${(totalIncome - approved).toLocaleString()}`)
    console.log('')
    console.log('✅ Sample transactions created successfully!')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
