const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkReportSchedules() {
  const schedules = await prisma.reportSchedule.findMany({
    where: {
      associationId: '1d8c5e23-9a58-458b-ab84-b7ff697e86a4'
    },
    include: {
      association: {
        select: {
          name: true
        }
      }
    }
  });

  console.log('\n=== Report Schedules for Demo Hockey League ===\n');

  if (schedules.length === 0) {
    console.log('No report schedules found.');
  } else {
    console.log(`Found ${schedules.length} report schedule(s):\n`);
    schedules.forEach((schedule, index) => {
      console.log(`${index + 1}. Schedule ID: ${schedule.id}`);
      console.log(`   Recipient: ${schedule.recipient}`);
      console.log(`   Schedule Type: ${schedule.scheduleType}`);
      console.log(`   Recurring Frequency: ${schedule.recurringFrequency || 'N/A'}`);
      console.log(`   Due Day: ${schedule.dueDay || 'N/A'}`);
      console.log(`   Specific Dates: ${schedule.specificDates ? JSON.stringify(schedule.specificDates) : 'None'}`);
      console.log(`   Content Requirements:`);
      console.log(`     - Budget vs Actual: ${schedule.requireBudgetVsActual}`);
      console.log(`     - Budget Changes: ${schedule.requireBudgetChanges}`);
      console.log(`     - Category Breakdown: ${schedule.requireCategoryBreakdown}`);
      console.log(`     - Narrative: ${schedule.requireNarrative}`);
      if (schedule.requireNarrative) {
        console.log(`     - Narrative Min Length: ${schedule.narrativeMinLength || 'N/A'}`);
        console.log(`     - Narrative Prompts: ${schedule.narrativePrompts ? JSON.stringify(schedule.narrativePrompts) : 'None'}`);
      }
      console.log(`   Active: ${schedule.isActive}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkReportSchedules().catch(console.error);
