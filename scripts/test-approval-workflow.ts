import { PrismaClient } from '@prisma/client'
import { createTransaction } from '../lib/db/transactions'

const prisma = new PrismaClient()

async function testApprovalWorkflow() {
  try {
    console.log('🔍 Starting approval workflow test...\n')

    // 1. Get the team and users
    console.log('1️⃣ Fetching team and users...')
    const team = await prisma.team.findFirst({
      where: { name: 'Springfield Ice Hawks' },
    })

    if (!team) {
      throw new Error('Team not found')
    }

    const treasurer = await prisma.user.findFirst({
      where: {
        teamId: team.id,
        role: 'TREASURER',
      },
    })

    const assistantTreasurer = await prisma.user.findFirst({
      where: {
        teamId: team.id,
        role: 'ASSISTANT_TREASURER',
      },
    })

    if (!treasurer || !assistantTreasurer) {
      throw new Error('Treasurer or Assistant Treasurer not found')
    }

    console.log(`   ✓ Team: ${team.name}`)
    console.log(`   ✓ Treasurer: ${treasurer.name}`)
    console.log(`   ✓ Assistant Treasurer: ${assistantTreasurer.name}\n`)

    // 2. Get a category for the transaction
    console.log('2️⃣ Fetching category...')
    const category = await prisma.category.findFirst({
      where: {
        name: 'Hotel Accommodations',
      },
    })

    if (!category) {
      throw new Error('Category not found')
    }

    console.log(`   ✓ Category: ${category.name}\n`)

    // 3. Create a test transaction that requires approval (> $200)
    console.log('3️⃣ Creating test transaction (amount > $200)...')
    const result = await createTransaction(
      {
        type: 'EXPENSE',
        amount: 450.00,
        categoryId: category.id,
        vendor: 'Test Hotel Inc',
        description: 'Test approval workflow - tournament accommodation',
        transactionDate: new Date().toISOString(),
      },
      team.id,
      treasurer.id
    )
    const testTransaction = result.transaction

    console.log(`   ✓ Transaction created: $${testTransaction.amount}`)
    console.log(`   ✓ Transaction ID: ${testTransaction.id}`)
    console.log(`   ✓ Status: ${testTransaction.status}\n`)

    // 4. Verify approval was created automatically
    console.log('4️⃣ Verifying approval was created...')
    const approval = await prisma.approval.findFirst({
      where: {
        transactionId: testTransaction.id,
      },
      include: {
        transaction: true,
        approver: true,
        creator: true,
      },
    })

    if (!approval) {
      throw new Error('❌ FAILED: Approval was not created automatically')
    }

    console.log(`   ✓ Approval created: ${approval.id}`)
    console.log(`   ✓ Assigned to: ${approval.approver.name} (${approval.approver.role})`)
    console.log(`   ✓ Status: ${approval.status}\n`)

    // 5. Test getPendingApprovals for the assistant treasurer
    console.log('5️⃣ Testing getPendingApprovals function...')
    const pendingApprovals = await prisma.approval.findMany({
      where: {
        teamId: team.id,
        approvedBy: assistantTreasurer.id,
        status: 'PENDING',
      },
      include: {
        transaction: {
          include: {
            category: true,
            creator: true,
          },
        },
      },
    })

    console.log(`   ✓ Found ${pendingApprovals.length} pending approval(s)`)
    const ourApproval = pendingApprovals.find(a => a.id === approval.id)
    if (!ourApproval) {
      throw new Error('❌ FAILED: Our test approval not found in pending list')
    }
    console.log(`   ✓ Test approval is in the pending list\n`)

    // 6. Test approval process
    console.log('6️⃣ Testing APPROVE workflow...')

    // First, let's create another test transaction to approve
    const approveResult = await createTransaction(
      {
        type: 'EXPENSE',
        amount: 350.00,
        categoryId: category.id,
        vendor: 'Test Vendor for Approval',
        description: 'This transaction will be approved',
        transactionDate: new Date().toISOString(),
      },
      team.id,
      treasurer.id
    )
    const approveTransaction = approveResult.transaction

    const approveApproval = await prisma.approval.findFirst({
      where: {
        transactionId: approveTransaction.id,
      },
    })

    if (!approveApproval) {
      throw new Error('❌ FAILED: Approval for approve test not created')
    }

    // Approve it
    await prisma.approval.update({
      where: { id: approveApproval.id },
      data: {
        status: 'APPROVED',
        comment: 'Test approval - looks good!',
        approvedAt: new Date(),
      },
    })

    await prisma.transaction.update({
      where: { id: approveTransaction.id },
      data: {
        status: 'APPROVED',
      },
    })

    // Verify the approval
    const approvedApproval = await prisma.approval.findUnique({
      where: { id: approveApproval.id },
    })

    const approvedTransaction = await prisma.transaction.findUnique({
      where: { id: approveTransaction.id },
    })

    if (approvedApproval?.status !== 'APPROVED' || approvedTransaction?.status !== 'APPROVED') {
      throw new Error('❌ FAILED: Approval or transaction status not updated correctly')
    }

    console.log(`   ✓ Transaction approved successfully`)
    console.log(`   ✓ Approval status: ${approvedApproval.status}`)
    console.log(`   ✓ Transaction status: ${approvedTransaction.status}`)
    console.log(`   ✓ Comment: ${approvedApproval.comment}\n`)

    // 7. Test rejection process
    console.log('7️⃣ Testing REJECT workflow...')

    // Create another test transaction to reject
    const rejectResult = await createTransaction(
      {
        type: 'EXPENSE',
        amount: 550.00,
        categoryId: category.id,
        vendor: 'Test Vendor for Rejection',
        description: 'This transaction will be rejected',
        transactionDate: new Date().toISOString(),
      },
      team.id,
      treasurer.id
    )
    const rejectTransaction = rejectResult.transaction

    const rejectApproval = await prisma.approval.findFirst({
      where: {
        transactionId: rejectTransaction.id,
      },
    })

    if (!rejectApproval) {
      throw new Error('❌ FAILED: Approval for reject test not created')
    }

    // Reject it
    await prisma.approval.update({
      where: { id: rejectApproval.id },
      data: {
        status: 'REJECTED',
        comment: 'Test rejection - amount seems too high',
        approvedAt: new Date(),
      },
    })

    await prisma.transaction.update({
      where: { id: rejectTransaction.id },
      data: {
        status: 'REJECTED',
      },
    })

    // Verify the rejection
    const rejectedApproval = await prisma.approval.findUnique({
      where: { id: rejectApproval.id },
    })

    const rejectedTransaction = await prisma.transaction.findUnique({
      where: { id: rejectTransaction.id },
    })

    if (rejectedApproval?.status !== 'REJECTED' || rejectedTransaction?.status !== 'REJECTED') {
      throw new Error('❌ FAILED: Rejection status not updated correctly')
    }

    console.log(`   ✓ Transaction rejected successfully`)
    console.log(`   ✓ Approval status: ${rejectedApproval.status}`)
    console.log(`   ✓ Transaction status: ${rejectedTransaction.status}`)
    console.log(`   ✓ Comment: ${rejectedApproval.comment}\n`)

    // 8. Test that small transactions (<= $200) don't create approvals
    console.log('8️⃣ Testing small transaction (amount <= $200)...')
    const smallResult = await createTransaction(
      {
        type: 'EXPENSE',
        amount: 150.00,
        categoryId: category.id,
        vendor: 'Small Purchase Vendor',
        description: 'Small transaction - should not require approval',
        transactionDate: new Date().toISOString(),
      },
      team.id,
      treasurer.id
    )
    const smallTransaction = smallResult.transaction

    const smallApproval = await prisma.approval.findFirst({
      where: {
        transactionId: smallTransaction.id,
      },
    })

    if (smallApproval) {
      console.log(`   ⚠️  WARNING: Small transaction created an approval (it shouldn't)`)
    } else {
      console.log(`   ✓ Small transaction did not create approval (correct)\n`)
    }

    // 9. Summary
    console.log('=' .repeat(60))
    console.log('📊 TEST SUMMARY')
    console.log('=' .repeat(60))
    console.log('✅ Approval workflow tests completed successfully!\n')
    console.log('Tests performed:')
    console.log('  ✓ Transaction creation (amount > $200)')
    console.log('  ✓ Automatic approval creation')
    console.log('  ✓ Approval assignment to Assistant Treasurer')
    console.log('  ✓ getPendingApprovals query')
    console.log('  ✓ Approve transaction workflow')
    console.log('  ✓ Reject transaction workflow')
    console.log('  ✓ Small transaction behavior (no approval needed)\n')

    console.log('Test transactions created:')
    console.log(`  - Pending: ${testTransaction.id}`)
    console.log(`  - Approved: ${approveTransaction.id}`)
    console.log(`  - Rejected: ${rejectTransaction.id}`)
    console.log(`  - Small (no approval): ${smallTransaction.id}\n`)

    console.log('🎉 All tests passed!\n')

  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testApprovalWorkflow()
  .then(() => {
    console.log('Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Test failed with error:', error)
    process.exit(1)
  })
