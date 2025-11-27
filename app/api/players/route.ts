import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      jerseyNumber,
      position,
      dateOfBirth,
      familyId,
      status,
    } = body

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    // Get user's team and role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user?.teamId) {
      return NextResponse.json({ error: 'User not associated with a team' }, { status: 400 })
    }

    // Only TREASURER and ASSISTANT_TREASURER can create players
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can create players' },
        { status: 403 }
      )
    }

    // If familyId is provided, verify it belongs to the same team
    if (familyId) {
      const family = await prisma.family.findFirst({
        where: {
          id: familyId,
          teamId: user.teamId,
        },
      })

      if (!family) {
        return NextResponse.json(
          { error: 'Family not found or does not belong to your team' },
          { status: 400 }
        )
      }
    }

    // Create player
    const player = await prisma.player.create({
      data: {
        teamId: user.teamId,
        firstName,
        lastName,
        jerseyNumber: jerseyNumber || null,
        position: position || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        familyId: familyId || null,
        status: status || 'ACTIVE',
      },
    })

    return NextResponse.json(player)
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
