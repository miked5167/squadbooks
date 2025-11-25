/**
 * Debug endpoint to get the current Clerk user ID
 * Navigate to /api/debug/clerk-user-id to see your user ID
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({
      error: 'Not authenticated',
      message: 'Please sign in first',
    })
  }

  return NextResponse.json({
    clerkUserId: userId,
    message: 'Copy this userId and use it in the seed command',
  })
}
