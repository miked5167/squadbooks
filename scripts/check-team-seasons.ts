/**
 * Check Team Seasons Script
 *
 * Displays current state of team seasons in the database.
 * Useful for verification after migration or to troubleshoot issues.
 *
 * Usage:
 *   npx tsx scripts/check-team-seasons.ts [--association-id=<uuid>] [--state=<state>]
 */

import { prisma } from '@/lib/prisma'
import { TeamSeasonState } from '@prisma/client'

async function main() {
  const args = process.argv.slice(2)
  const associationIdArg = args.find((arg) => arg.startsWith('--association-id='))
  const stateArg = args.find((arg) => arg.startsWith('--state='))

  const filters: any = {}

  if (associationIdArg) {
    filters.associationId = associationIdArg.split('=')[1]
  }

  if (stateArg) {
    filters.state = stateArg.split('=')[1] as TeamSeasonState
  }

  console.log('🔍 Team Season Status Check')
  console.log('==========================')
  if (Object.keys(filters).length > 0) {
    console.log('Filters:', JSON.stringify(filters, null, 2))
  }
  console.log('')

  try {
    // Get team seasons with related data
    const teamSeasons = await prisma.teamSeason.findMany({
      where: filters,
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        policySnapshot: {
          select: {
            id: true,
            createdAt: true,
          },
        },
        stateChanges: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: [{ seasonLabel: 'desc' }, { stateUpdatedAt: 'desc' }],
    })

    if (teamSeasons.length === 0) {
      console.log('No team seasons found.')
      return
    }

    console.log(`Found ${teamSeasons.length} team season(s)\n`)

    // Group by state for summary
    const stateCounts = teamSeasons.reduce((acc, ts) => {
      acc[ts.state] = (acc[ts.state] || 0) + 1
      return acc
    }, {} as Record<TeamSeasonState, number>)

    console.log('📊 Summary by State:')
    Object.entries(stateCounts).forEach(([state, count]) => {
      console.log(`  ${state}: ${count}`)
    })
    console.log('')

    // Display details for each team season
    console.log('📋 Team Season Details:\n')

    for (const ts of teamSeasons) {
      console.log(`Team: ${ts.team.name}`)
      console.log(`  Season: ${ts.seasonLabel}`)
      console.log(`  State: ${ts.state}`)
      console.log(`  State Updated: ${ts.stateUpdatedAt.toISOString()}`)

      if (ts.presentedVersionId) {
        console.log(`  Presented Version: ${ts.presentedVersionId}`)
      }
      if (ts.lockedVersionId) {
        console.log(`  Locked Version: ${ts.lockedVersionId}`)
      }
      if (ts.activeAt) {
        console.log(`  Activated At: ${ts.activeAt.toISOString()}`)
      }
      if (ts.closedAt) {
        console.log(`  Closed At: ${ts.closedAt.toISOString()}`)
      }
      if (ts.archivedAt) {
        console.log(`  Archived At: ${ts.archivedAt.toISOString()}`)
      }

      console.log(`  Policy Snapshot: ${ts.policySnapshot ? 'Yes' : 'No'}`)

      if (ts.eligibleFamiliesCount !== null) {
        console.log(`  Eligible Families: ${ts.eligibleFamiliesCount}`)
      }
      if (ts.approvalsCountForPresentedVersion !== null) {
        console.log(`  Approvals: ${ts.approvalsCountForPresentedVersion}`)
      }

      if (ts.stateChanges.length > 0) {
        console.log('  Recent State Changes:')
        ts.stateChanges.slice(0, 3).forEach((change, i) => {
          const fromState = change.fromState || 'null'
          console.log(
            `    ${i + 1}. ${fromState} → ${change.toState} (${change.action}) - ${change.createdAt.toISOString()}`
          )
        })
      }

      console.log('')
    }

    console.log('✅ Check completed')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
