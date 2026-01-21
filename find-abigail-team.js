const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAbigailTeam() {
  const user = await prisma.user.findFirst({
    where: { name: 'Abigail Thompson' },
    include: {
      team: {
        include: {
          budgets: true,
          teamSeasons: true
        }
      }
    }
  });

  if (user) {
    console.log('User:', user.name);
    console.log('Email:', user.email);
    console.log('Team ID:', user.teamId);
    console.log('Team Name:', user.team?.name);
    console.log('Budgets:', user.team?.budgets.length || 0);
    console.log('Team Seasons:', user.team?.teamSeasons.length || 0);

    if (user.team?.budgets[0]) {
      console.log('\nBudget ID:', user.team.budgets[0].id);
      console.log('Season:', user.team.budgets[0].season);
    }
  }

  await prisma.$disconnect();
}

findAbigailTeam().catch(console.error);
