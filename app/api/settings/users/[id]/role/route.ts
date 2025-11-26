/**
 * User Role Update API Route
 * PATCH: Update a user's role
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireTreasurerOnly, canManageUser } from '@/lib/auth/permissions'
import { updateUserRoleSchema } from '@/lib/validations/settings'
import { z } from 'zod'

/**
 * PATCH /api/settings/users/[id]/role
 * Update a user's role
 * Body: { role }
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
    const data = updateUserRoleSchema.parse(body)

    // Check if current user can manage this user
    const canManage = await canManageUser(id, currentUser)
    if (!canManage) {
      return NextResponse.json(
        { error: 'You do not have permission to manage this user' },
        { status: 403 }
      )
    }

    // Get the target user to verify they exist and are in the same team
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        teamId: true,
        role: true,
        name: true,
        email: true,
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

    // Prevent treasurer from changing their own role
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot change your own role' },
        { status: 400 }
      )
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: data.role },
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
      message: 'User role updated successfully',
      user: updatedUser,
    })
  } catch (error: any) {
    console.error('PATCH /api/settings/users/[id]/role error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update user role' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
