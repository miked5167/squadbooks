const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBudgetState() {
  const budget = await prisma.budget.findUnique({
    where: { id: 'cmj3jcl46000dtg8czm64440b' },
    include: {
      team: {
        include: {
          teamSeasons: {
            where: { seasonLabel: '2025-2026' }
          }
        }
      }
    }
  });

  if (budget && budget.team.teamSeasons[0]) {
    console.log(JSON.stringify({
      budgetId: budget.id,
      teamName: budget.team.name,
      teamSeasonState: budget.team.teamSeasons[0].state,
      presentedVersionId: budget.team.teamSeasons[0].presentedVersionId,
      lockedVersionId: budget.team.teamSeasons[0].lockedVersionId
    }, null, 2));
  } else {
    console.log('Budget or team season not found');
  }

  await prisma.$disconnect();
}

checkBudgetState().catch(console.error);
