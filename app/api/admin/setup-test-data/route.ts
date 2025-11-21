import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DEFAULT_CATEGORIES } from '@/prisma/seed'

/**
 * POST /api/admin/setup-test-data
 * Creates test team, user, and categories for development/testing
 */
export async function POST() {
  try {
    console.log('🌱 Setting up test data...')

    // Create test team
    const team = await prisma.team.create({
      data: {
        name: 'Springfield Ice Hawks',
        level: 'U13',
        season: '2024-2025',
        budgetTotal: 10000.00,
      },
    })
    console.log('✅ Team created:', team.name)

    // Create test users
    const treasurer = await prisma.user.create({
      data: {
        clerkId: 'test_treasurer_001',
        email: 'treasurer@icehawks.com',
        name: 'Jane Treasurer',
        role: 'TREASURER',
        teamId: team.id,
      },
    })
    console.log('✅ Treasurer created:', treasurer.email)

    const president = await prisma.user.create({
      data: {
        clerkId: 'test_president_001',
        email: 'president@icehawks.com',
        name: 'John President',
        role: 'PRESIDENT',
        teamId: team.id,
      },
    })
    console.log('✅ President created:', president.email)

    const parent = await prisma.user.create({
      data: {
        clerkId: 'test_parent_001',
        email: 'parent@icehawks.com',
        name: 'Sarah Parent',
        role: 'PARENT',
        teamId: team.id,
      },
    })
    console.log('✅ Parent created:', parent.email)

    // Create categories
    const categories = await Promise.all(
      DEFAULT_CATEGORIES.map((cat) =>
        prisma.category.create({
          data: {
            teamId: team.id,
            name: cat.name,
            heading: cat.heading,
            color: cat.color,
            sortOrder: cat.sortOrder,
            isDefault: true,
          },
        })
      )
    )
    console.log(`✅ ${categories.length} categories created`)

    // Create budget allocations for key categories
    const budgetAllocations = await Promise.all([
      // Ice Time & Facilities - $3500
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[0].id, // Ice Time - Practice
          season: '2024-2025',
          allocated: 2000.00,
        },
      }),
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[1].id, // Ice Time - Games
          season: '2024-2025',
          allocated: 1500.00,
        },
      }),
      // Equipment - $2000
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[4].id, // Team Jerseys
          season: '2024-2025',
          allocated: 1200.00,
        },
      }),
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[6].id, // Team Equipment
          season: '2024-2025',
          allocated: 800.00,
        },
      }),
      // Coaching - $1500
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[8].id, // Head Coach Fee
          season: '2024-2025',
          allocated: 1000.00,
        },
      }),
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[10].id, // Referee Fees
          season: '2024-2025',
          allocated: 500.00,
        },
      }),
      // Tournaments - $2000
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[12].id, // Tournament Registration
          season: '2024-2025',
          allocated: 1500.00,
        },
      }),
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[14].id, // Team Meals
          season: '2024-2025',
          allocated: 500.00,
        },
      }),
      // League Registration - $1000
      prisma.budgetAllocation.create({
        data: {
          teamId: team.id,
          categoryId: categories[16].id, // League Registration
          season: '2024-2025',
          allocated: 1000.00,
        },
      }),
    ])
    console.log(`✅ ${budgetAllocations.length} budget allocations created`)

    // Create a few sample transactions
    const sampleTransactions = await Promise.all([
      // Income - Registration fees
      prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'INCOME',
          status: 'APPROVED',
          amount: 5000.00,
          categoryId: categories[24].id, // Registration Fees
          vendor: 'Player Registration',
          description: 'Season registration fees from 10 players',
          transactionDate: new Date('2024-09-01'),
          createdBy: treasurer.id,
        },
      }),
      // Expense - Ice time (auto-approved, under $200)
      prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'EXPENSE',
          status: 'APPROVED',
          amount: 180.00,
          categoryId: categories[0].id, // Ice Time - Practice
          vendor: 'Springfield Ice Arena',
          description: 'Practice ice - September week 1',
          transactionDate: new Date('2024-09-05'),
          createdBy: treasurer.id,
        },
      }),
      // Expense - Jerseys (pending approval, over $200)
      prisma.transaction.create({
        data: {
          teamId: team.id,
          type: 'EXPENSE',
          status: 'PENDING',
          amount: 850.00,
          categoryId: categories[4].id, // Team Jerseys
          vendor: 'Hockey Equipment Pro',
          description: 'Team jerseys - home and away sets',
          transactionDate: new Date('2024-09-10'),
          createdBy: treasurer.id,
        },
      }),
    ])
    console.log(`✅ ${sampleTransactions.length} sample transactions created`)

    // Create approval for pending transaction
    await prisma.approval.create({
      data: {
        transactionId: sampleTransactions[2].id,
        approvedBy: president.id,
        createdBy: treasurer.id,
        teamId: team.id,
        status: 'PENDING',
      },
    })
    console.log('✅ Approval created for pending transaction')

    return NextResponse.json(
      {
        message: 'Test data created successfully!',
        data: {
          team: {
            id: team.id,
            name: team.name,
            level: team.level,
            season: team.season,
            budgetTotal: team.budgetTotal,
          },
          users: {
            treasurer: {
              id: treasurer.id,
              email: treasurer.email,
              clerkId: treasurer.clerkId,
              role: treasurer.role,
            },
            president: {
              id: president.id,
              email: president.email,
              clerkId: president.clerkId,
              role: president.role,
            },
            parent: {
              id: parent.id,
              email: parent.email,
              clerkId: parent.clerkId,
              role: parent.role,
            },
          },
          categories: categories.length,
          budgetAllocations: budgetAllocations.length,
          transactions: sampleTransactions.length,
        },
        instructions: {
          signIn: 'To test, update your Clerk user ID to match one of these test users',
          treasurerClerkId: 'test_treasurer_001',
          presidentClerkId: 'test_president_001',
          parentClerkId: 'test_parent_001',
          note: 'You can manually update the clerkId in the database to match your actual Clerk user ID',
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating test data:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message, details: error.stack },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Failed to create test data' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/setup-test-data
 * Deletes all test data (teams with "Springfield Ice Hawks" name)
 */
export async function DELETE() {
  try {
    console.log('🗑️  Deleting test data...')

    // Find test teams
    const testTeams = await prisma.team.findMany({
      where: {
        name: 'Springfield Ice Hawks',
      },
    })

    if (testTeams.length === 0) {
      return NextResponse.json(
        { message: 'No test data found to delete' },
        { status: 200 }
      )
    }

    // Delete all test teams (cascade will handle related data)
    await prisma.team.deleteMany({
      where: {
        name: 'Springfield Ice Hawks',
      },
    })

    console.log(`✅ Deleted ${testTeams.length} test team(s)`)

    return NextResponse.json(
      {
        message: 'Test data deleted successfully!',
        deletedTeams: testTeams.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting test data:', error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to delete test data' }, { status: 500 })
  }
}
