const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTeamId() {
  const user = await prisma.user.findFirst({
    where: { email: 'u13-aa-storm.treasurer@demo.huddlebooks.app' },
    select: { teamId: true, team: { select: { name: true } } }
  });

  console.log('Team ID:', user.teamId);
  console.log('Team Name:', user.team.name);
}

getTeamId()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
