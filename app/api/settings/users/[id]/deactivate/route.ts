/**
 * User Deactivation API Route
 * PATCH: Deactivate/reactivate a user (soft delete)
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireTreasurerOnly, canManageUser } from '@/lib/auth/permissions'
import { z } from 'zod'

const deactivateSchema = z.object({
  isActive: z.boolean(),
})

/**
 * PATCH /api/settings/users/[id]/deactivate
 * Deactivate or reactivate a user
 * Body: { isActive }
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const currentUser = await requireTreasurerOnly()
    const body = await request.json()

    // Validate input
    const data = deactivateSchema.parse(body)

    // Check if current user can manage this user
    const canManage = await canManageUser(id, currentUser)
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this user' },
        { status: 403 }
      )
    }

    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        teamId: true,
        role: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (targetUser.teamId !== currentUser.teamId) {
      return NextResponse.json(
        { error: 'Cannot manage users from another team' },
        { status: 403 }
      )
    }

    // Prevent treasurer from deactivating themselves
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      )
    }

    // Update the user's active status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: data.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: `User ${data.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('PATCH /api/settings/users/[id]/deactivate error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user status' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
