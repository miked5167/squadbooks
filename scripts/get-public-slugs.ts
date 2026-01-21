import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const budgets = await prisma.preSeasonBudget.findMany({
    where: { status: 'APPROVED' },
    select: {
      proposedTeamName: true,
      publicSlug: true,
    },
  })

  console.log('\n✅ Approved Public Budgets:\n')
  budgets.forEach((b) => {
    console.log(`${b.proposedTeamName}:`)
    console.log(`   → http://localhost:3000/public-budget/${b.publicSlug}\n`)
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
