import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.dev' })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔍 Debugging Settings API for Logan Thompson...\n')

    // Find Logan Thompson
    const user = await prisma.user.findUnique({
      where: { clerkId: 'demo_2025_2026_000076' },
      include: {
        team: true,
      },
    })

    if (!user) {
      console.error('❌ User not found with clerkId: demo_2025_2026_000076')
      return
    }

    console.log('✅ User found:')
    console.log('  - Name:', user.name)
    console.log('  - Email:', user.email)
    console.log('  - Role:', user.role)
    console.log('  - Team ID:', user.teamId)
    console.log('  - Team Name:', user.team?.name)
    console.log('  - Is Active:', user.isActive)
    console.log()

    if (!user.teamId) {
      console.error('❌ User has no teamId!')
      return
    }

    // Fetch team details
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

    console.log('✅ Team data:')
    console.log(JSON.stringify(team, null, 2))
    console.log()

    // Check for problematic fields
    if (team?.logoUrl === '') {
      console.warn('⚠️  logoUrl is empty string (should be null)')
    }
    if (team?.contactEmail === '') {
      console.warn('⚠️  contactEmail is empty string (should be null)')
    }

    // Fetch team settings
    const settings = await prisma.teamSettings.findUnique({
      where: { teamId: user.teamId },
    })

    if (settings) {
      console.log('✅ Team settings found:')
      console.log(JSON.stringify(settings, null, 2))
    } else {
      console.log('⚠️  No team settings found (will be created on first access)')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
