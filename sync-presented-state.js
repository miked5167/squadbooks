const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
  // Find the budget version
  const budget = await prisma.budget.findUnique({
    where: { id: 'cmj7y9vrx0001tg306j4ceiwq' },
    include: {
      versions: {
        where: { versionNumber: 1 }
      }
    }
  });

  const versionId = budget.versions[0]?.id;

  // Update TeamSeason to PRESENTED state
  await prisma.teamSeason.update({
    where: { id: 'cmj7y9wg20005tg30qtbsqqdm' },
    data: {
      state: 'PRESENTED',
      stateUpdatedAt: new Date(),
      lastActivityAt: new Date(),
      presentedVersionId: versionId
    }
  });

  console.log('✓ Updated TeamSeason state to PRESENTED');
  console.log('✓ The "Present to Parents" button should now be hidden');
  console.log('✓ Available actions should now show options for PRESENTED state');
}

sync()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
