/**
 * Quick script to get the association ID for testing
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const associations = await prisma.association.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
      season: true,
    },
  })

  if (associations.length === 0) {
    console.log('❌ No associations found. Run seed script first.')
    console.log('   npx tsx scripts/seed-dev-test-data.ts')
    return
  }

  console.log('\n📋 Associations in database:\n')
  associations.forEach((assoc, index) => {
    console.log(`${index + 1}. ${assoc.name} (${assoc.abbreviation || 'N/A'})`)
    console.log(`   ID: ${assoc.id}`)
    console.log(`   Season: ${assoc.season || 'N/A'}`)
    console.log(`   URL: http://localhost:3000/association/${assoc.id}/overview\n`)
  })
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
