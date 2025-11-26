/**
 * Notification Settings API Route
 * GET: Get user's notification preferences
 * PUT: Update user's notification preferences
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/permissions'
import { notificationSettingsSchema } from '@/lib/validations/settings'
import { z } from 'zod'

/**
 * GET /api/settings/notifications
 * Get current user's notification preferences
 */
export async function GET() {
  try {
    const user = await getCurrentUser()

    // Find or create notification settings
    let settings = await prisma.notificationSettings.findUnique({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: user.teamId,
        },
      },
    })

    if (!settings) {
      // Create default settings
      settings = await prisma.notificationSettings.create({
        data: {
          userId: user.id,
          teamId: user.teamId,
          newExpenseSubmitted: true,
          approvalRequired: true,
          budgetThresholdWarning: true,
          missingReceiptReminder: true,
          monthlySummary: false,
        },
      })
    }

    return NextResponse.json({ settings })
  } catch (error: any) {
    console.error('GET /api/settings/notifications error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notification settings' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}

/**
 * PUT /api/settings/notifications
 * Update current user's notification preferences
 * Body: { newExpenseSubmitted?, approvalRequired?, budgetThresholdWarning?, missingReceiptReminder?, monthlySummary? }
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()

    // Validate input
    const data = notificationSettingsSchema.parse(body)

    // Upsert notification settings
    const settings = await prisma.notificationSettings.upsert({
      where: {
        userId_teamId: {
          userId: user.id,
          teamId: user.teamId,
        },
      },
      create: {
        userId: user.id,
        teamId: user.teamId,
        ...data,
      },
      update: data,
    })

    return NextResponse.json({
      message: 'Notification settings updated successfully',
      settings,
    })
  } catch (error: any) {
    console.error('PUT /api/settings/notifications error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update notification settings' },
      { status: error.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
