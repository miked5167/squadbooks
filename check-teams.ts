import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const teams = await prisma.team.findMany({
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          budgetApprovals: true
        }
      }
    },
    where: {
      associationName: 'Newmarket Minor Hockey Association'
    }
  });

  console.log('Teams and their budget approval counts:');
  teams.forEach(team => {
    console.log(`  - ${team.name}: ${team._count.budgetApprovals} budget approvals (Team ID: ${team.id.substring(0, 8)}...)`);
  });

  // Check if there are any budget approvals without proper team references
  const allApprovals = await prisma.budgetApproval.findMany({
    select: {
      id: true,
      teamId: true,
      approvalType: true,
      team: {
        select: {
          name: true
        }
      }
    }
  });

  console.log(`\nTotal budget approvals in database: ${allApprovals.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
