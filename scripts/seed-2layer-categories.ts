/**
 * Seed script for 2-layer category model
 * Creates DisplayCategory and SystemCategory records with proper mapping
 */

import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Generate CUID-like ID
function generateId() {
  return 'c' + randomBytes(12).toString('base64').replace(/[^a-z0-9]/gi, '').substring(0, 24);
}

// Display Categories (Expense Rollups)
const EXPENSE_DISPLAY_CATEGORIES = [
  { name: 'Ice & Facilities', slug: 'ice-facilities', color: '#0EA5E9', sortOrder: 1 },
  { name: 'Equipment & Uniforms', slug: 'equipment-uniforms', color: '#8B5CF6', sortOrder: 2 },
  { name: 'Tournament & League Fees', slug: 'tournament-league', color: '#F59E0B', sortOrder: 3 },
  { name: 'Travel & Accommodation', slug: 'travel-accommodation', color: '#10B981', sortOrder: 4 },
  { name: 'Coaching & Officials', slug: 'coaching-officials', color: '#EF4444', sortOrder: 5 },
  { name: 'Fundraising & Events', slug: 'fundraising-events', color: '#EC4899', sortOrder: 6 },
  { name: 'Administrative', slug: 'administrative', color: '#64748B', sortOrder: 7 },
  { name: 'Other', slug: 'other', color: '#94A3B8', sortOrder: 8 },
];

// System Categories by Display Category
const SYSTEM_CATEGORIES = {
  'ice-facilities': [
    { name: 'Practice Ice', slug: 'practice-ice', isCommon: true, preauthEligible: true },
    { name: 'Game Ice', slug: 'game-ice', isCommon: true, preauthEligible: true },
    { name: 'Exhibition/Extra Ice', slug: 'exhibition-ice', isCommon: true, preauthEligible: false },
    { name: 'Facility Rental', slug: 'facility-rental', isCommon: true, preauthEligible: true },
    { name: 'Ice Maintenance', slug: 'ice-maintenance', isCommon: false, preauthEligible: false },
  ],
  'equipment-uniforms': [
    { name: 'Team Jerseys', slug: 'team-jerseys', isCommon: true, preauthEligible: false },
    { name: 'Socks/Apparel', slug: 'socks-apparel', isCommon: true, preauthEligible: false },
    { name: 'Practice Jerseys', slug: 'practice-jerseys', isCommon: true, preauthEligible: false },
    { name: 'Pucks/Training Aids', slug: 'pucks-training', isCommon: true, preauthEligible: false },
    { name: 'Team Equipment', slug: 'team-equipment', isCommon: true, preauthEligible: false },
    { name: 'Goalie Equipment', slug: 'goalie-equipment', isCommon: false, preauthEligible: false },
    { name: 'Equipment Repairs', slug: 'equipment-repairs', isCommon: false, preauthEligible: false },
  ],
  'tournament-league': [
    { name: 'Tournament Entry Fees', slug: 'tournament-fees', isCommon: true, preauthEligible: true },
    { name: 'League/Association Team Fees', slug: 'league-fees', isCommon: true, preauthEligible: true },
    { name: 'Exhibition Fees', slug: 'exhibition-fees', isCommon: true, preauthEligible: false },
    { name: 'League Registration', slug: 'league-registration', isCommon: true, preauthEligible: true },
  ],
  'travel-accommodation': [
    { name: 'Hotels/Accommodations', slug: 'hotels', isCommon: true, preauthEligible: true },
    { name: 'Team Meals', slug: 'team-meals', isCommon: true, preauthEligible: true },
    { name: 'Transportation (Bus/Fuel/Parking)', slug: 'transportation', isCommon: true, preauthEligible: true },
    { name: 'Travel Insurance', slug: 'travel-insurance', isCommon: false, preauthEligible: false },
  ],
  'coaching-officials': [
    { name: 'Skills Coach', slug: 'skills-coach', isCommon: true, preauthEligible: true },
    { name: 'Goalie Coach', slug: 'goalie-coach', isCommon: true, preauthEligible: true },
    { name: 'Coaching Clinics/Certification', slug: 'coaching-clinics', isCommon: false, preauthEligible: false },
    { name: 'Referees/Officials', slug: 'referees', isCommon: true, preauthEligible: true },
    { name: 'Coaching Fees', slug: 'coaching-fees', isCommon: true, preauthEligible: true },
    { name: 'Trainer Fees', slug: 'trainer-fees', isCommon: false, preauthEligible: false },
  ],
  'fundraising-events': [
    { name: 'Fundraising Supplies', slug: 'fundraising-supplies', isCommon: true, preauthEligible: false },
    { name: 'Fundraising Platform Fees', slug: 'fundraising-fees', isCommon: true, preauthEligible: false },
    { name: 'Event Costs (Party/Banquet)', slug: 'event-costs', isCommon: true, preauthEligible: false },
    { name: 'Team Events', slug: 'team-events', isCommon: true, preauthEligible: false },
    { name: 'Awards & Prizes', slug: 'awards-prizes', isCommon: true, preauthEligible: false },
  ],
  'administrative': [
    { name: 'Bank Fees', slug: 'bank-fees', isCommon: true, preauthEligible: true },
    { name: 'Cheque Printing', slug: 'cheque-printing', isCommon: false, preauthEligible: false },
    { name: 'Accounting/Admin', slug: 'accounting-admin', isCommon: false, preauthEligible: false },
    { name: 'Team Insurance', slug: 'team-insurance', isCommon: true, preauthEligible: true },
    { name: 'Insurance', slug: 'insurance', isCommon: true, preauthEligible: true },
    { name: 'Office Supplies', slug: 'office-supplies', isCommon: false, preauthEligible: false },
    { name: 'Software & Tools', slug: 'software-tools', isCommon: false, preauthEligible: false },
    { name: 'Marketing & Advertising', slug: 'marketing', isCommon: false, preauthEligible: false },
  ],
  'other': [
    { name: 'Miscellaneous', slug: 'miscellaneous', isCommon: false, isDiscouraged: true, preauthEligible: false },
    { name: 'Contingency/Reserve', slug: 'contingency', isCommon: false, preauthEligible: false },
    { name: 'Uncategorized', slug: 'uncategorized', isCommon: false, isDiscouraged: true, preauthEligible: false },
  ],
};

// Income System Categories (no display category)
const INCOME_CATEGORIES = [
  { name: 'Player/Team Fees', slug: 'player-fees', isCommon: true },
  { name: 'Registration Fees', slug: 'registration-fees', isCommon: true },
  { name: 'Tryout Fees', slug: 'tryout-fees', isCommon: true },
  { name: 'Sponsorships', slug: 'sponsorships', isCommon: true },
  { name: 'Donations', slug: 'donations', isCommon: true },
  { name: 'Fundraising Income (General)', slug: 'fundraising-income', isCommon: true },
  { name: 'Fundraising Revenue', slug: 'fundraising-revenue', isCommon: true },
  { name: 'Raffle/50-50 Proceeds', slug: 'raffle-proceeds', isCommon: true },
  { name: 'Grant/Subsidy', slug: 'grants', isCommon: false },
  { name: 'Carry-over from Prior Season', slug: 'carryover', isCommon: false },
  { name: 'Apparel Sales', slug: 'apparel-sales', isCommon: false },
  { name: 'Other Income', slug: 'other-income', isCommon: false },
];

async function main() {
  console.log('Starting 2-layer category seed...');

  // Create Display Categories (Expense Rollups)
  const displayCategoryMap: Record<string, string> = {};

  for (const dc of EXPENSE_DISPLAY_CATEGORIES) {
    const id = generateId();
    displayCategoryMap[dc.slug] = id;

    await prisma.$executeRawUnsafe(`
      INSERT INTO "display_categories" (id, name, slug, "sortOrder", type, color, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5::"DisplayCategoryType", $6, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, id, dc.name, dc.slug, dc.sortOrder, 'EXPENSE_ROLLUP', dc.color);

    console.log(`✓ Created display category: ${dc.name}`);
  }

  // Create System Categories (Expense)
  let totalSystemCategories = 0;
  for (const [displaySlug, categories] of Object.entries(SYSTEM_CATEGORIES)) {
    const displayCategoryId = displayCategoryMap[displaySlug];

    for (const sc of categories) {
      const id = generateId();

      await prisma.$executeRawUnsafe(`
        INSERT INTO "system_categories" (
          id, name, slug, type, "displayCategoryId",
          "isCommon", "isDiscouraged", "preauthEligible",
          "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4::"SystemCategoryType", $5, $6, $7, $8, NOW(), NOW())
        ON CONFLICT (slug) DO NOTHING
      `, id, sc.name, sc.slug, 'EXPENSE', displayCategoryId,
         sc.isCommon, sc.isDiscouraged || false, sc.preauthEligible);

      totalSystemCategories++;
    }
  }
  console.log(`✓ Created ${totalSystemCategories} expense system categories`);

  // Create System Categories (Income - no display category)
  for (const ic of INCOME_CATEGORIES) {
    const id = generateId();

    await prisma.$executeRawUnsafe(`
      INSERT INTO "system_categories" (
        id, name, slug, type, "displayCategoryId",
        "isCommon", "isDiscouraged", "preauthEligible",
        "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4::"SystemCategoryType", NULL, $5, false, false, NOW(), NOW())
      ON CONFLICT (slug) DO NOTHING
    `, id, ic.name, ic.slug, 'INCOME', ic.isCommon);
  }
  console.log(`✓ Created ${INCOME_CATEGORIES.length} income system categories`);

  console.log('\n✅ 2-layer category seed completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run data migration script to map existing Category records to SystemCategory');
  console.log('2. Update application code to use SystemCategory instead of Category');
  console.log('3. Test budget aggregation with new category model');
}

main()
  .catch((e) => {
    console.error('Error seeding 2-layer categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
