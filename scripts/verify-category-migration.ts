/**
 * Verification script for 2-layer category migration
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Verifying 2-layer category migration...\n');

  // Check DisplayCategory count
  const displayCategoryCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "display_categories"
  `;
  console.log(`✓ Display Categories: ${displayCategoryCount[0].count}`);

  // Check SystemCategory count by type
  const systemCategoryExpenseCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "system_categories" WHERE type = 'EXPENSE'
  `;
  const systemCategoryIncomeCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "system_categories" WHERE type = 'INCOME'
  `;
  console.log(`✓ System Categories (EXPENSE): ${systemCategoryExpenseCount[0].count}`);
  console.log(`✓ System Categories (INCOME): ${systemCategoryIncomeCount[0].count}`);

  // Check BudgetAllocation migration
  const budgetAllocationMigrated = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "budget_allocations" WHERE "systemCategoryId" IS NOT NULL
  `;
  const budgetAllocationTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "budget_allocations"
  `;
  console.log(`\n✓ Budget Allocations migrated: ${budgetAllocationMigrated[0].count} / ${budgetAllocationTotal[0].count}`);

  // Check Transaction migration
  const transactionMigrated = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "transactions" WHERE "systemCategoryId" IS NOT NULL
  `;
  const transactionTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "transactions"
  `;
  console.log(`✓ Transactions migrated: ${transactionMigrated[0].count} / ${transactionTotal[0].count}`);

  // Check PreSeasonAllocation migration
  const preSeasonAllocationMigrated = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "pre_season_allocations" WHERE "systemCategoryId" IS NOT NULL
  `;
  const preSeasonAllocationTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "pre_season_allocations"
  `;
  console.log(`✓ Pre-Season Allocations migrated: ${preSeasonAllocationMigrated[0].count} / ${preSeasonAllocationTotal[0].count}`);

  // Check BudgetEnvelope migration (if any exist)
  const budgetEnvelopeMigrated = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "budget_envelopes" WHERE "systemCategoryId" IS NOT NULL
  `;
  const budgetEnvelopeTotal = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "budget_envelopes"
  `;
  console.log(`✓ Budget Envelopes migrated: ${budgetEnvelopeMigrated[0].count} / ${budgetEnvelopeTotal[0].count}`);

  // Sample display category with system categories
  console.log('\n📊 Sample Display Category Mapping:');
  const sampleMapping = await prisma.$queryRaw<
    Array<{ displayName: string; systemName: string; systemType: string }>
  >`
    SELECT
      dc.name as "displayName",
      sc.name as "systemName",
      sc.type as "systemType"
    FROM "display_categories" dc
    INNER JOIN "system_categories" sc ON sc."displayCategoryId" = dc.id
    WHERE dc.slug = 'ice-facilities'
    ORDER BY sc.name
    LIMIT 5
  `;
  sampleMapping.forEach((row) => {
    console.log(`   ${row.displayName} → ${row.systemName} (${row.systemType})`);
  });

  // Check income categories (no display category)
  console.log('\n💰 Income System Categories:');
  const incomeCategories = await prisma.$queryRaw<Array<{ name: string }>>`
    SELECT name FROM "system_categories"
    WHERE type = 'INCOME'
    ORDER BY name
    LIMIT 5
  `;
  incomeCategories.forEach((row) => {
    console.log(`   - ${row.name}`);
  });

  console.log('\n✅ Migration verification completed!');
}

main()
  .catch((e) => {
    console.error('Error verifying migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
