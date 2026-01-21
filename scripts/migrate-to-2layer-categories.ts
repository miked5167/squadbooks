/**
 * Data migration script for 2-layer category model
 * Maps existing Category records to SystemCategory and updates all references
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping of old category names to system category slugs
const CATEGORY_MAPPING: Record<string, string> = {
  // Ice & Facilities
  'Ice Time': 'practice-ice',
  'Facility Rental': 'facility-rental',
  'Ice Maintenance': 'ice-maintenance',

  // Equipment & Uniforms
  'Team Jerseys': 'team-jerseys',
  'Team Equipment': 'team-equipment',
  'Goalie Equipment': 'goalie-equipment',
  'Equipment Repairs': 'equipment-repairs',

  // Tournament & League Fees
  'Tournament Entry Fees': 'tournament-fees',
  'League Registration': 'league-registration',
  'Exhibition Games': 'exhibition-fees',

  // Travel & Accommodation
  'Hotels': 'hotels',
  'Transportation': 'transportation',
  'Meals': 'team-meals',

  // Coaching & Officials
  'Coaching Fees': 'coaching-fees',
  'Referee Fees': 'referees',
  'Trainer Fees': 'trainer-fees',

  // Fundraising & Events
  'Fundraising Costs': 'fundraising-supplies',
  'Team Events': 'team-events',
  'Awards & Prizes': 'awards-prizes',

  // Administrative
  'Insurance': 'insurance',
  'Bank Fees': 'bank-fees',
  'Office Supplies': 'office-supplies',
  'Software & Tools': 'software-tools',
  'Marketing & Advertising': 'marketing',

  // Other
  'Miscellaneous': 'miscellaneous',
  'Uncategorized': 'uncategorized',

  // Income Categories
  'Registration Fees': 'registration-fees',
  'Tryout Fees': 'tryout-fees',
  'Team Fees': 'player-fees',
  'Fundraising Revenue': 'fundraising-revenue',
  'Sponsorships': 'sponsorships',
  'Donations': 'donations',
  'Grants': 'grants',
  'Apparel Sales': 'apparel-sales',
  'Raffle/50-50': 'raffle-proceeds',
  'Other Income': 'other-income',
};

async function main() {
  console.log('Starting data migration to 2-layer category model...\n');

  // Step 1: Get all system categories
  const systemCategories = await prisma.$queryRaw<Array<{ id: string; slug: string; name: string }>>`
    SELECT id, slug, name FROM "system_categories"
  `;

  const systemCategoryMap = new Map(
    systemCategories.map((sc) => [sc.slug, sc.id])
  );

  console.log(`✓ Loaded ${systemCategories.length} system categories`);

  // Step 2: Get all legacy categories
  const legacyCategories = await prisma.$queryRaw<
    Array<{ id: string; name: string; heading: string; type: string }>
  >`
    SELECT id, name, heading, type FROM "categories"
  `;

  console.log(`✓ Found ${legacyCategories.length} legacy categories to migrate\n`);

  // Step 3: Create mapping from legacy category ID to system category ID
  const categoryIdMap = new Map<string, string>();
  let matchedCount = 0;
  let unmatchedCount = 0;
  const unmatchedCategories: string[] = [];

  for (const cat of legacyCategories) {
    let systemCategorySlug = CATEGORY_MAPPING[cat.name];

    // Fallback: Try to find a similar system category by name
    if (!systemCategorySlug) {
      const similarCategory = systemCategories.find(
        (sc) => sc.name.toLowerCase() === cat.name.toLowerCase()
      );
      if (similarCategory) {
        systemCategorySlug = similarCategory.slug;
      }
    }

    // Last resort: Map to miscellaneous or other-income based on type
    if (!systemCategorySlug) {
      systemCategorySlug = cat.type === 'INCOME' ? 'other-income' : 'miscellaneous';
      unmatchedCategories.push(`${cat.name} (${cat.heading})`);
      unmatchedCount++;
    } else {
      matchedCount++;
    }

    const systemCategoryId = systemCategoryMap.get(systemCategorySlug);
    if (systemCategoryId) {
      categoryIdMap.set(cat.id, systemCategoryId);
    } else {
      console.warn(`⚠️  Could not find system category for slug: ${systemCategorySlug}`);
    }
  }

  console.log(`✓ Matched ${matchedCount} categories`);
  if (unmatchedCount > 0) {
    console.log(`⚠️  ${unmatchedCount} categories mapped to default (miscellaneous/other-income):`);
    unmatchedCategories.forEach((cat) => console.log(`   - ${cat}`));
  }
  console.log('');

  // Step 4: Migrate BudgetAllocation records
  let migratedAllocations = 0;
  const allocations = await prisma.$queryRaw<Array<{ id: string; categoryId: string }>>`
    SELECT id, "categoryId" FROM "budget_allocations" WHERE "categoryId" IS NOT NULL
  `;

  for (const allocation of allocations) {
    const systemCategoryId = categoryIdMap.get(allocation.categoryId);
    if (systemCategoryId) {
      await prisma.$executeRawUnsafe(`
        UPDATE "budget_allocations"
        SET "systemCategoryId" = $1
        WHERE id = $2
      `, systemCategoryId, allocation.id);
      migratedAllocations++;
    }
  }
  console.log(`✓ Migrated ${migratedAllocations} budget allocations`);

  // Step 5: Migrate Transaction records
  let migratedTransactions = 0;
  const transactions = await prisma.$queryRaw<Array<{ id: string; categoryId: string }>>`
    SELECT id, "categoryId" FROM "transactions" WHERE "categoryId" IS NOT NULL
  `;

  for (const transaction of transactions) {
    const systemCategoryId = categoryIdMap.get(transaction.categoryId);
    if (systemCategoryId) {
      await prisma.$executeRawUnsafe(`
        UPDATE "transactions"
        SET "systemCategoryId" = $1
        WHERE id = $2
      `, systemCategoryId, transaction.id);
      migratedTransactions++;
    }
  }
  console.log(`✓ Migrated ${migratedTransactions} transactions`);

  // Step 6: Migrate PreSeasonAllocation records
  let migratedPreSeasonAllocations = 0;
  const preSeasonAllocations = await prisma.$queryRaw<Array<{ id: string; categoryId: string }>>`
    SELECT id, "categoryId" FROM "pre_season_allocations" WHERE "categoryId" IS NOT NULL
  `;

  for (const allocation of preSeasonAllocations) {
    const systemCategoryId = categoryIdMap.get(allocation.categoryId);
    if (systemCategoryId) {
      await prisma.$executeRawUnsafe(`
        UPDATE "pre_season_allocations"
        SET "systemCategoryId" = $1
        WHERE id = $2
      `, systemCategoryId, allocation.id);
      migratedPreSeasonAllocations++;
    }
  }
  console.log(`✓ Migrated ${migratedPreSeasonAllocations} pre-season allocations`);

  // Step 7: Migrate BudgetEnvelope records
  let migratedEnvelopes = 0;
  const envelopes = await prisma.$queryRaw<Array<{ id: string; categoryId: string }>>`
    SELECT id, "categoryId" FROM "budget_envelopes" WHERE "categoryId" IS NOT NULL
  `;

  for (const envelope of envelopes) {
    const systemCategoryId = categoryIdMap.get(envelope.categoryId);
    if (systemCategoryId) {
      await prisma.$executeRawUnsafe(`
        UPDATE "budget_envelopes"
        SET "systemCategoryId" = $1
        WHERE id = $2
      `, systemCategoryId, envelope.id);
      migratedEnvelopes++;
    }
  }
  console.log(`✓ Migrated ${migratedEnvelopes} budget envelopes`);

  console.log('\n✅ Data migration completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Verify migrated data in the database');
  console.log('2. Update application code to use systemCategoryId');
  console.log('3. Remove legacy categoryId columns after verification (future migration)');
  console.log('4. Remove legacy Category table after all references are updated');
}

main()
  .catch((e) => {
    console.error('Error during data migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
