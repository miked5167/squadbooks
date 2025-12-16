const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupParentApprovals() {
  const teamId = 'cmj4wupgy0002tgegtq1mg0c0'; // New Team ID
  const budgetId = 'cmj7y9vrx0001tg306j4ceiwq';
  const presentedVersionNumber = 1;

  console.log('=== SETTING UP PARENT APPROVAL DEMO ===\n');

  // 1. Create threshold configuration (50% approval required)
  console.log('1. Creating threshold configuration...');
  const thresholdConfig = await prisma.budgetThresholdConfig.upsert({
    where: { budgetId },
    create: {
      budgetId,
      mode: 'PERCENT',
      percentageThreshold: 50,
      eligibleFamilyCount: 5,
      autoApproveHouseLeague: false,
    },
    update: {
      mode: 'PERCENT',
      percentageThreshold: 50,
      eligibleFamilyCount: 5,
    }
  });
  console.log('   ✓ Threshold: 50% of 5 families = 3 approvals needed\n');

  // 2. Create 5 parent users (families)
  console.log('2. Creating 5 parent users...');
  const parents = [];

  for (let i = 1; i <= 5; i++) {
    const parent = await prisma.user.upsert({
      where: { email: `parent${i}@newteam.demo` },
      create: {
        clerkId: `clerk_parent_${i}_newteam`,
        email: `parent${i}@newteam.demo`,
        name: `Parent ${i}`,
        role: 'PARENT',
        teamId: teamId,
      },
      update: {
        role: 'PARENT',
        teamId: teamId,
      }
    });
    parents.push(parent);
    console.log(`   ✓ Created ${parent.name} (${parent.email})`);
  }
  console.log('');

  // 3. Create family records
  console.log('3. Creating family records...');
  for (let i = 0; i < parents.length; i++) {
    await prisma.family.upsert({
      where: {
        teamId_familyName: {
          teamId: teamId,
          familyName: `Family ${i + 1}`
        }
      },
      create: {
        teamId: teamId,
        familyName: `Family ${i + 1}`,
        primaryContactId: parents[i].id,
      },
      update: {
        primaryContactId: parents[i].id,
      }
    });
    console.log(`   ✓ Family ${i + 1} linked to ${parents[i].name}`);
  }
  console.log('');

  console.log('4. Creating initial acknowledgments (2 out of 5 approved)...');
  // Parent 1 - Approved
  await prisma.budgetAcknowledgment.upsert({
    where: {
      budgetId_parentId_versionNumber: {
        budgetId,
        parentId: parents[0].id,
        versionNumber: presentedVersionNumber,
      }
    },
    create: {
      budgetId,
      parentId: parents[0].id,
      versionNumber: presentedVersionNumber,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    },
    update: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    }
  });
  console.log(`   ✓ ${parents[0].name} acknowledged`);

  // Parent 2 - Approved
  await prisma.budgetAcknowledgment.upsert({
    where: {
      budgetId_parentId_versionNumber: {
        budgetId,
        parentId: parents[1].id,
        versionNumber: presentedVersionNumber,
      }
    },
    create: {
      budgetId,
      parentId: parents[1].id,
      versionNumber: presentedVersionNumber,
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    },
    update: {
      status: 'ACKNOWLEDGED',
      acknowledgedAt: new Date(),
    }
  });
  console.log(`   ✓ ${parents[1].name} acknowledged`);

  console.log('\n=== SETUP COMPLETE ===');
  console.log('Status: 2/5 parents approved (40%)');
  console.log('Threshold: 50% (3 approvals needed)');
  console.log('Next: Refresh the budget page to see approval progress');
  console.log('\nTo approve more parents, run: node simulate-parent-approval.js');
}

setupParentApprovals()
  .then(() => prisma.$disconnect())
  .catch(e => {
    console.error(e);
    prisma.$disconnect();
  });
