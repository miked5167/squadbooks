import { prisma } from '../lib/prisma'

async function main() {
  // Get current user
  const user = await prisma.user.findUnique({
    where: { clerkId: 'demo_2025_2026_000076' },
    select: {
      id: true,
      name: true,
      role: true,
      teamId: true,
      team: {
        select: {
          name: true,
        },
      },
    },
  })

  console.log('Current User:', JSON.stringify(user, null, 2))

  // Get all team members
  const teamMembers = await prisma.user.findMany({
    where: {
      teamId: user?.teamId,
    },
    select: {
      id: true,
      name: true,
      role: true,
    },
  })

  console.log('\nTeam Members:')
  teamMembers.forEach((member) => {
    console.log(`  ${member.name} (${member.role}) - ID: ${member.id}`)
  })

  // Get pending approvals for this team
  const approvals = await prisma.approval.findMany({
    where: {
      teamId: user?.teamId,
      status: 'PENDING',
    },
    include: {
      approver: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      transaction: {
        select: {
          vendor: true,
          amount: true,
        },
      },
    },
    take: 10,
  })

  console.log('\nPending Approvals for this team:')
  approvals.forEach((a) => {
    const isAssignedToCurrentUser = a.approvedBy === user?.id
    console.log(
      `  ${a.transaction.vendor} ($${a.transaction.amount}) - Assigned to: ${a.approver.name} (${a.approver.role})${isAssignedToCurrentUser ? ' ✅ YOUR APPROVAL' : ''}`
    )
  })

  console.log(`\nTotal pending approvals: ${approvals.length}`)
  console.log(
    `Approvals assigned to you: ${approvals.filter((a) => a.approvedBy === user?.id).length}`
  )
}

main()
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
