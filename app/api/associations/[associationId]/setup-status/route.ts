import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { associationId } = await params

    // Verify user has access to this association
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json(
        { error: 'You do not have access to this association' },
        { status: 403 }
      )
    }

    // Get association details
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        receiptsEnabled: true,
        receiptGlobalThresholdCents: true,
        receiptGracePeriodDays: true,
        config: {
          select: {
            budgetWarningPct: true,
            budgetCriticalPct: true,
          },
        },
        governanceRule: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 })
    }

    // Check if coach compensation policy exists and is configured
    const coachCompPolicy = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
      },
      include: {
        coachCompensationLimits: true,
      },
    })

    const setupStatus = {
      // Coach Compensation - considered configured if policy exists and has at least one cap limit
      coachCompensationPolicyConfigured:
        coachCompPolicy !== null && coachCompPolicy.coachCompensationLimits.length > 0,

      // Receipt Policy - considered configured if it's enabled (default during onboarding)
      receiptPolicyConfigured: association.receiptsEnabled === true,

      // Budget Governance - considered configured if governance rule exists
      budgetGovernanceConfigured: association.governanceRule !== null,

      // Dashboard Config - considered configured if thresholds are set (non-null)
      dashboardConfigured:
        association.config !== null &&
        association.config.budgetWarningPct !== null &&
        association.config.budgetCriticalPct !== null,
    }

    return NextResponse.json(setupStatus)
  } catch (error) {
    console.error('Error fetching setup status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
