const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPresentedState() {
  const budget = await prisma.budget.findUnique({
    where: { id: 'cmj7y9vrx0001tg306j4ceiwq' },
    include: {
      team: {
        include: {
          associationTeam: {
            include: {
              association: true
            }
          }
        }
      },
      thresholdConfig: true
    }
  });

  console.log('=== BUDGET STATE ===');
  console.log('Status:', budget.status);
  console.log('Presented Version:', budget.presentedVersionNumber);
  console.log('Locked At:', budget.lockedAt);
  console.log('Locked Version:', budget.lockedVersionNumber);

  console.log('\n=== TEAM INFO ===');
  console.log('Team:', budget.team.name);
  console.log('Team Type:', budget.team.teamType);
  console.log('Association:', budget.team.associationTeam?.association?.name || 'No association');

  console.log('\n=== THRESHOLD CONFIG ===');
  if (budget.thresholdConfig) {
    console.log('Type:', budget.thresholdConfig.thresholdType);
    console.log('Value:', budget.thresholdConfig.thresholdValue);
    console.log('Auto-approve House League:', budget.thresholdConfig.autoApproveHouseLeague);
  } else {
    console.log('No threshold config found');
  }

  // Check parent acknowledgments
  const acknowledgments = await prisma.budgetAcknowledgment.findMany({
    where: {
      budgetId: budget.id,
      versionNumber: budget.presentedVersionNumber
    },
    include: {
      parent: {
        select: { name: true }
      }
    }
  });

  console.log('\n=== PARENT ACKNOWLEDGMENTS ===');
  console.log('Total:', acknowledgments.length);
  acknowledgments.forEach(ack => {
    console.log(`- ${ack.parent.name}: ${ack.status} at ${ack.acknowledgedAt}`);
  });

  // Check TeamSeason state
  const teamSeason = await prisma.teamSeason.findFirst({
    where: {
      teamId: budget.teamId,
      seasonLabel: budget.season
    }
  });

  console.log('\n=== TEAM SEASON ===');
  console.log('State:', teamSeason.state);
  console.log('Presented Version ID:', teamSeason.presentedVersionId);
  console.log('Locked Version ID:', teamSeason.lockedVersionId);
}

checkPresentedState()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
