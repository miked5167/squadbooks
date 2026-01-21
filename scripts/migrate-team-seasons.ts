/**
 * Migration Script: Create TeamSeason Records for Existing Teams
 *
 * This script creates TeamSeason records for existing teams that don't have them yet.
 * It maps existing Budget status to appropriate TeamSeasonState and creates policy snapshots.
 *
 * Usage:
 *   npx tsx scripts/migrate-team-seasons.ts [--dry-run]
 */

import { prisma } from '@/lib/prisma'
import { createPolicySnapshot } from '@/lib/services/team-policy-snapshot'
import { TeamSeasonState } from '@prisma/client'

interface MigrationStats {
  teamsProcessed: number
  teamSeasonsCreated: number
  policiesCreated: number
  skipped: number
  errors: string[]
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run')

  console.log('🔄 Team Season Migration')
  console.log('========================')
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  const stats: MigrationStats = {
    teamsProcessed: 0,
    teamSeasonsCreated: 0,
    policiesCreated: 0,
    skipped: 0,
    errors: [],
  }

  try {
    // Get all teams with their current budgets
    const teams = await prisma.team.findMany({
      include: {
        associationTeam: true,
        budgets: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Get most recent budget
        },
      },
    })

    console.log(`Found ${teams.length} teams to process\n`)

    for (const team of teams) {
      stats.teamsProcessed++

      console.log(`Processing Team: ${team.name} (${team.id})`)

      // Skip if team is not connected to an association
      if (!team.associationTeam) {
        console.log(`  ⚠️  Skipped: Not connected to an association`)
        stats.skipped++
        continue
      }

      // Get season info
      const seasonLabel = team.season || '2024-2025'
      const seasonStart = team.seasonStartDate || new Date('2024-09-01')
      const seasonEnd = team.seasonEndDate || new Date('2025-08-31')

      // Check if TeamSeason already exists
      const existingTeamSeason = await prisma.teamSeason.findUnique({
        where: {
          teamId_seasonLabel: {
            teamId: team.id,
            seasonLabel,
          },
        },
      })

      if (existingTeamSeason) {
        console.log(`  ✓ TeamSeason already exists (${existingTeamSeason.state})`)
        stats.skipped++
        continue
      }

      // Determine initial state based on budget status
      let initialState: TeamSeasonState = 'SETUP'
      let presentedVersionId: string | null = null
      let lockedVersionId: string | null = null

      if (team.budgets.length > 0) {
        const budget = team.budgets[0]

        switch (budget.status) {
          case 'LOCKED':
            initialState = 'ACTIVE' // Budget is locked, assume season is active
            if (budget.presentedVersionNumber) {
              const presentedVersion = await prisma.budgetVersion.findFirst({
                where: {
                  budgetId: budget.id,
                  versionNumber: budget.presentedVersionNumber,
                },
              })
              presentedVersionId = presentedVersion?.id || null
              lockedVersionId = presentedVersion?.id || null
            }
            break
          case 'PRESENTED':
            initialState = 'PRESENTED'
            if (budget.presentedVersionNumber) {
              const presentedVersion = await prisma.budgetVersion.findFirst({
                where: {
                  budgetId: budget.id,
                  versionNumber: budget.presentedVersionNumber,
                },
              })
              presentedVersionId = presentedVersion?.id || null
            }
            break
          case 'TEAM_APPROVED':
            initialState = 'TEAM_APPROVED'
            break
          case 'REVIEW':
            initialState = 'BUDGET_REVIEW'
            break
          case 'DRAFT':
            initialState = 'BUDGET_DRAFT'
            break
          default:
            initialState = 'SETUP'
        }

        console.log(`  Budget Status: ${budget.status} → State: ${initialState}`)
      }

      if (isDryRun) {
        console.log(`  [DRY RUN] Would create TeamSeason with:`)
        console.log(`    - State: ${initialState}`)
        console.log(`    - Season: ${seasonLabel}`)
        console.log(`    - Association: ${team.associationTeam.associationId}`)
        stats.teamSeasonsCreated++
        continue
      }

      try {
        // Create policy snapshot
        console.log('  Creating policy snapshot...')
        const policySnapshotId = await createPolicySnapshot(team.associationTeam.associationId)
        stats.policiesCreated++

        // Create TeamSeason
        const teamSeason = await prisma.teamSeason.create({
          data: {
            teamId: team.id,
            associationId: team.associationTeam.associationId,
            seasonLabel,
            seasonStart,
            seasonEnd,
            state: initialState,
            policySnapshotId,
            presentedVersionId,
            lockedVersionId,
            activeAt: initialState === 'ACTIVE' ? new Date() : null,
          },
        })

        // Create initial state change log
        await prisma.teamSeasonStateChange.create({
          data: {
            teamSeasonId: teamSeason.id,
            fromState: null,
            toState: initialState,
            action: 'START_BUDGET',
            actorUserId: null,
            actorType: 'SYSTEM',
            metadata: {
              migration: true,
              originalBudgetStatus: team.budgets[0]?.status || null,
            },
          },
        })

        console.log(`  ✅ Created TeamSeason (${teamSeason.id}) with state: ${initialState}`)
        stats.teamSeasonsCreated++
      } catch (error) {
        const errorMsg = `Failed to create TeamSeason for ${team.name}: ${error instanceof Error ? error.message : String(error)}`
        console.error(`  ❌ ${errorMsg}`)
        stats.errors.push(errorMsg)
      }

      console.log('')
    }

    // Print summary
    console.log('\n📊 Migration Summary')
    console.log('===================')
    console.log(`Teams Processed:      ${stats.teamsProcessed}`)
    console.log(`TeamSeasons Created:  ${stats.teamSeasonsCreated}`)
    console.log(`Policy Snapshots:     ${stats.policiesCreated}`)
    console.log(`Skipped:              ${stats.skipped}`)
    console.log(`Errors:               ${stats.errors.length}`)

    if (stats.errors.length > 0) {
      console.log('\n❌ Errors:')
      stats.errors.forEach((err) => console.log(`  - ${err}`))
    }

    if (isDryRun) {
      console.log('\n⚠️  This was a DRY RUN. No changes were made to the database.')
      console.log('Run without --dry-run to apply changes.')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log('\n✅ Migration completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })
