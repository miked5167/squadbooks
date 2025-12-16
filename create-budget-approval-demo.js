const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createBudgetApprovalDemo() {
  try {
    // Find a team with parents
    const team = await prisma.team.findFirst({
      where: {
        users: {
          some: {
            role: 'PARENT',
            isActive: true,
          },
        },
      },
      include: {
        users: {
          where: {
            role: 'PARENT',
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!team) {
      console.log('❌ No team found with active parents')
      return
    }

    console.log(`✅ Found team: ${team.name}`)
    console.log(`✅ Found ${team.users.length} parents`)

    // Find a treasurer for this team
    const treasurer = await prisma.user.findFirst({
      where: {
        teamId: team.id,
        role: { in: ['TREASURER', 'PRESIDENT'] },
      },
    })

    if (!treasurer) {
      console.log('❌ No treasurer found for this team')
      return
    }

    console.log(`✅ Found treasurer: ${treasurer.name}`)

    // Delete any existing demo budget approvals for this team
    const existing = await prisma.budgetApproval.findFirst({
      where: {
        teamId: team.id,
        description: { contains: 'DEMO' },
      },
    })

    if (existing) {
      await prisma.acknowledgment.deleteMany({
        where: { budgetApprovalId: existing.id },
      })
      await prisma.budgetApproval.delete({
        where: { id: existing.id },
      })
      console.log('✅ Cleaned up existing demo approval')
    }

    // Create a budget approval
    const budgetApproval = await prisma.budgetApproval.create({
      data: {
        teamId: team.id,
        season: '2024-2025',
        budgetTotal: 12500.00,
        approvalType: 'INITIAL',
        description: 'DEMO: Budget for 2024-2025 season - Version 1',
        requiredCount: team.users.length,
        createdBy: treasurer.id,
        // Optional: Set deadline 14 days from now
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    console.log(`✅ Created budget approval: ${budgetApproval.id}`)

    // Create acknowledgment records for each parent
    await prisma.acknowledgment.createMany({
      data: team.users.map((parent) => ({
        budgetApprovalId: budgetApproval.id,
        userId: parent.id,
        familyName: parent.name || 'Parent',
        email: parent.email,
      })),
    })

    console.log(`✅ Created ${team.users.length} acknowledgment records`)

    // Optionally, acknowledge a few to show progress
    const firstParent = team.users[0]
    if (firstParent) {
      await prisma.acknowledgment.updateMany({
        where: {
          budgetApprovalId: budgetApproval.id,
          userId: firstParent.id,
        },
        data: {
          acknowledged: true,
          acknowledgedAt: new Date(),
        },
      })
      console.log(`✅ Pre-acknowledged one parent to show progress`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 DEMO BUDGET APPROVAL CREATED!')
    console.log('='.repeat(60))
    console.log(`\n📋 Team: ${team.name}`)
    console.log(`💰 Budget: $${budgetApproval.budgetTotal.toLocaleString()}`)
    console.log(`👪 Parents: ${team.users.length}`)
    console.log(`✅ Acknowledged: 1 of ${team.users.length}`)
    console.log(`\n🔗 URL: http://localhost:3000/budget-approvals/${budgetApproval.id}`)
    console.log('\n👉 Login as any parent from this team to see the acknowledgment page!')
    console.log('\nParents on this team:')
    team.users.forEach((parent, i) => {
      console.log(`  ${i + 1}. ${parent.name} (${parent.email})`)
    })
    console.log('\n')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createBudgetApprovalDemo()
