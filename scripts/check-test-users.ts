import { prisma } from '../lib/prisma'

async function checkTestUsers() {
  try {
    console.log('🔍 Checking test users for approval workflow...\n')

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamId: true,
      },
      orderBy: {
        role: 'asc'
      }
    })

    console.log('📋 Current users:')
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`)
      console.log(`    Role: ${user.role}`)
      console.log(`    Team ID: ${user.teamId}`)
      console.log()
    })

    // Check for approval workflow users
    const treasurer = users.find(u => u.role === 'TREASURER')
    const assistantTreasurer = users.find(u => u.role === 'ASSISTANT_TREASURER')

    console.log('✅ Approval Workflow Check:')
    console.log(`  Treasurer: ${treasurer ? treasurer.name + ' (' + treasurer.email + ')' : '❌ NOT FOUND'}`)
    console.log(`  Assistant Treasurer: ${assistantTreasurer ? assistantTreasurer.name + ' (' + assistantTreasurer.email + ')' : '❌ NOT FOUND'}`)

    // Check existing approvals
    const approvals = await prisma.approval.findMany({
      include: {
        transaction: {
          select: {
            amount: true,
            vendor: true,
            type: true,
          }
        },
        approver: {
          select: {
            name: true,
            role: true,
          }
        },
        creator: {
          select: {
            name: true,
            role: true,
          }
        }
      }
    })

    console.log(`\n📊 Existing approvals: ${approvals.length}`)
    approvals.forEach(approval => {
      console.log(`  - ${approval.transaction.type} $${approval.transaction.amount} to ${approval.transaction.vendor}`)
      console.log(`    Status: ${approval.status}`)
      console.log(`    Creator: ${approval.creator.name}`)
      console.log(`    Approver: ${approval.approver.name}`)
      console.log()
    })

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkTestUsers()
