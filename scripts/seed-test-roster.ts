import { prisma } from '../lib/prisma';

async function seedTestRoster() {
  try {
    // Find the first team (for testing)
    const team = await prisma.team.findFirst({
      select: { id: true, name: true },
    });

    if (!team) {
      console.error('No team found. Please complete onboarding first.');
      process.exit(1);
    }

    console.log(`Seeding roster for team: ${team.name} (${team.id})`);

    // Test roster data - 18 families with 2 having secondary emails
    const families = [
      {
        familyName: 'Anderson Family',
        playerName: 'Connor Anderson',
        primaryEmail: 'mike.anderson@email.com',
        secondaryEmail: 'sarah.anderson@email.com',
      },
      {
        familyName: 'Martinez Family',
        playerName: 'Diego Martinez',
        primaryEmail: 'carlos.martinez@email.com',
        secondaryEmail: 'maria.martinez@email.com',
      },
      {
        familyName: 'Thompson Family',
        playerName: 'Ethan Thompson',
        primaryEmail: 'david.thompson@email.com',
        secondaryEmail: null,
      },
      {
        familyName: "O'Brien Family",
        playerName: "Liam O'Brien",
        primaryEmail: 'patrick.obrien@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Chen Family',
        playerName: 'Ryan Chen',
        primaryEmail: 'james.chen@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Williams Family',
        playerName: 'Jack Williams',
        primaryEmail: 'robert.williams@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Patel Family',
        playerName: 'Arjun Patel',
        primaryEmail: 'raj.patel@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Johnson Family',
        playerName: 'Mason Johnson',
        primaryEmail: 'chris.johnson@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Kowalski Family',
        playerName: 'Noah Kowalski',
        primaryEmail: 'tomasz.kowalski@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Singh Family',
        playerName: 'Avi Singh',
        primaryEmail: 'harpreet.singh@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'MacDonald Family',
        playerName: 'Finnegan MacDonald',
        primaryEmail: 'ian.macdonald@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Rodriguez Family',
        playerName: 'Lucas Rodriguez',
        primaryEmail: 'jose.rodriguez@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Kim Family',
        playerName: 'Joshua Kim',
        primaryEmail: 'daniel.kim@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Murphy Family',
        playerName: 'Owen Murphy',
        primaryEmail: 'sean.murphy@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Leblanc Family',
        playerName: 'Benjamin Leblanc',
        primaryEmail: 'marc.leblanc@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Nguyen Family',
        playerName: 'Tyler Nguyen',
        primaryEmail: 'minh.nguyen@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Bennett Family',
        playerName: 'Carter Bennett',
        primaryEmail: 'paul.bennett@email.com',
        secondaryEmail: null,
      },
      {
        familyName: 'Foster Family',
        playerName: 'Dylan Foster',
        primaryEmail: 'eric.foster@email.com',
        secondaryEmail: null,
      },
    ];

    // Clear existing families (optional - uncomment if you want a fresh start)
    // await prisma.family.deleteMany({ where: { teamId: team.id } });

    // Insert families
    const result = await prisma.family.createMany({
      data: families.map((f) => ({
        teamId: team.id,
        familyName: f.familyName,
        primaryEmail: f.primaryEmail,
        secondaryEmail: f.secondaryEmail,
      })),
    });

    console.log(`✅ Successfully added ${result.count} families to the roster!`);
    console.log('\nRoster breakdown:');
    console.log(`- ${families.filter((f) => f.secondaryEmail).length} families with two parents`);
    console.log(`- ${families.filter((f) => !f.secondaryEmail).length} families with one parent contact`);
    console.log('\nPlayer names (for reference):');
    families.forEach((f, i) => {
      console.log(`  ${i + 1}. ${f.playerName}`);
    });
  } catch (error) {
    console.error('Error seeding roster:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestRoster();
