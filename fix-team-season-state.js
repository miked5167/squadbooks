const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixState() {
  // Update TeamSeason state to TEAM_APPROVED to match the budget status
  const result = await prisma.teamSeason.update({
    where: {
      id: 'cmj7y9wg20005tg30qtbsqqdm'
    },
    data: {
      state: 'TEAM_APPROVED',
      stateUpdatedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  console.log('Updated TeamSeason state to:', result.state);
  console.log('Budget should now show "Present to Parents" button');
}

fixState()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
