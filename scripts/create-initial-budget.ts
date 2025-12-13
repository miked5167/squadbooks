/**
 * Helper script to create initial budget for a team
 * Run with: npx tsx scripts/create-initial-budget.ts
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline/promises';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('=== Create Initial Budget ===\n');

  // Get all teams
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      season: true,
      budgetTotal: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (teams.length === 0) {
    console.log('No teams found. Please create a team first.');
    return;
  }

  console.log('Available teams:');
  teams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.name} (${team.season}) - Budget: $${team.budgetTotal}`);
  });

  const teamIndexStr = await rl.question('\nSelect team number: ');
  const teamIndex = parseInt(teamIndexStr) - 1;

  if (teamIndex < 0 || teamIndex >= teams.length) {
    console.log('Invalid selection.');
    return;
  }

  const selectedTeam = teams[teamIndex];
  console.log(`\nSelected: ${selectedTeam.name}`);

  // Check if budget already exists
  const existingBudget = await prisma.budget.findFirst({
    where: {
      teamId: selectedTeam.id,
      season: selectedTeam.season,
    },
  });

  if (existingBudget) {
    console.log(`\n⚠️  Budget already exists for ${selectedTeam.name} (${selectedTeam.season})`);
    console.log('Budget ID:', existingBudget.id);
    return;
  }

  // Get system categories
  const systemCategories = await prisma.systemCategory.findMany({
    where: {
      type: 'EXPENSE',
      isCommon: true,
    },
    include: {
      displayCategory: true,
    },
    orderBy: [
      { displayCategory: { sortOrder: 'asc' } },
      { name: 'asc' },
    ],
  });

  if (systemCategories.length === 0) {
    console.log('\n⚠️  No system categories found. Please run: npx tsx scripts/seed-2layer-categories.ts');
    return;
  }

  console.log(`\nFound ${systemCategories.length} common categories`);

  // Create default allocations based on budget total
  const totalBudget = Number(selectedTeam.budgetTotal);
  const allocations: Array<{ systemCategoryId: string; allocated: number }> = [];

  // Simple allocation strategy - distribute evenly among main categories
  const mainCategories = [
    'practice-ice',      // 30%
    'game-ice',          // 15%
    'tournament-fees',   // 15%
    'league-fees',       // 10%
    'team-jerseys',      // 10%
    'referees',          // 10%
    'hotels',            // 5%
    'team-meals',        // 3%
    'bank-fees',         // 2%
  ];

  const percentages: Record<string, number> = {
    'practice-ice': 0.30,
    'game-ice': 0.15,
    'tournament-fees': 0.15,
    'league-fees': 0.10,
    'team-jerseys': 0.10,
    'referees': 0.10,
    'hotels': 0.05,
    'team-meals': 0.03,
    'bank-fees': 0.02,
  };

  console.log('\n📊 Proposed budget allocation:');
  let allocatedTotal = 0;

  for (const slug of mainCategories) {
    const category = systemCategories.find(c => c.slug === slug);
    if (category) {
      const amount = Math.floor(totalBudget * percentages[slug]);
      allocations.push({
        systemCategoryId: category.id,
        allocated: amount,
      });
      allocatedTotal += amount;
      console.log(`  ${category.name}: $${amount.toLocaleString()} (${(percentages[slug] * 100).toFixed(0)}%)`);
    }
  }

  console.log(`\nTotal Allocated: $${allocatedTotal.toLocaleString()} of $${totalBudget.toLocaleString()}`);

  const confirm = await rl.question('\nCreate this budget? (yes/no): ');
  if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
    console.log('Cancelled.');
    return;
  }

  // Get treasurer user
  const treasurer = await prisma.user.findFirst({
    where: {
      teamId: selectedTeam.id,
      role: { in: ['TREASURER', 'ASSISTANT_TREASURER'] },
    },
  });

  if (!treasurer) {
    console.log('\n⚠️  No treasurer found for this team. Please assign a treasurer role first.');
    return;
  }

  // Create budget with transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Budget
    const budget = await tx.budget.create({
      data: {
        teamId: selectedTeam.id,
        season: selectedTeam.season,
        status: 'DRAFT',
        currentVersionNumber: 1,
        createdBy: treasurer.id,
      },
    });

    // 2. Create BudgetVersion
    const version = await tx.budgetVersion.create({
      data: {
        budgetId: budget.id,
        versionNumber: 1,
        totalBudget: totalBudget,
        createdBy: treasurer.id,
      },
    });

    // 3. Create BudgetAllocations
    for (const allocation of allocations) {
      const category = systemCategories.find(c => c.id === allocation.systemCategoryId);
      if (category) {
        await tx.budgetAllocation.create({
          data: {
            budgetVersionId: version.id,
            systemCategoryId: allocation.systemCategoryId,
            allocated: allocation.allocated,
          },
        });
      }
    }

    // 4. Create BudgetThresholdConfig
    const familyCount = await tx.family.count({
      where: {
        teamId: selectedTeam.id,
      },
    });

    await tx.budgetThresholdConfig.create({
      data: {
        budgetId: budget.id,
        mode: 'PERCENT',
        percentThreshold: 80, // 80% approval required
        eligibleFamilyCount: familyCount,
      },
    });

    return { budget, version };
  });

  console.log('\n✅ Budget created successfully!');
  console.log(`   Budget ID: ${result.budget.id}`);
  console.log(`   Version: ${result.version.versionNumber}`);
  console.log(`   Status: ${result.budget.status}`);
  console.log(`\nNext steps:`);
  console.log(`1. Go to: http://localhost:3000/budget/${result.budget.id}`);
  console.log(`2. Review and adjust allocations as needed`);
  console.log(`3. Submit for review when ready`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
