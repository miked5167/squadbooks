import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { BudgetStatus } from '@prisma/client'

/**
 * POST /api/dev/setup-budget-workflow
 * Sets up 3 teams at different stages of the budget approval lifecycle for demo purposes
 * Protected by DEV_MODE check - only works in development
 */
export async function POST() {
  try {
    // Check if dev mode is enabled
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Dev mode not enabled' },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Known demo team IDs from the seed data
    const TEAM_IDS = {
      u9_snowflakes: 'cminiakzb01xvtgpc7lf53uzx', // U9 A Snowflakes
      u15_thunder: 'cminhpyqi00mttgpco9bi7upp', // U15 A Thunder
      u13_storm: 'cminhmzhi000gtgpcgvw5ogk9', // U13 AA Storm
    }

    const ASSOCIATION_ID = '2a98f680-97df-4215-8209-12806863c5ea'
    const SEASON = '2025-2026'

    const result = await prisma.$transaction(async (tx) => {
      // Fetch all teams with families for setup
      const teams = await tx.team.findMany({
        where: {
          id: {
            in: Object.values(TEAM_IDS),
          },
        },
        include: {
          players: {
            include: {
              family: true,
            },
          },
          users: {
            where: { role: 'TREASURER' },
          },
          categories: true,
        },
      })

      if (teams.length !== 3) {
        throw new Error('Demo teams not found. Run demo seed first.')
      }

      const setupResults = []

      // Team 1: U9 Snowflakes - Awaiting Association Approval
      const u9Team = teams.find((t) => t.id === TEAM_IDS.u9_snowflakes)
      if (u9Team && u9Team.users.length > 0) {
        const treasurerId = u9Team.users[0].id

        // Delete existing budget if any
        await tx.budget.deleteMany({
          where: { teamId: u9Team.id, season: SEASON },
        })

        // Create budget in ASSOCIATION_REVIEW status
        const u9Budget = await tx.budget.create({
          data: {
            teamId: u9Team.id,
            season: SEASON,
            status: BudgetStatus.ASSOCIATION_REVIEW,
            currentVersionNumber: 1,
            createdBy: treasurerId,
          },
        })

        // Create budget version with coach approval (already approved by coach, waiting for association)
        const u9Version = await tx.budgetVersion.create({
          data: {
            budgetId: u9Budget.id,
            versionNumber: 1,
            totalBudget: 45000,
            createdBy: treasurerId,
            coachApprovedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            coachApprovedBy: treasurerId,
            coachNotes: 'Budget looks good. Ready for association approval.',
          },
        })

        // Create sample budget allocations
        const categories = u9Team.categories.slice(0, 4)
        for (const category of categories) {
          await tx.budgetAllocation.create({
            data: {
              budgetVersionId: u9Version.id,
              categoryId: category.id,
              allocated: 11250, // Split evenly for demo
            },
          })
        }

        setupResults.push({
          team: 'U9 Snowflakes',
          status: 'ASSOCIATION_REVIEW',
          description: 'Waiting for association admin approval',
        })
      }

      // Team 2: U15 Thunder - Awaiting Parent Acknowledgement (50%)
      const u15Team = teams.find((t) => t.id === TEAM_IDS.u15_thunder)
      if (u15Team && u15Team.users.length > 0) {
        const treasurerId = u15Team.users[0].id
        const families = Array.from(
          new Set(u15Team.players.map((p) => p.family))
        ).filter(Boolean)

        // Delete existing budget if any
        await tx.budget.deleteMany({
          where: { teamId: u15Team.id, season: SEASON },
        })

        // Create budget in PRESENTED status
        const u15Budget = await tx.budget.create({
          data: {
            teamId: u15Team.id,
            season: SEASON,
            status: BudgetStatus.PRESENTED,
            currentVersionNumber: 1,
            presentedVersionNumber: 1,
            createdBy: treasurerId,
          },
        })

        // Create threshold config (75% required)
        await tx.budgetThresholdConfig.create({
          data: {
            budgetId: u15Budget.id,
            mode: 'PERCENT',
            percentThreshold: 75.0,
            eligibleFamilyCount: families.length,
          },
        })

        // Create budget version (already approved by coach and association if required)
        const u15Version = await tx.budgetVersion.create({
          data: {
            budgetId: u15Budget.id,
            versionNumber: 1,
            totalBudget: 52000,
            createdBy: treasurerId,
            coachApprovedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            coachApprovedBy: treasurerId,
            coachNotes: 'Approved for presentation to parents.',
          },
        })

        // Create sample budget allocations
        const categories = u15Team.categories.slice(0, 4)
        for (const category of categories) {
          await tx.budgetAllocation.create({
            data: {
              budgetVersionId: u15Version.id,
              categoryId: category.id,
              allocated: 13000,
            },
          })
        }

        // Create parent approvals for 50% of families (4 out of 8)
        const approvingFamilies = families.slice(0, Math.floor(families.length * 0.5))
        for (const family of approvingFamilies) {
          if (family) {
            // Find a parent user for this family
            const parentUser = await tx.user.findFirst({
              where: {
                teamId: u15Team.id,
                role: 'PARENT',
                familyId: family.id,
              },
            })

            if (parentUser) {
              await tx.budgetVersionApproval.create({
                data: {
                  budgetVersionId: u15Version.id,
                  familyId: family.id,
                  acknowledgedBy: parentUser.id,
                  acknowledgedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
                },
              })
            }
          }
        }

        setupResults.push({
          team: 'U15 Thunder',
          status: 'PRESENTED',
          description: `${approvingFamilies.length} of ${families.length} families acknowledged (${Math.round((approvingFamilies.length / families.length) * 100)}%), need 75%`,
        })
      }

      // Team 3: U13 Storm - Ready to Lock (86% acknowledged, threshold is 80%)
      const u13Team = teams.find((t) => t.id === TEAM_IDS.u13_storm)
      if (u13Team && u13Team.users.length > 0) {
        const treasurerId = u13Team.users[0].id
        const families = Array.from(
          new Set(u13Team.players.map((p) => p.family))
        ).filter(Boolean)

        // Delete existing budget if any
        await tx.budget.deleteMany({
          where: { teamId: u13Team.id, season: SEASON },
        })

        // Create budget in PRESENTED status
        const u13Budget = await tx.budget.create({
          data: {
            teamId: u13Team.id,
            season: SEASON,
            status: BudgetStatus.PRESENTED,
            currentVersionNumber: 1,
            presentedVersionNumber: 1,
            createdBy: treasurerId,
          },
        })

        // Create threshold config (80% required)
        await tx.budgetThresholdConfig.create({
          data: {
            budgetId: u13Budget.id,
            mode: 'PERCENT',
            percentThreshold: 80.0,
            eligibleFamilyCount: families.length,
          },
        })

        // Create budget version
        const u13Version = await tx.budgetVersion.create({
          data: {
            budgetId: u13Budget.id,
            versionNumber: 1,
            totalBudget: 58000,
            createdBy: treasurerId,
            coachApprovedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            coachApprovedBy: treasurerId,
            coachNotes: 'Budget approved. Ready for parent review.',
          },
        })

        // Create sample budget allocations
        const categories = u13Team.categories.slice(0, 4)
        for (const category of categories) {
          await tx.budgetAllocation.create({
            data: {
              budgetVersionId: u13Version.id,
              categoryId: category.id,
              allocated: 14500,
            },
          })
        }

        // Create parent approvals for 86% of families (12 out of 14)
        const targetApprovals = Math.floor(families.length * 0.86)
        const approvingFamilies = families.slice(0, targetApprovals)
        for (const family of approvingFamilies) {
          if (family) {
            const parentUser = await tx.user.findFirst({
              where: {
                teamId: u13Team.id,
                role: 'PARENT',
                familyId: family.id,
              },
            })

            if (parentUser) {
              await tx.budgetVersionApproval.create({
                data: {
                  budgetVersionId: u13Version.id,
                  familyId: family.id,
                  acknowledgedBy: parentUser.id,
                  acknowledgedAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000),
                },
              })
            }
          }
        }

        setupResults.push({
          team: 'U13 Storm',
          status: 'PRESENTED',
          description: `${approvingFamilies.length} of ${families.length} families acknowledged (${Math.round((approvingFamilies.length / families.length) * 100)}%), threshold met at 80%`,
        })
      }

      return setupResults
    })

    logger.info(
      `[DEV MODE] Budget approval workflow setup complete by user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Budget approval workflow ready',
        description: '3 teams at different approval stages',
        teams: result,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('POST /api/dev/setup-budget-workflow error', error as Error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
