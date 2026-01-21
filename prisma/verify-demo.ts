// prisma/verify-demo.ts
// Quick script to verify demo data was created

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔍 Verifying Demo Data...\n');

  // Find demo association
  const demoAssociation = await prisma.association.findFirst({
    where: { name: 'Newmarket Minor Hockey Association - Demo Data' },
  });

  if (!demoAssociation) {
    console.log('❌ Demo association not found!');
    return;
  }

  console.log('✅ Demo Association Found:', demoAssociation.name);

  // Count teams
  const teams = await prisma.team.findMany({
    where: {
      associationName: 'Newmarket Minor Hockey Association',
    },
    select: { id: true, name: true, budgetTotal: true },
  });

  console.log(`\n📊 Teams Created: ${teams.length}`);
  teams.forEach((team, idx) => {
    console.log(`   ${idx + 1}. ${team.name} (Budget: $${team.budgetTotal})`);
  });

  // Count demo users
  const demoUsers = await prisma.user.count({
    where: {
      clerkId: { startsWith: 'demo_2025_2026_' },
    },
  });
  console.log(`\n👥 Demo Users: ${demoUsers}`);

  // Count players
  const players = await prisma.player.count({
    where: {
      team: {
        associationName: 'Newmarket Minor Hockey Association',
      },
    },
  });
  console.log(`🏒 Players: ${players}`);

  // Count families
  const families = await prisma.family.count({
    where: {
      primaryEmail: { endsWith: '@demo.huddlebooks.app' },
    },
  });
  console.log(`👨‍👩‍👧‍👦 Families: ${families}`);

  // Count transactions
  const transactions = await prisma.transaction.count({
    where: {
      team: {
        associationName: 'Newmarket Minor Hockey Association',
      },
    },
  });
  console.log(`💰 Transactions: ${transactions}`);

  // Count by status
  const pending = await prisma.transaction.count({
    where: {
      team: { associationName: 'Newmarket Minor Hockey Association' },
      status: 'PENDING',
    },
  });
  const approved = await prisma.transaction.count({
    where: {
      team: { associationName: 'Newmarket Minor Hockey Association' },
      status: 'APPROVED',
    },
  });
  const rejected = await prisma.transaction.count({
    where: {
      team: { associationName: 'Newmarket Minor Hockey Association' },
      status: 'REJECTED',
    },
  });
  console.log(`   - Approved: ${approved}`);
  console.log(`   - Pending: ${pending}`);
  console.log(`   - Rejected: ${rejected}`);

  // Count alerts
  const alerts = await prisma.alert.count({
    where: {
      associationId: demoAssociation.id,
    },
  });
  console.log(`\n🚨 Alerts: ${alerts}`);

  // Count audit logs
  const auditLogs = await prisma.auditLog.count({
    where: {
      team: {
        associationName: 'Newmarket Minor Hockey Association',
      },
    },
  });
  console.log(`📋 Audit Logs: ${auditLogs}`);

  console.log('\n✅ Demo data verification complete!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
