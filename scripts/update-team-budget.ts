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

  console.log(`\n📊 Current Team Budget: $${Number(team.budgetTotal).toLocaleString()}`)

  // Update to $4,000 per family × 17 players = $68,000
  const newBudget = 4000 * 17

  await prisma.team.update({
    where: { id: team.id },
    data: { budgetTotal: newBudget },
  })

  console.log(`✅ Updated Team Budget: $${newBudget.toLocaleString()}`)
  console.log(`   ($4,000 per family × 17 players)\n`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
