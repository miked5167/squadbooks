import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import {
  getCoachCompPolicy,
  parseAgeGroup,
  getEffectiveCapForTeam,
  calculateActualSpend,
  calculateBudgetedAmount,
  evaluateCapStatus,
} from '@/lib/services/coach-compensation'

const prisma = new PrismaClient()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { teamId } = await params
    const { searchParams } = new URL(req.url)
    const associationId = searchParams.get('associationId')
    const season = searchParams.get('season') || null

    if (!associationId) {
      return NextResponse.json(
        { success: false, error: 'associationId is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this team
    const teamUser = await prisma.user.findFirst({
      where: {
        clerkUserId: userId,
        teamId,
      },
    })

    if (!teamUser) {
      return NextResponse.json(
        { success: false, error: 'You do not have access to this team' },
        { status: 403 }
      )
    }

    // Get team details
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        name: true,
        competitiveLevel: true,
        budgets: {
          where: { isActive: true },
          take: 1,
          select: { id: true },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ success: false, error: 'Team not found' }, { status: 404 })
    }

    // Get active coach compensation policy
    const policy = await getCoachCompPolicy(associationId)

    if (!policy || !policy.isActive) {
      return NextResponse.json({
        success: true,
        data: {
          hasPolicy: false,
        },
      })
    }

    // Parse age group and skill level
    const ageGroup = parseAgeGroup(team.name)
    const skillLevel = team.competitiveLevel

    if (!ageGroup || !skillLevel) {
      return NextResponse.json({
        success: true,
        data: {
          hasPolicy: true,
          cap: 0,
          actual: 0,
          budgeted: 0,
          percentUsed: 0,
          hasException: false,
          ageGroup: null,
          skillLevel: null,
        },
      })
    }

    // Get effective cap (including any approved exceptions)
    const capInfo = await getEffectiveCapForTeam({
      policyId: policy.ruleId,
      teamId,
      season,
      ageGroup,
      skillLevel,
    })

    // Calculate actual spend
    const actual = await calculateActualSpend({
      teamId,
      season,
      categoryIds: policy.config.categoryIds,
    })

    // Calculate budgeted amount if budget exists
    let budgeted = 0
    if (team.budgets.length > 0) {
      budgeted = await calculateBudgetedAmount({
        budgetId: team.budgets[0].id,
        categoryIds: policy.config.categoryIds,
      })
    }

    const percentUsed = capInfo.effectiveCap > 0 ? (actual / capInfo.effectiveCap) * 100 : 0

    // Get exception info if exists
    const exception = await prisma.teamRuleOverride.findFirst({
      where: {
        teamId,
        ruleId: policy.ruleId,
        isActive: true,
      },
    })

    const exceptionConfig = exception?.overrideConfig as any

    return NextResponse.json({
      success: true,
      data: {
        hasPolicy: true,
        cap: capInfo.baseCap,
        actual,
        budgeted,
        percentUsed,
        hasException: capInfo.hasException,
        exceptionStatus: exceptionConfig?.status,
        exceptionDelta: capInfo.exceptionDelta,
        ageGroup,
        skillLevel,
      },
    })
  } catch (error) {
    console.error('Error fetching coach compensation status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
