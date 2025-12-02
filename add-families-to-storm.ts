import { PrismaClient, UserRole, PlayerStatus } from '@prisma/client';

const prisma = new PrismaClient();

const NOW = new Date('2026-02-15T12:00:00Z');
const SEASON_START = new Date('2025-09-01T00:00:00Z');
const DEMO_CLERK_ID_PREFIX = 'demo_2025_2026_';
const DEMO_EMAIL_DOMAIN = '@demo.huddlebooks.app';

let clerkIdCounter = 100000; // Start high to avoid conflicts

const FIRST_NAMES = [
  'Liam', 'Noah', 'Oliver', 'Elijah', 'James',
  'Emma', 'Olivia', 'Ava', 'Sophia', 'Charlotte',
  'Ethan', 'Logan', 'Mason', 'Lucas', 'Benjamin',
  'Chloe', 'Amelia', 'Grace', 'Hannah', 'Emily',
];

const LAST_NAMES = [
  'Smith', 'Brown', 'Tremblay', 'Martin', 'Roy',
  'Lee', 'Wilson', 'Clark', 'Nguyen', 'Hall',
  'Walker', 'Young', 'Patel', 'Singh', 'Campbell',
];

function generateDemoClerkId(): string {
  return `${DEMO_CLERK_ID_PREFIX}${String(clerkIdCounter++).padStart(6, '0')}`;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const rand = startTime + Math.random() * (endTime - startTime);
  return new Date(rand);
}

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

async function main() {
  console.log('Adding families and parents to U13 AA Storm...\n');

  const team = await prisma.team.findFirst({
    where: { name: 'U13 AA Storm' },
  });

  if (!team) {
    console.log('❌ Team not found');
    return;
  }

  console.log(`Found team: ${team.name} (${team.id})`);

  const playersCount = 18;
  const families: any[] = [];
  const parents: any[] = [];
  const players: any[] = [];

  // Create families, parents, and players
  for (let i = 0; i < playersCount; i++) {
    const lastName = randomChoice(LAST_NAMES);
    const familyName = `${lastName} Family`;

    const parent1FirstName = randomChoice(FIRST_NAMES);
    const parent2FirstName = randomChoice(FIRST_NAMES);

    // Create parent 1
    const parent1 = await prisma.user.create({
      data: {
        clerkId: generateDemoClerkId(),
        email: `${parent1FirstName.toLowerCase()}.${lastName.toLowerCase()}.storm.p${i}a${DEMO_EMAIL_DOMAIN}`,
        name: `${parent1FirstName} ${lastName}`,
        role: UserRole.PARENT,
        teamId: team.id,
        createdAt: SEASON_START,
      },
    });
    parents.push(parent1);

    // Create parent 2
    const parent2 = await prisma.user.create({
      data: {
        clerkId: generateDemoClerkId(),
        email: `${parent2FirstName.toLowerCase()}.${lastName.toLowerCase()}.storm.p${i}b${DEMO_EMAIL_DOMAIN}`,
        name: `${parent2FirstName} ${lastName}`,
        role: UserRole.PARENT,
        teamId: team.id,
        createdAt: SEASON_START,
      },
    });
    parents.push(parent2);

    // Create family
    const family = await prisma.family.create({
      data: {
        teamId: team.id,
        familyName,
        primaryName: parent1.name,
        primaryEmail: parent1.email,
        primaryPhone: `416-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        secondaryName: parent2.name,
        secondaryEmail: parent2.email,
        secondaryPhone: `416-${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
        createdAt: SEASON_START,
      },
    });
    families.push(family);

    // Create player
    const playerFirstName = randomChoice(FIRST_NAMES);
    const jerseyNumber = String(randomInt(1, 99));
    const positions = ['Center', 'Left Wing', 'Right Wing', 'Defense', 'Goalie'];

    const player = await prisma.player.create({
      data: {
        teamId: team.id,
        familyId: family.id,
        firstName: playerFirstName,
        lastName,
        jerseyNumber,
        position: randomChoice(positions),
        dateOfBirth: new Date(`${2025 - 13}-${randomInt(1, 12)}-${randomInt(1, 28)}`),
        status: PlayerStatus.ACTIVE,
        createdAt: SEASON_START,
      },
    });
    players.push(player);

    if ((i + 1) % 5 === 0) {
      console.log(`  Created ${i + 1}/${playersCount} families with parents and players...`);
    }
  }

  console.log(`✅ Created ${playersCount} families with ${parents.length} parents and ${players.length} players\n`);

  // Now update the budget approvals with acknowledgments
  console.log('Updating budget approvals with acknowledgments...\n');

  const budgetApprovals = await prisma.budgetApproval.findMany({
    where: { teamId: team.id },
    orderBy: { createdAt: 'asc' },
  });

  for (const approval of budgetApprovals) {
    console.log(`  Processing ${approval.approvalType} approval...`);

    // Delete existing acknowledgments (if any)
    await prisma.acknowledgment.deleteMany({
      where: { budgetApprovalId: approval.id },
    });

    let acknowledgedCount = 0;

    // Determine how many should be acknowledged based on type
    if (approval.approvalType === 'INITIAL') {
      acknowledgedCount = families.length; // 100%
    } else if (approval.approvalType === 'REVISION') {
      acknowledgedCount = Math.floor(families.length * 0.65); // 65%
    } else if (approval.approvalType === 'REPORT') {
      acknowledgedCount = Math.floor(families.length * 0.2); // 20%
    }

    // Create acknowledgments
    for (let i = 0; i < families.length; i++) {
      const family = families[i];
      const parent = parents[i * 2]; // Use first parent
      const isAcknowledged = i < acknowledgedCount;

      let acknowledgedDate = null;
      let viewedDate = null;

      if (approval.approvalType === 'INITIAL') {
        acknowledgedDate = randomDateBetween(addDays(SEASON_START, 5), addDays(SEASON_START, 15));
        viewedDate = acknowledgedDate;
      } else if (approval.approvalType === 'REVISION') {
        if (isAcknowledged) {
          acknowledgedDate = randomDateBetween(daysAgo(NOW, 14), daysAgo(NOW, 2));
          viewedDate = acknowledgedDate;
        } else {
          viewedDate = daysAgo(NOW, randomInt(1, 14));
        }
      } else if (approval.approvalType === 'REPORT') {
        if (isAcknowledged) {
          acknowledgedDate = randomDateBetween(daysAgo(NOW, 3), NOW);
          viewedDate = acknowledgedDate;
        } else {
          viewedDate = daysAgo(NOW, randomInt(0, 3));
        }
      }

      await prisma.acknowledgment.create({
        data: {
          budgetApprovalId: approval.id,
          userId: parent.id,
          familyName: family.familyName,
          email: family.primaryEmail,
          acknowledged: isAcknowledged,
          acknowledgedAt: acknowledgedDate,
          viewedAt: viewedDate || new Date(),
          ipAddress: `192.168.1.${randomInt(10, 250)}`,
          userAgent: randomChoice([
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          ]),
        },
      });
    }

    // Update the approval counts
    await prisma.budgetApproval.update({
      where: { id: approval.id },
      data: {
        requiredCount: families.length,
        acknowledgedCount,
      },
    });

    console.log(`    ✅ ${approval.approvalType}: ${acknowledgedCount}/${families.length} acknowledged`);
  }

  console.log('\n✅ All done! U13 AA Storm now has full family and acknowledgment data.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
