import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      familyName,
      primaryName,
      primaryEmail,
      primaryPhone,
      secondaryName,
      secondaryEmail,
      secondaryPhone,
    } = body

    // Validate required fields
    if (!familyName || !primaryEmail) {
      return NextResponse.json(
        { error: 'Family name and primary email are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(primaryEmail)) {
      return NextResponse.json({ error: 'Invalid primary email format' }, { status: 400 })
    }
    if (secondaryEmail && !emailRegex.test(secondaryEmail)) {
      return NextResponse.json({ error: 'Invalid secondary email format' }, { status: 400 })
    }

    // Get user's team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true },
    })

    if (!user?.teamId) {
      return NextResponse.json({ error: 'User not associated with a team' }, { status: 400 })
    }

    // Verify family belongs to user's team
    const existingFamily = await prisma.family.findFirst({
      where: {
        id,
        teamId: user.teamId,
      },
    })

    if (!existingFamily) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Update family
    const updatedFamily = await prisma.family.update({
      where: { id },
      data: {
        familyName,
        primaryName: primaryName || null,
        primaryEmail,
        primaryPhone: primaryPhone || null,
        secondaryName: secondaryName || null,
        secondaryEmail: secondaryEmail || null,
        secondaryPhone: secondaryPhone || null,
      },
    })

    return NextResponse.json(updatedFamily)
  } catch (error) {
    console.error('Error updating family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
