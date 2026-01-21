import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const team = await prisma.team.findFirst({
    where: { name: "Mike's Team" },
  })

  if (!team) {
    console.log('Team not found')
    return
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      teamId: team.id,
      deletedAt: null,
    },
  })

  const income = transactions.filter(t => t.type === 'INCOME')
  const expenses = transactions.filter(t => t.type === 'EXPENSE')
  const approved = transactions.filter(t => t.status === 'APPROVED')
  const pending = transactions.filter(t => t.status === 'PENDING')

  const totalIncome = income.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
  const approvedExpenses = approved.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0)

  console.log(`\n📊 Transaction Summary for ${team.name}:`)
  console.log(`   Team Budget in DB: $${Number(team.budgetTotal).toLocaleString()}`)
  console.log(`\n   Total Transactions: ${transactions.length}`)
  console.log(`   - Income: ${income.length} transactions ($${totalIncome.toLocaleString()})`)
  console.log(`   - Expenses: ${expenses.length} transactions ($${totalExpenses.toLocaleString()})`)
  console.log(`   - Approved Expenses: $${approvedExpenses.toLocaleString()}`)
  console.log(`   - Pending: ${pending.length} transactions`)
  console.log(`\n   💰 Net: $${(totalIncome - approvedExpenses).toLocaleString()}`)
  console.log(`\n   ⚠️  Team Budget ($${Number(team.budgetTotal).toLocaleString()}) should probably be $${totalExpenses.toLocaleString()} to match expenses`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
