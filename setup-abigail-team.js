const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupAbigailTeam() {
  const teamId = 'cmj4wupgy0002tgegtq1mg0c0'; // New Team
  const associationId = '9b6036ee-2398-4f23-8637-0e740ad911b1'; // Ontario Minor Hockey

  // Create budget
  const budget = await prisma.budget.create({
    data: {
      teamId,
      season: '2025-2026',
      currentVersionNumber: 1,
      createdBy: 'system',
    }
  });

  console.log('Budget created:', budget.id);

  // Create budget version
  const version = await prisma.budgetVersion.create({
    data: {
      budgetId: budget.id,
      versionNumber: 1,
      createdBy: 'system',
      totalBudget: 0,
    }
  });

  console.log('Budget version created:', version.id);

  // Create team season
  const teamSeason = await prisma.teamSeason.create({
    data: {
      teamId,
      associationId,
      seasonLabel: '2025-2026',
      seasonStart: new Date('2025-09-01'),
      seasonEnd: new Date('2026-04-30'),
      state: 'BUDGET_DRAFT',
      stateUpdatedAt: new Date(),
      lastActivityAt: new Date(),
    }
  });

  console.log('Team season created:', teamSeason.id);
  console.log('State:', teamSeason.state);

  await prisma.$disconnect();
}

setupAbigailTeam().catch(console.error);
