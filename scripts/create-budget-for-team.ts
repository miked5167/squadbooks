/**
 * Non-interactive script to create initial budget for most recent team
 * Run with: npx tsx scripts/create-budget-for-team.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Create Initial Budget (Auto) ===\n');

  // Get most recent team
  const team = await prisma.team.findFirst({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      name: true,
      season: true,
      budgetTotal: true,
      createdAt: true,
    },
  });

  if (!team) {
    console.log('No teams found.');
    return;
  }

  console.log(`Creating budget for: ${team.name} (${team.season})`);
  console.log(`Budget Total: $${team.budgetTotal.toLocaleString()}`);

  // Check if budget already exists
  const existingBudget = await prisma.budget.findFirst({
    where: {
      teamId: team.id,
      season: team.season,
    },
  });

  if (existingBudget) {
    console.log(`\n✅ Budget already exists!`);
    console.log(`Budget ID: ${existingBudget.id}`);
    console.log(`Status: ${existingBudget.status}`);
    console.log(`\nView at: http://localhost:3000/budget/${existingBudget.id}`);
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
    console.log('\n⚠️  No system categories found.');
    console.log('Run: npx tsx scripts/seed-2layer-categories.ts');
    return;
  }

  // Create default allocations
  const totalBudget = Number(team.budgetTotal);

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

  const allocations: Array<{ systemCategoryId: string; allocated: number }> = [];
  console.log('\n📊 Budget allocation:');

  for (const [slug, pct] of Object.entries(percentages)) {
    const category = systemCategories.find(c => c.slug === slug);
    if (category) {
      const amount = Math.floor(totalBudget * pct);
      allocations.push({
        systemCategoryId: category.id,
        allocated: amount,
      });
      console.log(`  ${category.name}: $${amount.toLocaleString()} (${(pct * 100).toFixed(0)}%)`);
    }
  }

  // Get treasurer
  const treasurer = await prisma.user.findFirst({
    where: {
      teamId: team.id,
      role: { in: ['TREASURER', 'ASSISTANT_TREASURER'] },
    },
  });

  if (!treasurer) {
    console.log('\n⚠️  No treasurer found for this team.');
    return;
  }

  console.log(`\nCreating budget...`);

  // Create budget with transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Budget
    const budget = await tx.budget.create({
      data: {
        teamId: team.id,
        season: team.season,
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
      await tx.budgetAllocation.create({
        data: {
          budgetVersionId: version.id,
          systemCategoryId: allocation.systemCategoryId,
          allocated: allocation.allocated,
        },
      });
    }

    // 4. Create BudgetThresholdConfig
    const familyCount = await tx.family.count({
      where: {
        teamId: team.id,
      },
    });

    await tx.budgetThresholdConfig.create({
      data: {
        budgetId: budget.id,
        mode: 'PERCENT',
        percentThreshold: 80,
        eligibleFamilyCount: familyCount || 1, // Default to 1 if no families
      },
    });

    return { budget, version };
  });

  console.log('\n✅ Budget created successfully!');
  console.log(`   Budget ID: ${result.budget.id}`);
  console.log(`   Version: ${result.version.versionNumber}`);
  console.log(`   Status: ${result.budget.status}`);
  console.log(`\n🎯 Next steps:`);
  console.log(`   1. View: http://localhost:3000/budget/${result.budget.id}`);
  console.log(`   2. Adjust allocations as needed`);
  console.log(`   3. Submit for review`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
