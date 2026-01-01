import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/spend-intents/[spendIntentId]/issue-cheque
 * Record cheque issuance metadata and transition spend intent to OUTSTANDING status
 *
 * Payload:
 * - chequeNumber: string (required)
 * - signer1UserId: string | null (optional)
 * - signer1Name: string (optional)
 * - signer2UserId: string | null (optional)
 * - signer2Name: string (optional)
 * - issuedAt: Date (optional, defaults to now)
 * - chequeImageFileId: string | null (optional, required when amount >= threshold OR requiresManualApproval=true)
 * - note: string | null (optional)
 *
 * At least one of signer1UserId or signer1Name must be present
 * At least one of signer2UserId or signer2Name must be present
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spendIntentId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spendIntentId } = await params
    const body = await request.json()
    const {
      chequeNumber,
      signer1UserId,
      signer1Name,
      signer2UserId,
      signer2Name,
      issuedAt,
      chequeImageFileId,
      note,
    } = body

    // Validate required fields
    if (!chequeNumber) {
      return NextResponse.json({ error: 'chequeNumber is required' }, { status: 400 })
    }

    // Validate at least one signer1 identifier
    if (!signer1UserId && !signer1Name) {
      return NextResponse.json(
        { error: 'Either signer1UserId or signer1Name must be provided' },
        { status: 400 }
      )
    }

    // Validate at least one signer2 identifier
    if (!signer2UserId && !signer2Name) {
      return NextResponse.json(
        { error: 'Either signer2UserId or signer2Name must be provided' },
        { status: 400 }
      )
    }

    // Fetch spend intent
    const spendIntent = await prisma.spendIntent.findUnique({
      where: { id: spendIntentId },
      include: {
        chequeMetadata: true,
        team: {
          include: {
            teamSettings: true,
          },
        },
      },
    })

    if (!spendIntent) {
      return NextResponse.json({ error: 'Spend intent not found' }, { status: 404 })
    }

    // Verify user belongs to team
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        teamId: spendIntent.teamId,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this team' },
        { status: 403 }
      )
    }

    // Precondition 1: Payment method must be CHEQUE
    if (spendIntent.paymentMethod !== 'CHEQUE') {
      return NextResponse.json(
        { error: 'Payment method must be CHEQUE to issue a cheque' },
        { status: 400 }
      )
    }

    // Precondition 2: Status must be AUTHORIZED
    if (spendIntent.status !== 'AUTHORIZED') {
      return NextResponse.json(
        {
          error: 'Spend intent must be AUTHORIZED before issuing a cheque',
          currentStatus: spendIntent.status,
        },
        { status: 400 }
      )
    }

    // Precondition 3: Check if already issued (one-to-one constraint)
    if (spendIntent.chequeMetadata) {
      return NextResponse.json(
        { error: 'Cheque has already been issued for this spend intent' },
        { status: 409 }
      )
    }

    // Determine image requirement threshold
    const defaultThresholdCents = 50000 // $500
    const thresholdCents =
      spendIntent.team.teamSettings?.requireChequeImageThresholdCents ?? defaultThresholdCents

    // Check if image is required
    const imageRequired =
      spendIntent.amountCents >= thresholdCents || spendIntent.requiresManualApproval

    if (imageRequired && !chequeImageFileId) {
      return NextResponse.json(
        {
          error: 'Cheque image is required',
          reason:
            spendIntent.amountCents >= thresholdCents
              ? `Amount ($${(spendIntent.amountCents / 100).toFixed(2)}) exceeds threshold ($${(thresholdCents / 100).toFixed(2)})`
              : 'Spend intent requires manual approval',
        },
        { status: 400 }
      )
    }

    // Create cheque metadata and update spend intent status
    const result = await prisma.$transaction(async tx => {
      // Create cheque metadata
      const chequeMetadata = await tx.chequeMetadata.create({
        data: {
          spendIntentId,
          chequeNumber,
          signer1UserId: signer1UserId || null,
          signer1Name: signer1Name || null,
          signer2UserId: signer2UserId || null,
          signer2Name: signer2Name || null,
          issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
          chequeImageFileId: chequeImageFileId || null,
          note: note || null,
          attestedByUserId: user.id,
          attestedAt: new Date(),
        },
        include: {
          signer1: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          signer2: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          attestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Update spend intent status to OUTSTANDING
      const updatedSpendIntent = await tx.spendIntent.update({
        where: { id: spendIntentId },
        data: {
          status: 'OUTSTANDING',
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          vendor: true,
          chequeMetadata: {
            include: {
              signer1: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              signer2: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              attestedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      })

      return { spendIntent: updatedSpendIntent, chequeMetadata }
    })

    return NextResponse.json({
      ...result,
      nextStep: 'Awaiting bank settlement (Plaid) and/or reviewer',
    })
  } catch (error) {
    console.error('Error issuing cheque:', error)

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Cheque has already been issued for this spend intent' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
