/**
 * Test Team Season Workflow
 *
 * Interactive script to test team season lifecycle transitions.
 * Useful for manually testing the happy path and edge cases.
 *
 * Usage:
 *   npx tsx scripts/test-team-season-workflow.ts <team-id> <season-label>
 */

import { prisma } from '@/lib/prisma'
import { transitionTeamSeason, getAvailableActions } from '@/lib/services/team-season-lifecycle'
import { checkAndLockBudget, autoActivateOnFirstTransaction } from '@/lib/services/team-season-auto-transitions'
import { createTeamSeasonWithSnapshot } from '@/lib/services/team-policy-snapshot'
import { TeamSeasonAction } from '@prisma/client'

async function main() {
  const teamId = process.argv[2]
  const seasonLabel = process.argv[3] || '2024-2025'

  if (!teamId) {
    console.error('Usage: npx tsx scripts/test-team-season-workflow.ts <team-id> [season-label]')
    process.exit(1)
  }

  console.log('🧪 Team Season Workflow Test')
  console.log('============================')
  console.log(`Team ID: ${teamId}`)
  console.log(`Season: ${seasonLabel}\n`)

  try {
    // Get team and association
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        associationTeam: true,
      },
    })

    if (!team) {
      console.error('❌ Team not found')
      process.exit(1)
    }

    if (!team.associationTeam) {
      console.error('❌ Team is not connected to an association')
      process.exit(1)
    }

    console.log(`Team: ${team.name}`)
    console.log(`Association: ${team.associationTeam.associationId}\n`)

    // Get or create team season
    let teamSeason = await prisma.teamSeason.findUnique({
      where: {
        teamId_seasonLabel: {
          teamId,
          seasonLabel,
        },
      },
    })

    if (!teamSeason) {
      console.log('Creating new TeamSeason...')
      const teamSeasonId = await createTeamSeasonWithSnapshot(
        teamId,
        team.associationTeam.associationId,
        seasonLabel,
        new Date('2024-09-01'),
        new Date('2025-08-31')
      )

      teamSeason = await prisma.teamSeason.findUnique({
        where: { id: teamSeasonId },
      })

      console.log(`✅ Created TeamSeason: ${teamSeasonId}`)
    } else {
      console.log(`Found existing TeamSeason: ${teamSeason.id}`)
    }

    if (!teamSeason) {
      console.error('❌ Failed to get or create team season')
      process.exit(1)
    }

    console.log(`Current State: ${teamSeason.state}\n`)

    // Get a test user (treasurer)
    const treasurer = await prisma.user.findFirst({
      where: {
        teamId,
        role: 'TREASURER',
      },
    })

    const coach = await prisma.user.findFirst({
      where: {
        teamId,
        role: 'PRESIDENT',
      },
    })

    if (!treasurer) {
      console.error('❌ No treasurer found for this team')
      process.exit(1)
    }

    console.log(`Test Users:`)
    console.log(`  Treasurer: ${treasurer.name} (${treasurer.id})`)
    if (coach) {
      console.log(`  Coach: ${coach.name} (${coach.id})`)
    }
    console.log('')

    // Get available actions for treasurer
    const treasurerActions = await getAvailableActions(teamSeason.id, treasurer.id)
    console.log(`Available Actions for Treasurer:`)
    if (treasurerActions.length === 0) {
      console.log('  (none)')
    } else {
      treasurerActions.forEach((action) => console.log(`  - ${action}`))
    }
    console.log('')

    if (coach) {
      const coachActions = await getAvailableActions(teamSeason.id, coach.id)
      console.log(`Available Actions for Coach:`)
      if (coachActions.length === 0) {
        console.log('  (none)')
      } else {
        coachActions.forEach((action) => console.log(`  - ${action}`))
      }
      console.log('')
    }

    // Interactive testing menu
    console.log('📝 Test Scenarios:')
    console.log('==================')
    console.log('')
    console.log('Example transitions you can test:')
    console.log('')
    console.log('1. Happy Path:')
    console.log('   START_BUDGET → SUBMIT_BUDGET_FOR_REVIEW → APPROVE_BUDGET → PRESENT_BUDGET → (wait for parent approvals) → LOCKED → ACTIVE')
    console.log('')
    console.log('2. Budget Update Loop:')
    console.log('   From PRESENTED/LOCKED/ACTIVE → PROPOSE_BUDGET_UPDATE → APPROVE_BUDGET → PRESENT_BUDGET → LOCKED')
    console.log('')
    console.log('3. Coach Requests Changes:')
    console.log('   From BUDGET_REVIEW → REQUEST_BUDGET_CHANGES → back to BUDGET_DRAFT')
    console.log('')
    console.log('Run transitions manually using:')
    console.log('')
    console.log('  import { transitionTeamSeason } from "@/lib/services/team-season-lifecycle"')
    console.log('')
    console.log('  await transitionTeamSeason(')
    console.log(`    "${teamSeason.id}",`)
    console.log('    "START_BUDGET",  // or other action')
    console.log(`    "${treasurer.id}",`)
    console.log('    { /* metadata */ }')
    console.log('  )')
    console.log('')

    // Get state change history
    const stateChanges = await prisma.teamSeasonStateChange.findMany({
      where: { teamSeasonId: teamSeason.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (stateChanges.length > 0) {
      console.log('📜 Recent State Changes:')
      console.log('========================')
      stateChanges.forEach((change, i) => {
        const fromState = change.fromState || 'null'
        console.log(
          `${i + 1}. ${fromState} → ${change.toState} (${change.action}) - ${change.createdAt.toISOString()}`
        )
        if (change.actorUserId) {
          console.log(`   Actor: ${change.actorUserId} (${change.actorType})`)
        }
      })
    }

    console.log('\n✅ Test setup completed')
    console.log('\nYou can now test transitions programmatically or via the UI.')
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
