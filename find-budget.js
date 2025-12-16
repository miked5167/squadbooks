const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findBudget() {
  const budget = await prisma.budget.findFirst({
    where: { team: { name: { contains: 'Storm' } } },
    include: {
      team: { select: { id: true, name: true } }
    }
  });

  if (budget) {
    console.log(JSON.stringify({
      budgetId: budget.id,
      teamId: budget.teamId,
      teamName: budget.team.name,
      season: budget.season,
      currentVersion: budget.currentVersionNumber
    }, null, 2));
  } else {
    console.log('No budget found');
  }

  await prisma.$disconnect();
}

findBudget().catch(console.error);
