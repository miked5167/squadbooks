import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import {
  getCoachCompPolicy,
  parseAgeGroup,
  getEffectiveCapForTeam,
  calculateActualSpend,
  evaluateCapStatus,
} from '@/lib/services/coach-compensation'

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
        season: true,
      },
    })

    if (!association) {
      return NextResponse.json({ error: 'Association not found' }, { status: 404 })
    }

    // Get active coach compensation policy
    const policy = await getCoachCompPolicy(associationId)

    if (!policy || !policy.isActive) {
      return NextResponse.json({
        hasPolicy: false,
        teams: [],
      })
    }

    // Get all association teams
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      select: {
        id: true,
        teamName: true,
        team: {
          select: {
            id: true,
            name: true,
            competitiveLevel: true,
          },
        },
      },
    })

    const season = association.season

    // Calculate compliance for each team
    const teamsCompliance = await Promise.all(
      associationTeams
        .filter((at) => at.team)
        .map(async (associationTeam) => {
          const team = associationTeam.team!
          const teamId = team.id

          // Parse age group and skill level
          const ageGroup = parseAgeGroup(team.name)
          const skillLevel = team.competitiveLevel

          if (!ageGroup || !skillLevel) {
            return null
          }

          try {
            // Get effective cap
            const capInfo = await getEffectiveCapForTeam({
              policyId: policy.ruleId,
              teamId,
              season,
              ageGroup,
              skillLevel,
            })

            // No cap configured for this team
            if (capInfo.effectiveCap === 0) {
              return null
            }

            // Calculate actual spend
            const actual = await calculateActualSpend({
              teamId,
              season,
              categoryIds: policy.config.categoryIds,
            })

            const percentUsed = (actual / capInfo.effectiveCap) * 100

            // Evaluate status
            const status = evaluateCapStatus({
              actual,
              cap: capInfo.effectiveCap,
              approachingThreshold: policy.config.approachingThreshold || 90,
            })

            // Get exception info
            const exception = await prisma.teamRuleOverride.findFirst({
              where: {
                teamId,
                ruleId: policy.ruleId,
                isActive: true,
              },
            })

            const exceptionConfig = exception?.overrideConfig as any

            return {
              teamId: associationTeam.id, // Use association team ID for linking
              teamName: associationTeam.teamName,
              ageGroup,
              skillLevel,
              cap: capInfo.baseCap,
              actual,
              percentUsed,
              status,
              hasException: capInfo.hasException,
              exceptionStatus: exceptionConfig?.status,
            }
          } catch (error) {
            console.error(`Error calculating compliance for team ${teamId}:`, error)
            return null
          }
        })
    )

    // Filter out nulls and sort by status
    const validTeams = teamsCompliance.filter((t) => t !== null)

    return NextResponse.json({
      hasPolicy: true,
      teams: validTeams,
    })
  } catch (error) {
    console.error('Error fetching coach compensation compliance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
