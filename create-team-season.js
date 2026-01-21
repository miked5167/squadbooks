const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTeamSeason() {
  // Create team season for U13 AA Storm
  const teamSeason = await prisma.teamSeason.create({
    data: {
      teamId: 'cminhmzhi000gtgpcgvw5ogk9', // U13 AA Storm
      associationId: '9b6036ee-2398-4f23-8637-0e740ad911b1', // Ontario Minor Hockey Association
      seasonLabel: '2025-2026',
      seasonStart: new Date('2025-09-01'),
      seasonEnd: new Date('2026-04-30'),
      state: 'BUDGET_DRAFT', // Start in DRAFT state
      stateUpdatedAt: new Date(),
      lastActivityAt: new Date(),
    }
  });

  console.log('Team season created:');
  console.log(JSON.stringify({
    id: teamSeason.id,
    teamId: teamSeason.teamId,
    seasonLabel: teamSeason.seasonLabel,
    state: teamSeason.state
  }, null, 2));

  await prisma.$disconnect();
}

createTeamSeason().catch(console.error);
