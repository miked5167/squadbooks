import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Seed script for BMHA Association Rules
 *
 * This creates sample financial governance rules for the
 * Brampton Minor Hockey Association (BMHA) to demonstrate
 * the Association Rule Engine.
 *
 * Run with: npx tsx prisma/seed-bmha-rules.ts
 */

async function main() {
  console.log('🌱 Starting BMHA Rules seed...')

  // First, find or create a test association
  let association = await prisma.association.findFirst({
    where: { abbreviation: 'BMHA' }
  })

  if (!association) {
    console.log('📝 Creating BMHA test association...')
    association = await prisma.association.create({
      data: {
        name: 'Brampton Minor Hockey Association',
        abbreviation: 'BMHA',
        provinceState: 'Ontario',
        country: 'Canada',
        season: '2025-2026'
      }
    })
    console.log(`✅ Created association: ${association.name} (${association.id})`)
  } else {
    console.log(`✅ Found existing association: ${association.name} (${association.id})`)
  }

  // Delete existing rules for this association to avoid duplicates
  const deletedCount = await prisma.associationRule.deleteMany({
    where: { associationId: association.id }
  })
  console.log(`🗑️  Deleted ${deletedCount.count} existing rules`)

  // Create BMHA rules
  const rules = [
    {
      associationId: association.id,
      ruleType: 'MAX_BUDGET',
      name: 'Maximum Team Budget',
      description: 'Teams cannot exceed $20,000 total budget for the season',
      config: {
        maxAmount: 20000,
        currency: 'CAD'
      },
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'MAX_ASSESSMENT',
      name: 'Maximum Player Assessment',
      description: 'Player registration fees cannot exceed $3,500 per season',
      config: {
        maxAmount: 3500,
        currency: 'CAD'
      },
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'MAX_BUYOUT',
      name: 'Maximum Family Buyout',
      description: 'Maximum buyout per family is $1,000 for fundraising opt-out',
      config: {
        maxAmount: 1000,
        currency: 'CAD'
      },
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'ZERO_BALANCE',
      name: 'Zero Balance Requirement',
      description: 'Budget must balance to zero (total income must equal total expenses)',
      config: {
        required: true,
        toleranceAmount: 1.00 // Allow $1 rounding tolerance
      },
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'APPROVAL_TIERS',
      name: 'Transaction Approval Tiers',
      description: 'Approval requirements based on transaction amount',
      config: {
        description: 'Number of approvals required based on expense amount'
      },
      approvalTiers: [
        { min: 0, max: 100, approvals: 0, description: 'Under $100 - Auto-approved' },
        { min: 100, max: 500, approvals: 1, description: '$100-$500 - 1 approval required' },
        { min: 500, max: 999999, approvals: 2, description: 'Over $500 - 2 approvals required' }
      ],
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'REQUIRED_EXPENSES',
      name: 'Required Expense Categories',
      description: 'All team budgets must include these mandatory expense categories',
      config: {
        description: 'Ensures teams budget for essential hockey expenses'
      },
      requiredExpenses: [
        'Ice Time - Practice',
        'Ice Time - Games',
        'Referee Fees',
        'League Registration'
      ],
      isActive: true
    },
    {
      associationId: association.id,
      ruleType: 'SIGNING_AUTHORITY_COMPOSITION',
      name: 'GTHL Signing Authority Requirements',
      description: 'Teams must have 1 team official + 2 parent representatives as signing authorities',
      config: {
        description: 'Ensures proper financial oversight per GTHL guidelines'
      },
      signingAuthorityComposition: {
        min_team_officials: 1,
        min_parent_representatives: 2,
        min_total: 3,
        require_finance_experience: true,
        require_background_checks: false
      },
      isActive: true
    }
  ]

  console.log(`📋 Creating ${rules.length} BMHA rules...`)

  for (const rule of rules) {
    const created = await prisma.associationRule.create({
      data: rule
    })
    console.log(`   ✅ ${rule.name} (${created.id})`)
  }

  console.log('\n🎉 BMHA Rules seed completed!')
  console.log(`\n📊 Summary:`)
  console.log(`   Association: ${association.name}`)
  console.log(`   Rules created: ${rules.length}`)
  console.log(`\nThese rules will be enforced for all teams in the ${association.abbreviation} association.`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
