import { auth as clerkAuth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'
const DEV_USER_ID = process.env.DEV_USER_ID || 'demo_2025_2026_000002'

/**
 * Server-side auth helper that bypasses Clerk in dev mode
 * Use this in Server Components and Server Actions
 */
export async function auth() {
  if (DEV_MODE) {
    // Check if a specific demo user is selected via cookie
    const cookieStore = await cookies()
    const selectedUserId = cookieStore.get('dev_user_id')?.value

    return {
      userId: selectedUserId || DEV_USER_ID,
      sessionId: 'dev-session',
      orgId: null,
    }
  }

  return await clerkAuth()
}

/**
 * Get current user details (for dev mode compatibility)
 */
export async function currentUser() {
  if (DEV_MODE) {
    const cookieStore = await cookies()
    const selectedUserId = cookieStore.get('dev_user_id')?.value
    const userId = selectedUserId || DEV_USER_ID

    // Return a mock user object compatible with Clerk's user structure
    return {
      id: userId,
      firstName: 'Demo',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'demo@squadbooks.com' }],
    }
  }

  return await clerkCurrentUser()
}
