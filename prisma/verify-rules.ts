import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Verifying BMHA Rules...\n')

  const association = await prisma.association.findFirst({
    where: { abbreviation: 'BMHA' },
    include: {
      rules: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!association) {
    console.log('❌ No BMHA association found')
    return
  }

  console.log(`✅ Association: ${association.name}`)
  console.log(`   ID: ${association.id}`)
  console.log(`   Season: ${association.season}`)
  console.log(`   Rules Count: ${association.rules.length}\n`)

  console.log('📋 Rules:')
  association.rules.forEach((rule, index) => {
    console.log(`\n${index + 1}. ${rule.name}`)
    console.log(`   Type: ${rule.ruleType}`)
    console.log(`   Active: ${rule.isActive}`)
    console.log(`   Config:`, JSON.stringify(rule.config, null, 2))
    if (rule.approvalTiers) {
      console.log(`   Approval Tiers:`, JSON.stringify(rule.approvalTiers, null, 2))
    }
    if (rule.requiredExpenses) {
      console.log(`   Required Expenses:`, JSON.stringify(rule.requiredExpenses, null, 2))
    }
  })

  console.log('\n✅ Verification complete!')
}

main()
  .catch((e) => {
    console.error('❌ Verification failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
