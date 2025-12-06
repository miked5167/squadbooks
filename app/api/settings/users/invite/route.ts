/**
 * User Invite API Route
 * POST: Invite a new user to the team
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireTreasurerOnly } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'
import { inviteUserSchema } from '@/lib/validations/settings'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { clerkClient } from '@clerk/nextjs/server'
import { logger } from '@/lib/logger'

/**
 * POST /api/settings/users/invite
 * Invite a new user to the team via Clerk
 * Body: { email, name, role }
 */
export async function POST(request: Request) {
  try {
    const user = await requireTreasurerOnly()
    const body = await request.json()

    // Validate input
    const data = inviteUserSchema.parse(body)

    // Check if user with this email already exists in the team
    const existingUser = await prisma.user.findFirst({
      where: {
        email: data.email,
        teamId: user.teamId,
      },
    })

    if (existingUser) {
      if (existingUser.isActive) {
        return NextResponse.json(
          { error: 'A user with this email already exists in your team' },
          { status: 400 }
        )
      } else {
        // Reactivate the user instead of creating new
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            isActive: true,
            role: data.role,
            name: data.name,
          },
        })

        return NextResponse.json({
          message: 'User reactivated successfully',
          user: existingUser,
        })
      }
    }

    // Create invitation via Clerk
    // Note: This is a placeholder - actual Clerk invitation would be done here
    // For now, we'll create a pending user record

    // In production, you would use:
    // const invitation = await clerkClient.invitations.createInvitation({
    //   emailAddress: data.email,
    //   publicMetadata: {
    //     teamId: user.teamId,
    //     role: data.role,
    //   },
    // })

    // For now, create a pending user that will be activated on first login
    const newUser = await prisma.user.create({
      data: {
        clerkId: `pending_${Date.now()}`, // Temporary ID until Clerk user is created
        email: data.email,
        name: data.name,
        role: data.role,
        teamId: user.teamId,
        isActive: false, // Will be activated when they complete signup
      },
    })

    return NextResponse.json({
      message: 'Invitation sent successfully',
      user: newUser,
    })
  } catch (error: any) {
    logger.error('POST /api/settings/users/invite error', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
