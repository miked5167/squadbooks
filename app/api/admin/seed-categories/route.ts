import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User or team not found' }, { status: 404 })
    }

    const teamId = user.teamId

    // Check if categories already exist
    const existingCategories = await prisma.category.findMany({
      where: { teamId },
    })

    if (existingCategories.length > 0) {
      return NextResponse.json({
        message: 'Categories already exist for this team',
        count: existingCategories.length,
      })
    }

    // Create all categories for the team
    const categories = await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        teamId,
      })),
    })

    logger.info(`Created ${categories.count} categories for team ${teamId}`)

    return NextResponse.json({
      success: true,
      message: `Successfully created ${categories.count} categories`,
      count: categories.count,
    })
  } catch (error) {
    logger.error('Seed categories error', error as Error)
    return NextResponse.json(
      { error: 'Failed to seed categories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
