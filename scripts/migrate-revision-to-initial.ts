import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Checking for REVISION budget approvals...')

  try {
    // This will fail if the enum has already been updated, but that's okay
    const revisionRecords = await prisma.$queryRaw`
      SELECT id, type FROM "BudgetApproval" WHERE type = 'REVISION'
    `

    console.log('Found records:', revisionRecords)

    if (Array.isArray(revisionRecords) && revisionRecords.length > 0) {
      console.log(`Updating ${revisionRecords.length} REVISION records to INITIAL...`)

      await prisma.$executeRaw`
        UPDATE "BudgetApproval"
        SET type = 'INITIAL'
        WHERE type = 'REVISION'
      `

      console.log('✓ Successfully updated records')
    } else {
      console.log('No REVISION records found')
    }
  } catch (error) {
    console.error('Error:', error)
    console.log('\nNote: If the enum has already been updated, this error is expected.')
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
