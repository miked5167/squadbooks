const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  // Reset budget back to TEAM_APPROVED
  await prisma.budget.update({
    where: { id: 'cmj7y9vrx0001tg306j4ceiwq' },
    data: {
      status: 'TEAM_APPROVED',
      presentedVersionNumber: null
    }
  });

  // Reset TeamSeason to TEAM_APPROVED
  await prisma.teamSeason.update({
    where: { id: 'cmj7y9wg20005tg30qtbsqqdm' },
    data: {
      state: 'TEAM_APPROVED',
      stateUpdatedAt: new Date(),
      lastActivityAt: new Date()
    }
  });

  console.log('✓ Reset budget and team season to TEAM_APPROVED');
  console.log('✓ You can now click "Present to Parents" button again with the fixed code');
}

reset()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
