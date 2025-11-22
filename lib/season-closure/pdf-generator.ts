import PDFDocument from 'pdfkit';
import { prisma } from '@/lib/prisma';

/**
 * Generate Final Budget PDF report
 */
export async function generateFinalBudgetPDF(params: {
  teamId: string;
  season: string;
  includeVariance?: boolean;
  includeNotes?: boolean;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const { teamId, season } = params;

      // Fetch team data
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          budgetAllocations: {
            where: { season },
            include: { category: true },
            orderBy: { category: { sortOrder: 'asc' } },
          },
        },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Final Budget Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Team: ${team.name}`, { align: 'center' });
      doc.text(`Season: ${season}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Budget summary
      doc.fontSize(16).text('Budget Allocations', { underline: true });
      doc.moveDown();

      let totalAllocated = 0;

      // Group by heading
      const groupedAllocations = team.budgetAllocations.reduce((acc, alloc) => {
        const heading = alloc.category.heading || 'Other';
        if (!acc[heading]) acc[heading] = [];
        acc[heading].push(alloc);
        totalAllocated += Number(alloc.allocated);
        return acc;
      }, {} as Record<string, typeof team.budgetAllocations>);

      // Render each heading group
      Object.entries(groupedAllocations).forEach(([heading, allocations]) => {
        doc.font('Helvetica-Bold').fontSize(14).text(heading);
        doc.font('Helvetica').moveDown(0.5);

        allocations.forEach((alloc) => {
          const amount = Number(alloc.allocated);
          doc.fontSize(10).text(
            `  ${alloc.category.name}: $${amount.toFixed(2)}`,
            { indent: 20 }
          );
        });

        doc.moveDown();
      });

      // Total
      doc.moveDown();
      doc.font('Helvetica-Bold').fontSize(14).text(`Total Budget: $${totalAllocated.toFixed(2)}`);
      doc.font('Helvetica');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Transaction History PDF report
 */
export async function generateTransactionHistoryPDF(params: {
  teamId: string;
  season: string;
  includeReceipts?: boolean;
  sortBy?: 'date' | 'category';
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const { teamId, season } = params;

      // Fetch team and transactions
      const team = await prisma.team.findUnique({
        where: { id: teamId },
      });

      const transactions = await prisma.transaction.findMany({
        where: {
          teamId,
          deletedAt: null,
          status: 'APPROVED',
        },
        include: {
          category: true,
          creator: true,
        },
        orderBy: { transactionDate: 'asc' },
      });

      if (!team) {
        throw new Error('Team not found');
      }

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Complete Transaction History', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Team: ${team.name}`, { align: 'center' });
      doc.text(`Season: ${season}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Transaction list
      doc.fontSize(16).text(`Transactions (${transactions.length} total)`, { underline: true });
      doc.moveDown();

      let totalIncome = 0;
      let totalExpenses = 0;

      transactions.forEach((tx, index) => {
        const amount = Number(tx.amount);
        if (tx.type === 'INCOME') totalIncome += amount;
        else totalExpenses += amount;

        doc.font('Helvetica-Bold').fontSize(10).text(
          `${index + 1}. ${new Date(tx.transactionDate).toLocaleDateString()} - ${tx.vendor}`
        );
        doc.font('Helvetica');
        doc.text(`   Category: ${tx.category.name}`);
        doc.text(`   Amount: $${amount.toFixed(2)} (${tx.type})`);
        if (tx.description) {
          doc.text(`   Description: ${tx.description}`);
        }
        if (tx.receiptUrl) {
          doc.text(`   Receipt: Available`);
        }
        doc.moveDown(0.5);
      });

      // Summary
      doc.moveDown();
      doc.fontSize(14).text('Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Total Income: $${totalIncome.toFixed(2)}`);
      doc.text(`Total Expenses: $${totalExpenses.toFixed(2)}`);
      doc.font('Helvetica-Bold').text(`Final Balance: $${(totalIncome - totalExpenses).toFixed(2)}`);
      doc.font('Helvetica');

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Budget Variance PDF report
 */
export async function generateBudgetVariancePDF(params: {
  teamId: string;
  season: string;
  highlightOverages?: boolean;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const { teamId, season } = params;

      // Fetch budget allocations
      const allocations = await prisma.budgetAllocation.findMany({
        where: { teamId, season },
        include: { category: true },
        orderBy: { category: { sortOrder: 'asc' } },
      });

      // Fetch actual spending by category
      const spendingByCategory = await Promise.all(
        allocations.map(async (alloc) => {
          const spent = await prisma.transaction.aggregate({
            where: {
              teamId,
              categoryId: alloc.categoryId,
              type: 'EXPENSE',
              status: 'APPROVED',
              deletedAt: null,
            },
            _sum: { amount: true },
          });

          return {
            category: alloc.category,
            allocated: Number(alloc.allocated),
            spent: spent._sum.amount ? Number(spent._sum.amount) : 0,
          };
        })
      );

      const team = await prisma.team.findUnique({ where: { id: teamId } });

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Budget Variance Analysis', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Team: ${team?.name}`, { align: 'center' });
      doc.text(`Season: ${season}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Variance report
      doc.fontSize(16).text('Budget vs Actual', { underline: true });
      doc.moveDown();

      spendingByCategory.forEach((item) => {
        const variance = item.allocated - item.spent;
        const percentUsed = item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;

        doc.font('Helvetica-Bold').fontSize(12).text(item.category.name);
        doc.font('Helvetica');
        doc.fontSize(10).text(`  Allocated: $${item.allocated.toFixed(2)}`);
        doc.text(`  Spent: $${item.spent.toFixed(2)}`);
        doc.text(`  Variance: $${variance.toFixed(2)} (${percentUsed.toFixed(1)}% used)`);

        if (variance < 0 && params.highlightOverages) {
          doc.fillColor('red').text(`  OVER BUDGET BY $${Math.abs(variance).toFixed(2)}`);
          doc.fillColor('black');
        }

        doc.moveDown(0.5);
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Audit Trail PDF report
 */
export async function generateAuditTrailPDF(params: {
  teamId: string;
  season: string;
  includeApprovals?: boolean;
}): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const { teamId, season } = params;

      // Fetch audit logs
      const logs = await prisma.auditLog.findMany({
        where: { teamId },
        orderBy: { createdAt: 'desc' },
        take: 500, // Limit to recent 500 actions
      });

      const team = await prisma.team.findUnique({ where: { id: teamId } });

      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('Audit Trail Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Team: ${team?.name}`, { align: 'center' });
      doc.text(`Season: ${season}`, { align: 'center' });
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
      doc.moveDown(2);

      // Audit log entries
      doc.fontSize(16).text(`Audit Log (${logs.length} entries)`, { underline: true });
      doc.moveDown();

      logs.forEach((log, index) => {
        doc.font('Helvetica-Bold').fontSize(9).text(
          `${index + 1}. ${new Date(log.createdAt).toLocaleString()} - ${log.action}`
        );
        doc.font('Helvetica');
        doc.text(`   Entity: ${log.entityType} (${log.entityId})`);
        doc.text(`   User: ${log.userId}`);
        doc.moveDown(0.3);

        // Prevent page overflow
        if (index % 20 === 19 && index < logs.length - 1) {
          doc.addPage();
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
