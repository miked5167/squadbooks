import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Dev Mode: Load Demo Team
 *
 * Sets the dev_user_id cookie to a team treasurer user
 * This allows viewing the sample team dashboard with demo data
 */
export async function POST() {
  // Only allow in dev mode
  if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  try {
    // U13 AA Storm Treasurer user ID from demo data
    const teamUserId = 'demo_2025_2026_000002'

    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set('dev_user_id', teamUserId, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    })

    return NextResponse.json({
      success: true,
      message: 'Demo team loaded',
      redirectTo: '/dashboard',
    })
  } catch (error) {
    console.error('Load demo team error:', error)
    return NextResponse.json(
      { error: 'Failed to load demo team' },
      { status: 500 }
    )
  }
}
