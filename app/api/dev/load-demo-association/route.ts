import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Dev Mode: Load Demo Association
 *
 * Sets the dev_user_id cookie to the association admin user
 * This allows viewing the sample association dashboard with demo data
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
    // Association admin user ID from demo data
    const associationUserId = 'demo_2025_2026_000001'

    // Set the cookie
    const cookieStore = await cookies()
    cookieStore.set('dev_user_id', associationUserId, {
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
    })

    return NextResponse.json({
      success: true,
      message: 'Demo association loaded',
      redirectTo: '/association',
    })
  } catch (error) {
    console.error('Load demo association error:', error)
    return NextResponse.json(
      { error: 'Failed to load demo association' },
      { status: 500 }
    )
  }
}
