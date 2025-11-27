import { prisma } from '../lib/prisma'

async function main() {
  const loganClerkId = 'demo_2025_2026_000076'

  // Get Logan's user ID
  const logan = await prisma.user.findUnique({
    where: { clerkId: loganClerkId },
    select: {
      id: true,
      name: true,
      teamId: true,
    },
  })

  if (!logan) {
    throw new Error('Logan not found')
  }

  console.log(`Reassigning approvals to: ${logan.name} (ID: ${logan.id})\n`)

  // Get all pending approvals for Logan's team
  const approvals = await prisma.approval.findMany({
    where: {
      teamId: logan.teamId,
      status: 'PENDING',
    },
    include: {
      transaction: {
        select: {
          vendor: true,
          amount: true,
        },
      },
    },
  })

  console.log(`Found ${approvals.length} pending approvals to reassign\n`)

  let updated = 0

  for (const approval of approvals) {
    console.log(`  ${approval.transaction.vendor} - $${approval.transaction.amount}`)

    await prisma.approval.update({
      where: { id: approval.id },
      data: {
        approvedBy: logan.id,
      },
    })

    updated++
  }

  console.log(`\n✅ Successfully reassigned ${updated} approvals to ${logan.name}`)
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
