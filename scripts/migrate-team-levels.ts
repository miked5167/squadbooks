/**
 * Data migration script to convert legacy team level strings
 * to the new structured fields (teamType, ageDivision, competitiveLevel)
 *
 * Run with: npx tsx scripts/migrate-team-levels.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping from old level values to new structured fields
const levelMappings: Record<string, {
  teamType: 'HOUSE_LEAGUE' | 'REPRESENTATIVE' | 'ADULT_RECREATIONAL' | 'OTHER';
  ageDivision: 'U7' | 'U9' | 'U11' | 'U13' | 'U15' | 'U18' | 'OTHER';
  competitiveLevel: 'AAA' | 'AA' | 'A' | 'BB' | 'B' | 'MD' | 'HOUSE_RECREATIONAL' | 'NOT_APPLICABLE' | 'OTHER';
}> = {
  // House League
  'house': {
    teamType: 'HOUSE_LEAGUE',
    ageDivision: 'OTHER',
    competitiveLevel: 'HOUSE_RECREATIONAL',
  },

  // Adult
  'adult': {
    teamType: 'ADULT_RECREATIONAL',
    ageDivision: 'OTHER',
    competitiveLevel: 'NOT_APPLICABLE',
  },

  // Age divisions (assume rep/travel if not house)
  'u7': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U7',
    competitiveLevel: 'OTHER',
  },
  'u9': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U9',
    competitiveLevel: 'OTHER',
  },
  'u11': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U11',
    competitiveLevel: 'OTHER',
  },
  'u13': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U13',
    competitiveLevel: 'OTHER',
  },
  'u15': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U15',
    competitiveLevel: 'OTHER',
  },
  'u18': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'U18',
    competitiveLevel: 'OTHER',
  },

  // Competitive levels (assume representative, unknown age)
  'a': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'OTHER',
    competitiveLevel: 'A',
  },
  'aa': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'OTHER',
    competitiveLevel: 'AA',
  },
  'aaa': {
    teamType: 'REPRESENTATIVE',
    ageDivision: 'OTHER',
    competitiveLevel: 'AAA',
  },

  // Default fallback
  'other': {
    teamType: 'OTHER',
    ageDivision: 'OTHER',
    competitiveLevel: 'OTHER',
  },
};

async function migrateTeamLevels() {
  console.log('🔄 Starting team level migration...\n');

  try {
    // Find all teams with legacy level field populated
    const teams = await prisma.team.findMany({
      where: {
        level: {
          not: null,
        },
        // Only migrate if new fields are not set
        teamType: null,
      },
    });

    console.log(`Found ${teams.length} teams to migrate\n`);

    let successCount = 0;
    let failCount = 0;

    for (const team of teams) {
      const oldLevel = team.level?.toLowerCase() || 'other';
      const mapping = levelMappings[oldLevel] || levelMappings['other'];

      try {
        await prisma.team.update({
          where: { id: team.id },
          data: {
            teamType: mapping.teamType,
            ageDivision: mapping.ageDivision,
            competitiveLevel: mapping.competitiveLevel,
          },
        });

        console.log(`✅ Migrated team "${team.name}": ${oldLevel} → ${mapping.ageDivision} ${mapping.competitiveLevel}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to migrate team "${team.name}":`, error);
        failCount++;
      }
    }

    console.log(`\n✨ Migration complete!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Failed: ${failCount}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateTeamLevels();
