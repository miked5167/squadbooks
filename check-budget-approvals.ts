import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.budgetApproval.count();
  console.log(`Total budget approvals: ${count}`);

  const approvals = await prisma.budgetApproval.findMany({
    include: {
      team: { select: { name: true } },
      acknowledgments: { select: { acknowledged: true } }
    }
  });

  console.log('\nBudget Approvals:');
  approvals.forEach(approval => {
    const ackCount = approval.acknowledgments.filter(a => a.acknowledged).length;
    console.log(`  - ${approval.team.name}: ${approval.approvalType} (${ackCount}/${approval.requiredCount} acknowledged)`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
