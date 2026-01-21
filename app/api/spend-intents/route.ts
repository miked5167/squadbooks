import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import {
  determineAuthorizationRequirements,
  validateAuthorizationInput,
} from '@/lib/validation/gthl-authorization'
import type { PaymentMethod } from '@prisma/client'

/**
 * POST /api/spend-intents
 * Create a new spend intent with authorization determination
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const {
      teamId,
      amountCents,
      paymentMethod,
      vendorId,
      vendorName,
      budgetLineItemId,
      payeeUserId,
    } = body

    if (!teamId) {
      return NextResponse.json({ error: 'teamId is required' }, { status: 400 })
    }

    if (amountCents === undefined || amountCents === null) {
      return NextResponse.json({ error: 'amountCents is required' }, { status: 400 })
    }

    if (!paymentMethod) {
      return NextResponse.json({ error: 'paymentMethod is required' }, { status: 400 })
    }

    if (!vendorId && !vendorName) {
      return NextResponse.json(
        { error: 'Either vendorId or vendorName is required' },
        { status: 400 }
      )
    }

    // Verify user belongs to team
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        teamId,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this team' },
        { status: 403 }
      )
    }

    // Determine if vendor is known AND whitelisted
    let vendorIsKnown = false
    if (vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { isWhitelisted: true },
      })
      // Vendor is known only if it exists AND is whitelisted
      vendorIsKnown = vendor ? vendor.isWhitelisted : false
    }

    // Determine if budget is approved
    // Simplified: Check if there's a budget for this team with APPROVED status
    let budgetApproved = false
    if (budgetLineItemId) {
      // Check if the budget line item exists and its budget is approved
      const budgetEnvelope = await prisma.budgetEnvelope.findFirst({
        where: {
          id: budgetLineItemId,
          teamId,
        },
        include: {
          budget: true,
        },
      })

      if (budgetEnvelope && budgetEnvelope.budget.status === 'APPROVED') {
        budgetApproved = true
      }
    }

    // Determine if treasurer is payee
    // Check if the current user is treasurer and if payeeUserId matches their user ID
    const treasurerIsPayee = user.role === 'TREASURER' && payeeUserId === user.id

    // Call authorization rules engine
    const authResult = determineAuthorizationRequirements({
      amountCents,
      paymentMethod: paymentMethod as PaymentMethod,
      budgetLineItemId: budgetLineItemId || null,
      budgetApproved,
      vendorIsKnown,
      treasurerIsPayee,
    })

    // Determine initial status
    const status =
      authResult.authorizationType === 'STANDING_BUDGET_AUTHORIZATION'
        ? 'AUTHORIZED'
        : 'AUTHORIZATION_PENDING'

    const authorizedAt =
      authResult.authorizationType === 'STANDING_BUDGET_AUTHORIZATION' ? new Date() : null

    // Create spend intent
    const spendIntent = await prisma.spendIntent.create({
      data: {
        teamId,
        createdByUserId: user.id,
        amountCents,
        currency: body.currency || 'CAD',
        vendorId: vendorId || null,
        vendorName: vendorName || null,
        payeeUserId: payeeUserId || null,
        budgetLineItemId: budgetLineItemId || null,
        paymentMethod: paymentMethod as PaymentMethod,
        authorizationType: authResult.authorizationType,
        requiresManualApproval: authResult.requiresManualApproval,
        status,
        authorizedAt,
      },
      include: {
        approvals: true,
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
      },
    })

    // Return spend intent with authorization details
    return NextResponse.json({
      spendIntent,
      authorizationDetails: {
        requiresManualApproval: authResult.requiresManualApproval,
        authorizationType: authResult.authorizationType,
        requiredApprovalsCount: authResult.requiredApprovalsCount,
        minIndependentParentRepCount: authResult.minIndependentParentRepCount,
        reason: authResult.reason,
        conditions: authResult.conditions,
      },
    })
  } catch (error) {
    console.error('Error creating spend intent:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
