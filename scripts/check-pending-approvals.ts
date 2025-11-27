import { prisma } from '../lib/prisma'

async function main() {
  console.log('Checking pending transactions and their approvals...\n')

  const pendingTransactions = await prisma.transaction.findMany({
    where: {
      status: 'PENDING',
    },
    include: {
      approvals: true,
      category: {
        select: {
          name: true,
          heading: true,
        },
      },
      creator: {
        select: {
          name: true,
          role: true,
        },
      },
      team: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
  })

  console.log(`Found ${pendingTransactions.length} pending transactions\n`)

  for (const transaction of pendingTransactions) {
    console.log(`Transaction ID: ${transaction.id}`)
    console.log(`  Team: ${transaction.team.name}`)
    console.log(`  Vendor: ${transaction.vendor}`)
    console.log(`  Amount: $${transaction.amount}`)
    console.log(`  Category: ${transaction.category.heading} > ${transaction.category.name}`)
    console.log(`  Created by: ${transaction.creator.name} (${transaction.creator.role})`)
    console.log(`  Approvals: ${transaction.approvals.length}`)

    if (transaction.approvals.length === 0) {
      console.log(`  ⚠️  WARNING: No approval records found!`)
    } else {
      transaction.approvals.forEach((approval, idx) => {
        console.log(`    Approval ${idx + 1}: ${approval.status} (ID: ${approval.id})`)
      })
    }
    console.log('')
  }

  // Now let's find transactions that need approvals created
  const transactionsWithoutApprovals = pendingTransactions.filter(
    (t) => t.approvals.length === 0
  )

  if (transactionsWithoutApprovals.length > 0) {
    console.log(`\n⚠️  Found ${transactionsWithoutApprovals.length} pending transactions WITHOUT approval records`)
    console.log('These need approval records to be created.\n')
  } else {
    console.log('✅ All pending transactions have approval records')
  }
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
