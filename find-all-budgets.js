const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findAllBudgets() {
  const teams = await prisma.team.findMany({
    include: {
      budgets: true,
      teamSeasons: true,
      users: {
        where: { role: 'TREASURER' },
        select: { name: true, email: true }
      }
    },
    take: 10
  });

  console.log('Teams found:', teams.length);

  teams.forEach(team => {
    console.log('\n---');
    console.log('Team:', team.name);
    console.log('Team ID:', team.id);
    console.log('Treasurer:', team.users[0]?.name || 'None');
    console.log('Budgets:', team.budgets.length);
    console.log('Team Seasons:', team.teamSeasons.length);

    if (team.budgets.length > 0) {
      team.budgets.forEach(b => {
        console.log('  Budget ID:', b.id);
        console.log('  Season:', b.season);
      });
    }

    if (team.teamSeasons.length > 0) {
      team.teamSeasons.forEach(ts => {
        console.log('  Team Season State:', ts.state);
        console.log('  Season Label:', ts.seasonLabel);
      });
    }
  });

  await prisma.$disconnect();
}

findAllBudgets().catch(console.error);
