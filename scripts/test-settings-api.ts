import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import { teamProfileSchema } from '../lib/validations/settings'

dotenv.config({ path: '.env.dev' })

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🧪 Testing Settings API validation...\n')

    // Fetch team data exactly as the API does
    const team = await prisma.team.findUnique({
      where: { id: 'cmigst5mv00k5tge8mjh1nsve' }, // U15 A Thunder
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

    console.log('📦 Raw team data from database:')
    console.log(JSON.stringify(team, null, 2))
    console.log()

    // Try to validate with the schema
    console.log('🔍 Testing validation...')
    try {
      const validated = teamProfileSchema.parse(team)
      console.log('✅ Validation PASSED')
      console.log('Validated data:', JSON.stringify(validated, null, 2))
    } catch (validationError: any) {
      console.error('❌ Validation FAILED')
      console.error('Error:', validationError.message)
      if (validationError.errors) {
        console.error('Details:', JSON.stringify(validationError.errors, null, 2))
      }
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
