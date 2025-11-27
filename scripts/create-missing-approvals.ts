import { prisma } from '../lib/prisma'

async function main() {
  console.log('Creating missing approval records for pending transactions...\n')

  // Find all pending transactions without approvals
  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      approvals: true,
      team: {
        include: {
          users: {
            where: {
              role: {
                in: ['TREASURER', 'ASSISTANT_TREASURER'],
              },
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  const transactionsWithoutApprovals = pendingTransactions.filter(
    (t) => t.approvals.length === 0
  )

  console.log(`Found ${transactionsWithoutApprovals.length} pending transactions without approvals`)

  let created = 0
  let skipped = 0

  for (const transaction of transactionsWithoutApprovals) {
    console.log(`\nTransaction: ${transaction.vendor} - $${transaction.amount}`)
    console.log(`  Team: ${transaction.team.name}`)
    console.log(`  Created by: ${transaction.creator.name}`)

    // Find a treasurer or assistant treasurer (not the creator if possible)
    const treasurers = transaction.team.users
    const approver = treasurers.find((u) => u.id !== transaction.createdBy) || treasurers[0]

    if (!approver) {
      console.log(`  ⚠️  SKIPPED: No treasurer found for team`)
      skipped++
      continue
    }

    console.log(`  Approver: ${approver.name} (${approver.role})`)

    // Create the approval record
    try {
      await prisma.approval.create({
        data: {
          transactionId: transaction.id,
          approvedBy: approver.id,
          createdBy: transaction.createdBy,
          status: 'PENDING',
          teamId: transaction.teamId,
        },
      })
      console.log(`  ✅ Created approval record`)
      created++
    } catch (error) {
      console.error(`  ❌ Error creating approval:`, error)
      skipped++
    }
  }

  console.log(`\n\n=== Summary ===`)
  console.log(`Approval records created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Total processed: ${transactionsWithoutApprovals.length}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
