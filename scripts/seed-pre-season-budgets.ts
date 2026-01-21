import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🏒 Seeding Pre-Season Budget data...')

  // Clean up existing pre-season budget data
  console.log('🗑️  Cleaning up existing pre-season budget data...')
  await prisma.parentInterest.deleteMany()
  await prisma.preSeasonAllocation.deleteMany()
  await prisma.preSeasonBudget.deleteMany()
  console.log('✅ Cleanup complete')

  // Get or create an association
  let association = await prisma.association.findFirst()
  if (!association) {
    association = await prisma.association.create({
      data: {
        name: 'Metro Hockey Association',
        slug: 'metro-hockey',
        currency: 'CAD',
      },
    })
    console.log('✅ Created association:', association.name)
  }

  // Get or create association admin user
  let associationAdmin = await prisma.associationUser.findFirst({
    where: { role: 'association_admin' },
  })

  if (!associationAdmin) {
    // Create a demo association admin
    associationAdmin = await prisma.associationUser.create({
      data: {
        clerkUserId: 'user_demo_association_admin',
        email: 'admin@metrohockey.com',
        name: 'Sarah Johnson',
        role: 'association_admin',
        association: {
          connect: { id: association.id },
        },
      },
    })
    console.log('✅ Created association admin user')
  }

  // Use demo coach clerk ID or get from environment
  const coachClerkId = process.env.SEED_CLERK_USER_ID || 'user_demo_coach_preseason'

  console.log('📝 Using Clerk ID:', coachClerkId)

  // Get categories for allocations
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: 'asc' },
  })

  if (categories.length === 0) {
    console.log('❌ No categories found. Please seed categories first.')
    return
  }

  console.log(`📊 Found ${categories.length} categories`)

  // Helper function to distribute budget across main categories only
  function createAllocations(totalBudget: number) {
    const allocations: { categoryId: string; allocated: number }[] = []

    // Find main categories for realistic hockey budget distribution
    const categoryMap = new Map<string, any>()
    categories.forEach((cat) => {
      categoryMap.set(cat.name.toLowerCase(), cat)
    })

    // Realistic distribution for main categories
    const mainCategories = [
      { name: 'ice time', percentage: 0.35 },
      { name: 'tournament fees', percentage: 0.15 },
      { name: 'league fees', percentage: 0.10 },
      { name: 'uniforms', percentage: 0.12 },
      { name: 'equipment', percentage: 0.08 },
      { name: 'coaching', percentage: 0.10 },
      { name: 'team events', percentage: 0.05 },
      { name: 'other', percentage: 0.05 },
    ]

    let remaining = totalBudget

    mainCategories.forEach((item, index) => {
      // Find matching category (or first category as fallback)
      let category = categoryMap.get(item.name)
      if (!category) {
        // Try to find a category that includes this word
        for (const cat of categories) {
          if (cat.name.toLowerCase().includes(item.name.split(' ')[0])) {
            category = cat
            break
          }
        }
      }
      if (!category) {
        category = categories[index % categories.length] // Fallback
      }

      let amount: number
      if (index === mainCategories.length - 1) {
        // Last category gets the remainder
        amount = Math.round(remaining * 100) / 100
      } else {
        amount = Math.round(totalBudget * item.percentage * 100) / 100
        remaining -= amount
      }

      allocations.push({
        categoryId: category.id,
        allocated: amount,
      })
    })

    return allocations
  }

  // 1. DRAFT Budget - Coach is still working on it
  console.log('\n📝 Creating DRAFT budget...')
  const draftBudget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Thunder U15 AA',
      proposedSeason: '2025-2026',
      teamType: 'Competitive',
      ageDivision: 'U15',
      competitiveLevel: 'AA',
      totalBudget: 28000,
      projectedPlayers: 16,
      perPlayerCost: 1750,
      status: 'DRAFT',
      publicSlug: `draft-${nanoid(10)}`,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      allocations: {
        create: createAllocations(28000),
      },
    },
  })
  console.log('✅ Created DRAFT budget:', draftBudget.proposedTeamName)

  // 2. SUBMITTED Budget - Waiting for association approval
  console.log('\n📤 Creating SUBMITTED budget...')
  const submittedBudget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Lightning U13 A',
      proposedSeason: '2025-2026',
      teamType: 'Competitive',
      ageDivision: 'U13',
      competitiveLevel: 'A',
      totalBudget: 22000,
      projectedPlayers: 15,
      perPlayerCost: 1467,
      status: 'SUBMITTED',
      publicSlug: `submitted-${nanoid(10)}`,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      allocations: {
        create: createAllocations(22000),
      },
    },
  })
  console.log('✅ Created SUBMITTED budget:', submittedBudget.proposedTeamName)

  // 3. APPROVED Budget - Ready to share with parents (with some interests)
  console.log('\n✅ Creating APPROVED budget...')
  const approvedBudget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Storm U11 Select',
      proposedSeason: '2025-2026',
      teamType: 'Recreational',
      ageDivision: 'U11',
      competitiveLevel: 'House League',
      totalBudget: 15000,
      projectedPlayers: 14,
      perPlayerCost: 1071,
      status: 'APPROVED',
      publicSlug: 'storm-u11-select-2025-abc123xyz',
      viewCount: 47,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      associationApprovedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      associationNotes: 'Budget looks great! Approved for the upcoming season.',
      allocations: {
        create: createAllocations(15000),
      },
      parentInterests: {
        create: [
          {
            parentName: 'Jennifer Smith',
            email: 'jennifer.smith@example.com',
            phone: '(555) 123-4567',
            playerName: 'Emma Smith',
            playerAge: 10,
            comments: 'Emma is super excited to play! She has 2 years of house league experience.',
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'David Chen',
            email: 'david.chen@example.com',
            phone: '(555) 234-5678',
            playerName: 'Lucas Chen',
            playerAge: 11,
            comments: 'Looking forward to a great season. Is there carpooling available?',
            ipAddress: '192.168.1.101',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Maria Garcia',
            email: 'maria.garcia@example.com',
            phone: '(555) 345-6789',
            playerName: 'Sofia Garcia',
            playerAge: 10,
            comments: null,
            ipAddress: '192.168.1.102',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Robert Wilson',
            email: 'robert.wilson@example.com',
            phone: '(555) 456-7890',
            playerName: 'Ethan Wilson',
            playerAge: 11,
            comments: 'Ethan is moving up from U9. Can we get a practice schedule estimate?',
            ipAddress: '192.168.1.103',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Lisa Anderson',
            email: 'lisa.anderson@example.com',
            phone: null,
            playerName: 'Olivia Anderson',
            playerAge: 10,
            comments: 'First year playing organized hockey. Very excited!',
            ipAddress: '192.168.1.104',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'James Park',
            email: 'james.park@example.com',
            phone: '(555) 567-8901',
            playerName: 'Noah Park',
            playerAge: 11,
            comments: null,
            ipAddress: '192.168.1.105',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Sarah Johnson',
            email: 'sarah.johnson@example.com',
            phone: '(555) 678-9012',
            playerName: 'Ava Johnson',
            playerAge: 10,
            comments: 'Are there any girls on the team? Ava would love to have some teammates!',
            ipAddress: '192.168.1.106',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Michael Brown',
            email: 'michael.brown@example.com',
            phone: '(555) 789-0123',
            playerName: 'Liam Brown',
            playerAge: 11,
            comments: 'Liam has been practicing skating all summer. Ready to go!',
            ipAddress: '192.168.1.107',
            userAgent: 'Mozilla/5.0',
          },
        ],
      },
    },
  })
  console.log('✅ Created APPROVED budget:', approvedBudget.proposedTeamName)
  console.log(`   📧 Added ${await prisma.parentInterest.count({ where: { preSeasonBudgetId: approvedBudget.id } })} parent interests`)

  // 4. APPROVED Budget - High interest, ready to activate
  console.log('\n✅ Creating APPROVED budget (high interest)...')
  const highInterestBudget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Hawks U9 Development',
      proposedSeason: '2025-2026',
      teamType: 'Recreational',
      ageDivision: 'U9',
      competitiveLevel: 'Development',
      totalBudget: 12000,
      projectedPlayers: 12,
      perPlayerCost: 1000,
      status: 'APPROVED',
      publicSlug: 'hawks-u9-dev-2025-xyz789abc',
      viewCount: 68,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      associationApprovedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      associationNotes: 'Excellent budget planning. Approved!',
      allocations: {
        create: createAllocations(12000),
      },
      parentInterests: {
        create: [
          {
            parentName: 'Amanda Taylor',
            email: 'amanda.taylor@example.com',
            phone: '(555) 111-2222',
            playerName: 'Mason Taylor',
            playerAge: 8,
            ipAddress: '192.168.1.110',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Kevin Martinez',
            email: 'kevin.martinez@example.com',
            phone: '(555) 222-3333',
            playerName: 'Isabella Martinez',
            playerAge: 9,
            ipAddress: '192.168.1.111',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Rachel White',
            email: 'rachel.white@example.com',
            phone: '(555) 333-4444',
            playerName: 'Jacob White',
            playerAge: 8,
            ipAddress: '192.168.1.112',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Thomas Lee',
            email: 'thomas.lee@example.com',
            phone: '(555) 444-5555',
            playerName: 'Mia Lee',
            playerAge: 9,
            ipAddress: '192.168.1.113',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Emily Davis',
            email: 'emily.davis@example.com',
            phone: '(555) 555-6666',
            playerName: 'William Davis',
            playerAge: 8,
            ipAddress: '192.168.1.114',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Daniel Kim',
            email: 'daniel.kim@example.com',
            phone: '(555) 666-7777',
            playerName: 'Charlotte Kim',
            playerAge: 9,
            ipAddress: '192.168.1.115',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Jessica Miller',
            email: 'jessica.miller@example.com',
            phone: '(555) 777-8888',
            playerName: 'Benjamin Miller',
            playerAge: 8,
            ipAddress: '192.168.1.116',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Christopher Lopez',
            email: 'chris.lopez@example.com',
            phone: '(555) 888-9999',
            playerName: 'Amelia Lopez',
            playerAge: 9,
            ipAddress: '192.168.1.117',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Michelle Wang',
            email: 'michelle.wang@example.com',
            phone: '(555) 999-0000',
            playerName: 'Alexander Wang',
            playerAge: 8,
            ipAddress: '192.168.1.118',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Brian Scott',
            email: 'brian.scott@example.com',
            phone: '(555) 000-1111',
            playerName: 'Harper Scott',
            playerAge: 9,
            comments: 'Harper has been waiting all year for this!',
            ipAddress: '192.168.1.119',
            userAgent: 'Mozilla/5.0',
          },
        ],
      },
    },
  })
  console.log('✅ Created APPROVED budget (high interest):', highInterestBudget.proposedTeamName)
  console.log(`   📧 Added ${await prisma.parentInterest.count({ where: { preSeasonBudgetId: highInterestBudget.id } })} parent interests`)

  // 5. REJECTED Budget - Needs revision
  console.log('\n❌ Creating REJECTED budget...')
  const rejectedBudget = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Blaze U17 AAA',
      proposedSeason: '2025-2026',
      teamType: 'Elite',
      ageDivision: 'U17',
      competitiveLevel: 'AAA',
      totalBudget: 45000,
      projectedPlayers: 18,
      perPlayerCost: 2500,
      status: 'REJECTED',
      publicSlug: `rejected-${nanoid(10)}`,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      associationNotes:
        'The travel budget allocation seems too high at $12,000. Please revise to be more in line with previous AAA teams (approximately $8,000-$9,000). Also, the ice time allocation should be increased to ensure adequate practice time.',
      allocations: {
        create: createAllocations(45000),
      },
    },
  })
  console.log('✅ Created REJECTED budget:', rejectedBudget.proposedTeamName)

  // 6. Another APPROVED Budget - Different age group
  console.log('\n✅ Creating another APPROVED budget...')
  const approvedBudget2 = await prisma.preSeasonBudget.create({
    data: {
      proposedTeamName: 'Wolves U14 BB',
      proposedSeason: '2025-2026',
      teamType: 'Competitive',
      ageDivision: 'U14',
      competitiveLevel: 'BB',
      totalBudget: 24500,
      projectedPlayers: 16,
      perPlayerCost: 1531,
      status: 'APPROVED',
      publicSlug: 'wolves-u14-bb-2025-def456ghi',
      viewCount: 32,
      createdByClerkId: coachClerkId,
      association: {
        connect: { id: association.id },
      },
      associationApprovedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      associationNotes: 'Well structured budget. Approved.',
      allocations: {
        create: createAllocations(24500),
      },
      parentInterests: {
        create: [
          {
            parentName: 'Patricia Green',
            email: 'patricia.green@example.com',
            phone: '(555) 121-2323',
            playerName: 'Ryan Green',
            playerAge: 13,
            comments: 'Ryan is coming from U13 A team. Excited for the challenge!',
            ipAddress: '192.168.1.120',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Steven Hall',
            email: 'steven.hall@example.com',
            phone: '(555) 232-3434',
            playerName: 'Grace Hall',
            playerAge: 14,
            ipAddress: '192.168.1.121',
            userAgent: 'Mozilla/5.0',
          },
          {
            parentName: 'Nancy Rivera',
            email: 'nancy.rivera@example.com',
            phone: '(555) 343-4545',
            playerName: 'Tyler Rivera',
            playerAge: 13,
            comments: "What's the tournament schedule looking like?",
            ipAddress: '192.168.1.122',
            userAgent: 'Mozilla/5.0',
          },
        ],
      },
    },
  })
  console.log('✅ Created APPROVED budget:', approvedBudget2.proposedTeamName)
  console.log(`   📧 Added ${await prisma.parentInterest.count({ where: { preSeasonBudgetId: approvedBudget2.id } })} parent interests`)

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('✅ Pre-Season Budget seeding complete!')
  console.log('='.repeat(60))

  const budgetCounts = await prisma.preSeasonBudget.groupBy({
    by: ['status'],
    _count: true,
  })

  console.log('\n📊 Budget Summary:')
  budgetCounts.forEach((count) => {
    console.log(`   ${count.status}: ${count._count}`)
  })

  const totalInterests = await prisma.parentInterest.count()
  console.log(`\n📧 Total Parent Interests: ${totalInterests}`)

  console.log('\n🔗 Public Links (APPROVED budgets):')
  const approvedBudgets = await prisma.preSeasonBudget.findMany({
    where: { status: 'APPROVED' },
    select: { proposedTeamName: true, publicSlug: true },
  })
  approvedBudgets.forEach((budget) => {
    console.log(`   ${budget.proposedTeamName}:`)
    console.log(`   → http://localhost:3000/public-budget/${budget.publicSlug}`)
  })

  console.log('\n✨ You can now test the Pre-Season Budget Builder!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
