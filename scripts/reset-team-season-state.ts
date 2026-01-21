/**
 * Reset Team Season State
 *
 * Utility to reset a team season to a specific state for testing.
 * WARNING: This is for testing only and bypasses normal transition guards.
 *
 * Usage:
 *   npx tsx scripts/reset-team-season-state.ts <team-id> <season-label> <target-state> [--force]
 *
 * Example:
 *   npx tsx scripts/reset-team-season-state.ts clt1234567 2024-2025 BUDGET_DRAFT --force
 *
 * Valid states:
 *   SETUP, BUDGET_DRAFT, BUDGET_REVIEW, TEAM_APPROVED, PRESENTED, LOCKED, ACTIVE, CLOSEOUT, ARCHIVED
 */

import { prisma } from '@/lib/prisma'
import { TeamSeasonState } from '@prisma/client'

const VALID_STATES: TeamSeasonState[] = [
  'SETUP',
  'BUDGET_DRAFT',
  'BUDGET_REVIEW',
  'TEAM_APPROVED',
  'PRESENTED',
  'LOCKED',
  'ACTIVE',
  'CLOSEOUT',
  'ARCHIVED',
]

async function main() {
  const teamId = process.argv[2]
  const seasonLabel = process.argv[3]
  const targetState = process.argv[4] as TeamSeasonState
  const force = process.argv.includes('--force')

  if (!teamId || !seasonLabel || !targetState) {
    console.error('Usage: npx tsx scripts/reset-team-season-state.ts <team-id> <season-label> <target-state> [--force]')
    console.error('\nValid states:')
    VALID_STATES.forEach((state) => console.error(`  - ${state}`))
    process.exit(1)
  }

  if (!VALID_STATES.includes(targetState)) {
    console.error(`❌ Invalid state: ${targetState}`)
    console.error('\nValid states:')
    VALID_STATES.forEach((state) => console.error(`  - ${state}`))
    process.exit(1)
  }

  console.log('⚠️  Reset Team Season State')
  console.log('===========================')
  console.log(`Team ID: ${teamId}`)
  console.log(`Season: ${seasonLabel}`)
  console.log(`Target State: ${targetState}`)
  console.log(`Force: ${force}`)
  console.log('')

  if (!force) {
    console.error('❌ This operation requires --force flag to confirm.')
    console.error('This will bypass normal transition guards and directly modify the state.')
    process.exit(1)
  }

  try {
    // Find team season
    const teamSeason = await prisma.teamSeason.findUnique({
      where: {
        teamId_seasonLabel: {
          teamId,
          seasonLabel,
        },
      },
    })

    if (!teamSeason) {
      console.error('❌ TeamSeason not found')
      process.exit(1)
    }

    const currentState = teamSeason.state
    console.log(`Current State: ${currentState}`)

    if (currentState === targetState) {
      console.log('✅ Already in target state. No changes needed.')
      process.exit(0)
    }

    // Update state directly
    console.log(`\nUpdating state: ${currentState} → ${targetState}...`)

    const updates: any = {
      state: targetState,
      stateUpdatedAt: new Date(),
    }

    // Set appropriate timestamp fields based on target state
    switch (targetState) {
      case 'ACTIVE':
        updates.activeAt = new Date()
        break
      case 'CLOSEOUT':
        updates.closedAt = new Date()
        break
      case 'ARCHIVED':
        updates.archivedAt = new Date()
        break
    }

    await prisma.teamSeason.update({
      where: { id: teamSeason.id },
      data: updates,
    })

    // Create audit log
    await prisma.teamSeasonStateChange.create({
      data: {
        teamSeasonId: teamSeason.id,
        fromState: currentState,
        toState: targetState,
        action: 'START_BUDGET', // Placeholder action
        actorUserId: null,
        actorType: 'SYSTEM',
        metadata: {
          manualReset: true,
          resetScript: true,
          note: 'State reset for testing purposes',
        },
      },
    })

    console.log('✅ State updated successfully')
    console.log('')
    console.log(`TeamSeason ${teamSeason.id} is now in state: ${targetState}`)
  } catch (error) {
    console.error('\n❌ Error:', error)
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
