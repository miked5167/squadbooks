import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.dev' })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧪 Simulating GET /api/settings endpoint...\n')

    // Simulate what the API does
    const clerkId = 'demo_2025_2026_000076'

    // Step 1: Get user
    console.log('Step 1: Finding user...')
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        clerkId: true,
        email: true,
        name: true,
        role: true,
        teamId: true,
        isActive: true,
      },
    })

    if (!user) {
      console.error('❌ User not found')
      return
    }

    console.log('✅ User found:', user.name, '-', user.role)
    console.log()

    if (!user.isActive) {
      console.error('❌ User is not active')
      return
    }

    if (!user.teamId) {
      console.error('❌ User has no teamId')
      return
    }

    // Step 2: Fetch team with profile data
    console.log('Step 2: Fetching team...')
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        name: true,
        teamType: true,
        ageDivision: true,
        competitiveLevel: true,
        level: true,
        season: true,
        budgetTotal: true,
        logoUrl: true,
        associationName: true,
        seasonStartDate: true,
        seasonEndDate: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!team) {
      console.error('❌ Team not found')
      return
    }

    console.log('✅ Team found:', team.name)
    console.log()

    // Step 3: Fetch or create team settings
    console.log('Step 3: Fetching team settings...')
    let settings = await prisma.teamSettings.findUnique({
      where: { teamId: user.teamId },
    })

    if (!settings) {
      console.log('⚠️  Settings not found, creating defaults...')
      settings = await prisma.teamSettings.create({
        data: {
          teamId: user.teamId,
          dualApprovalEnabled: true,
          dualApprovalThreshold: 200.0,
          receiptRequired: true,
          allowSelfReimbursement: false,
          duplicateDetectionEnabled: true,
          allowedPaymentMethods: ['CASH', 'CHEQUE', 'E_TRANSFER'],
          duplicateDetectionWindow: 7,
        },
      })
    }

    console.log('✅ Settings found/created')
    console.log()

    // Step 4: Return response
    console.log('Step 4: Creating response...')
    const response = {
      team,
      settings,
    }

    console.log('✅ API Response:')
    console.log(JSON.stringify(response, null, 2))
    console.log()
    console.log('✅ All steps completed successfully!')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    await prisma.$disconnect()
  }
}

main()
