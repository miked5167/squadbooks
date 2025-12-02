import { PrismaClient, BudgetApprovalType, BudgetApprovalStatus } from '@prisma/client';

const prisma = new PrismaClient();

const NOW = new Date('2026-02-15T12:00:00Z');
const SEASON_START = new Date('2025-09-01T00:00:00Z');
const DEMO_SEASON = '2025-2026';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function daysAgo(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const rand = startTime + Math.random() * (endTime - startTime);
  return new Date(rand);
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

async function createBudgetApprovalsForTeam(teamName: string) {
  console.log(`\nCreating budget approvals for ${teamName}...`);

  const team = await prisma.team.findFirst({
    where: { name: teamName },
    include: {
      users: {
        where: { role: 'TREASURER' },
        take: 1
      },
      families: true
    }
  });

  if (!team) {
    console.log(`  ❌ Team ${teamName} not found`);
    return;
  }

  if (!team.users.length) {
    console.log(`  ❌ No treasurer found for ${teamName}`);
    return;
  }

  const treasurer = team.users[0];
  const families = team.families;
  const budgetTotal = Number(team.budgetTotal);

  console.log(`  Found team with ${families.length} families`);

  // Get parent users for acknowledgments
  const parents = await prisma.user.findMany({
    where: {
      teamId: team.id,
      role: 'PARENT'
    },
    take: families.length * 2 // 2 parents per family
  });

  // 1. COMPLETED Initial Budget Approval
  const initialApproval = await prisma.budgetApproval.create({
    data: {
      teamId: team.id,
      season: DEMO_SEASON,
      budgetTotal,
      approvalType: BudgetApprovalType.INITIAL,
      description: 'Initial Season Budget for approval',
      requiredCount: families.length,
      acknowledgedCount: families.length,
      status: BudgetApprovalStatus.COMPLETED,
      createdBy: treasurer.id,
      createdAt: addDays(SEASON_START, 5),
      completedAt: addDays(SEASON_START, 15),
      expiresAt: addDays(SEASON_START, 30),
    },
  });

  // Create acknowledgments for all families (all acknowledged)
  for (let i = 0; i < families.length; i++) {
    const family = families[i];
    const parent = parents[i * 2];
    if (!parent) continue;

    await prisma.acknowledgment.create({
      data: {
        budgetApprovalId: initialApproval.id,
        userId: parent.id,
        familyName: family.familyName,
        email: family.primaryEmail,
        acknowledged: true,
        acknowledgedAt: randomDateBetween(addDays(SEASON_START, 5), addDays(SEASON_START, 15)),
        viewedAt: randomDateBetween(addDays(SEASON_START, 5), addDays(SEASON_START, 15)),
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
  }

  // 2. PENDING Budget Revision
  const acknowledgedCount = Math.floor(families.length * 0.65);
  const revisionApproval = await prisma.budgetApproval.create({
    data: {
      teamId: team.id,
      season: DEMO_SEASON,
      budgetTotal: budgetTotal * 1.1,
      approvalType: BudgetApprovalType.REVISION,
      description: 'Mid-season budget revision - additional tournament costs',
      requiredCount: families.length,
      acknowledgedCount,
      status: BudgetApprovalStatus.PENDING,
      createdBy: treasurer.id,
      createdAt: daysAgo(NOW, 14),
      expiresAt: addDays(NOW, 14),
    },
  });

  for (let i = 0; i < families.length; i++) {
    const family = families[i];
    const parent = parents[i * 2];
    if (!parent) continue;

    const isAcknowledged = i < acknowledgedCount;
    await prisma.acknowledgment.create({
      data: {
        budgetApprovalId: revisionApproval.id,
        userId: parent.id,
        familyName: family.familyName,
        email: family.primaryEmail,
        acknowledged: isAcknowledged,
        acknowledgedAt: isAcknowledged ? randomDateBetween(daysAgo(NOW, 14), daysAgo(NOW, 2)) : null,
        viewedAt: isAcknowledged ? randomDateBetween(daysAgo(NOW, 14), daysAgo(NOW, 2)) : daysAgo(NOW, randomInt(1, 14)),
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: randomChoice([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]),
      },
    });
  }

  // 3. PENDING Financial Report
  const reportAckCount = Math.floor(families.length * 0.2);
  const reportApproval = await prisma.budgetApproval.create({
    data: {
      teamId: team.id,
      season: DEMO_SEASON,
      budgetTotal: budgetTotal * 0.75,
      approvalType: BudgetApprovalType.REPORT,
      description: 'Monthly Financial Report - January 2026',
      requiredCount: families.length,
      acknowledgedCount: reportAckCount,
      status: BudgetApprovalStatus.PENDING,
      createdBy: treasurer.id,
      createdAt: daysAgo(NOW, 3),
      expiresAt: addDays(NOW, 7),
    },
  });

  for (let i = 0; i < families.length; i++) {
    const family = families[i];
    const parent = parents[i * 2];
    if (!parent) continue;

    const isAcknowledged = i < reportAckCount;
    await prisma.acknowledgment.create({
      data: {
        budgetApprovalId: reportApproval.id,
        userId: parent.id,
        familyName: family.familyName,
        email: family.primaryEmail,
        acknowledged: isAcknowledged,
        acknowledgedAt: isAcknowledged ? randomDateBetween(daysAgo(NOW, 3), NOW) : null,
        viewedAt: isAcknowledged ? randomDateBetween(daysAgo(NOW, 3), NOW) : daysAgo(NOW, randomInt(0, 3)),
        ipAddress: `192.168.1.${randomInt(10, 250)}`,
        userAgent: randomChoice([
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        ]),
      },
    });
  }

  console.log(`  ✅ Created 3 budget approvals with acknowledgments`);
}

async function main() {
  await createBudgetApprovalsForTeam('U13 AA Storm');
  await createBudgetApprovalsForTeam('U15 A Thunder');

  console.log('\n✅ Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
