import { NextResponse } from 'next/server'
import { getCurrentUser, getAccessibleTeams } from '@/lib/permissions/server-permissions'

/**
 * GET /api/teams/accessible
 * Returns all teams accessible to the current user (association users see all teams in their association)
 */
export async function GET() {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get accessible teams (handles both team users and association users)
    const teams = await getAccessibleTeams()

    return NextResponse.json({ teams })
  } catch (error) {
    console.error('Error fetching accessible teams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    )
  }
}
