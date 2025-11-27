import { NextResponse } from 'next/server'
import { auth, currentUser } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

const DEFAULT_CATEGORIES = [
  // Ice Time & Facilities (Heading 1)
  { name: 'Ice Time - Practice', heading: 'Ice Time & Facilities', color: '#0EA5E9', sortOrder: 1 },
  { name: 'Ice Time - Games', heading: 'Ice Time & Facilities', color: '#0EA5E9', sortOrder: 2 },
  { name: 'Facility Rentals', heading: 'Ice Time & Facilities', color: '#0EA5E9', sortOrder: 3 },
  { name: 'Locker Room Fees', heading: 'Ice Time & Facilities', color: '#0EA5E9', sortOrder: 4 },

  // Equipment & Jerseys (Heading 2)
  { name: 'Team Jerseys', heading: 'Equipment & Jerseys', color: '#10B981', sortOrder: 5 },
  { name: 'Practice Jerseys', heading: 'Equipment & Jerseys', color: '#10B981', sortOrder: 6 },
  { name: 'Team Equipment', heading: 'Equipment & Jerseys', color: '#10B981', sortOrder: 7 },
  { name: 'Goalie Equipment', heading: 'Equipment & Jerseys', color: '#10B981', sortOrder: 8 },

  // Coaching & Officials (Heading 3)
  { name: 'Head Coach Fee', heading: 'Coaching & Officials', color: '#F59E0B', sortOrder: 9 },
  { name: 'Assistant Coach Fees', heading: 'Coaching & Officials', color: '#F59E0B', sortOrder: 10 },
  { name: 'Referee Fees', heading: 'Coaching & Officials', color: '#F59E0B', sortOrder: 11 },
  { name: 'Coaching Certifications', heading: 'Coaching & Officials', color: '#F59E0B', sortOrder: 12 },

  // Travel & Tournaments (Heading 4)
  { name: 'Tournament Registration', heading: 'Travel & Tournaments', color: '#8B5CF6', sortOrder: 13 },
  { name: 'Hotel Accommodations', heading: 'Travel & Tournaments', color: '#8B5CF6', sortOrder: 14 },
  { name: 'Team Meals', heading: 'Travel & Tournaments', color: '#8B5CF6', sortOrder: 15 },
  { name: 'Transportation', heading: 'Travel & Tournaments', color: '#8B5CF6', sortOrder: 16 },

  // League & Registration (Heading 5)
  { name: 'League Registration', heading: 'League & Registration', color: '#EC4899', sortOrder: 17 },
  { name: 'USA Hockey Registration', heading: 'League & Registration', color: '#EC4899', sortOrder: 18 },
  { name: 'Tournament Fees', heading: 'League & Registration', color: '#EC4899', sortOrder: 19 },
  { name: 'Insurance', heading: 'League & Registration', color: '#EC4899', sortOrder: 20 },

  // Team Operations (Heading 6)
  { name: 'Team Photos', heading: 'Team Operations', color: '#6366F1', sortOrder: 21 },
  { name: 'Team Party/Events', heading: 'Team Operations', color: '#6366F1', sortOrder: 22 },
  { name: 'Awards & Trophies', heading: 'Team Operations', color: '#6366F1', sortOrder: 23 },
  { name: 'Office Supplies', heading: 'Team Operations', color: '#6366F1', sortOrder: 24 },

  // Fundraising & Income (Heading 7)
  { name: 'Registration Fees', heading: 'Fundraising & Income', color: '#14B8A6', sortOrder: 25 },
  { name: 'Fundraising Events', heading: 'Fundraising & Income', color: '#14B8A6', sortOrder: 26 },
  { name: 'Donations', heading: 'Fundraising & Income', color: '#14B8A6', sortOrder: 27 },
  { name: 'Sponsorships', heading: 'Fundraising & Income', color: '#14B8A6', sortOrder: 28 },
]

export async function POST() {
  try {
    // Authenticate user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user exists in database
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    })

    let team

    // If user doesn't exist or doesn't have a team, create them
    if (!dbUser || !dbUser.teamId) {
      console.log('Creating team and user...')

      // Create team
      team = await prisma.team.create({
        data: {
          name: `${clerkUser.firstName}'s Team` || 'My Team',
          level: 'U12',
          season: '2025-2026',
          budgetTotal: 10000.00, // Default $10,000 budget
        },
      })

      console.log(`✅ Created team: ${team.name} (${team.id})`)

      // Create or update user
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            clerkId: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'User',
            role: 'TREASURER',
            teamId: team.id,
          },
        })
        console.log(`✅ Created user: ${dbUser.name} (${dbUser.id})`)
      } else {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { teamId: team.id },
        })
        console.log(`✅ Updated user with team: ${dbUser.name}`)
      }
    } else {
      team = dbUser.team!
      console.log(`✅ User already has team: ${team.name}`)
    }

    // Check if categories already exist
    const existingCategories = await prisma.category.findMany({
      where: { teamId: team.id },
    })

    if (existingCategories.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Setup already complete',
        team: {
          id: team.id,
          name: team.name,
        },
        categoriesCount: existingCategories.length,
      })
    }

    // Create all categories for the team
    const categories = await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        teamId: team.id,
      })),
    })

    console.log(`✅ Created ${categories.count} categories for team ${team.id}`)

    return NextResponse.json({
      success: true,
      message: `Successfully set up team with ${categories.count} categories`,
      team: {
        id: team.id,
        name: team.name,
      },
      categoriesCount: categories.count,
    })
  } catch (error) {
    console.error('Setup team error:', error)
    return NextResponse.json(
      { error: 'Failed to setup team', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
