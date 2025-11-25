/**
 * User Association API Route
 *
 * GET /api/user/association
 * Returns the association ID for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Use Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  console.log('=== USER ASSOCIATION API ROUTE HIT ===')

  try {
    // Authenticate request
    const { userId } = await auth()
    console.log('Clerk userId:', userId)

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's association
    const { data: associationUser, error } = await supabase
      .from('association_users')
      .select('association_id')
      .eq('clerk_user_id', userId)
      .single()

    if (error || !associationUser) {
      console.error('Error fetching association:', error)
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      )
    }

    console.log('Found association ID:', associationUser.association_id)

    return NextResponse.json({
      associationId: associationUser.association_id,
    })
  } catch (error) {
    console.error('Error in user association route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
