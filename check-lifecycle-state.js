const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkState() {
  // Find Abigail's user
  const user = await prisma.user.findFirst({
    where: { email: 'u13-aa-storm.treasurer@demo.huddlebooks.app' },
    include: { team: true }
  });

  console.log('User:', user.name, 'Role:', user.role, 'Team:', user.team.name);

  // Find budget
  const budget = await prisma.budget.findFirst({
    where: {
      teamId: user.teamId,
      season: '2025-2026'
    }
  });

  console.log('\nBudget ID:', budget.id);
  console.log('Budget Status:', budget.status);

  // Find team season
  const teamSeason = await prisma.teamSeason.findUnique({
    where: {
      teamId_seasonLabel: {
        teamId: user.teamId,
        seasonLabel: '2025-2026'
      }
    }
  });

  console.log('\nTeamSeason ID:', teamSeason.id);
  console.log('TeamSeason State:', teamSeason.state);

  // Import and check available actions
  const { getAvailableActions } = require('./lib/services/team-season-lifecycle');
  const actions = await getAvailableActions(teamSeason.id, user.id);

  console.log('\nAvailable Actions:', actions);
}

checkState()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
