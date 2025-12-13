/**
 * Data Migration Script: Budget Versioning Workflow
 *
 * This script migrates existing budget_allocations to the new versioned budget system.
 *
 * Steps:
 * 1. Groups existing budget_allocations by teamId and season
 * 2. Creates a Budget record for each team/season combination
 * 3. Creates a BudgetVersion (v1) for each Budget with allocations
 * 4. Updates budget_allocations to reference the new BudgetVersion
 * 5. Sets up default threshold configurations
 *
 * Safe to run multiple times (idempotent).
 */

import { PrismaClient, BudgetStatus, ThresholdMode } from '@prisma/client'

const prisma = new PrismaClient()

interface BudgetGroup {
  teamId: string
  season: string
  allocations: Array<{
    id: string
    categoryId: string
    allocated: number
    createdAt: Date
    updatedAt: Date
  }>
}

async function migrateBudgetVersioning() {
  console.log('🚀 Starting budget versioning migration...\n')

  try {
    // Step 1: Fetch all existing budget allocations that haven't been migrated
    console.log('📊 Fetching existing budget allocations...')
    const existingAllocations = await prisma.budgetAllocation.findMany({
      where: {
        budgetVersionId: null,
        teamId: { not: null },
        season: { not: null },
      },
      orderBy: [
        { teamId: 'asc' },
        { season: 'asc' },
        { createdAt: 'asc' },
      ],
    })

    console.log(`   Found ${existingAllocations.length} allocations to migrate\n`)

    if (existingAllocations.length === 0) {
      console.log('✅ No allocations to migrate. All done!')
      return
    }

    // Step 2: Group allocations by team and season
    console.log('📦 Grouping allocations by team and season...')
    const budgetGroups = new Map<string, BudgetGroup>()

    for (const allocation of existingAllocations) {
      const key = `${allocation.teamId}:${allocation.season}`

      if (!budgetGroups.has(key)) {
        budgetGroups.set(key, {
          teamId: allocation.teamId!,
          season: allocation.season!,
          allocations: [],
        })
      }

      budgetGroups.get(key)!.allocations.push({
        id: allocation.id,
        categoryId: allocation.categoryId,
        allocated: Number(allocation.allocated),
        createdAt: allocation.createdAt,
        updatedAt: allocation.updatedAt,
      })
    }

    console.log(`   Found ${budgetGroups.size} unique team/season combinations\n`)

    // Step 3: Create Budget and BudgetVersion records for each group
    console.log('🏗️  Creating Budget and BudgetVersion records...\n')

    let migratedCount = 0
    let errorCount = 0

    for (const [key, group] of budgetGroups.entries()) {
      try {
        console.log(`   Processing: Team ${group.teamId}, Season ${group.season}`)

        // Get team info
        const team = await prisma.team.findUnique({
          where: { id: group.teamId },
          include: {
            users: {
              where: {
                role: { in: ['TREASURER', 'ASSISTANT_TREASURER'] },
              },
              orderBy: { createdAt: 'asc' },
              take: 1,
            },
            families: {
              where: { players: { some: { status: 'ACTIVE' } } },
            },
          },
        })

        if (!team) {
          console.log(`   ⚠️  Team ${group.teamId} not found, skipping...`)
          errorCount++
          continue
        }

        // Use first treasurer or first user as creator
        const creator = team.users[0] || await prisma.user.findFirst({
          where: { teamId: group.teamId },
        })

        if (!creator) {
          console.log(`   ⚠️  No users found for team ${group.teamId}, skipping...`)
          errorCount++
          continue
        }

        // Calculate total budget from allocations
        const totalBudget = group.allocations.reduce((sum, a) => sum + a.allocated, 0)

        // Count active families for threshold
        const activeFamiliesCount = team.families.length

        // Create Budget record (check if already exists)
        let budget = await prisma.budget.findUnique({
          where: {
            teamId_season: {
              teamId: group.teamId,
              season: group.season,
            },
          },
        })

        if (!budget) {
          budget = await prisma.budget.create({
            data: {
              teamId: group.teamId,
              season: group.season,
              status: BudgetStatus.DRAFT, // Default to DRAFT for existing budgets
              currentVersionNumber: 1,
              presentedVersionNumber: null,
              createdBy: creator.id,
            },
          })
          console.log(`      ✓ Created Budget ${budget.id}`)
        } else {
          console.log(`      ↻ Budget already exists: ${budget.id}`)
        }

        // Create BudgetVersion record (check if version 1 exists)
        let budgetVersion = await prisma.budgetVersion.findUnique({
          where: {
            budgetId_versionNumber: {
              budgetId: budget.id,
              versionNumber: 1,
            },
          },
        })

        if (!budgetVersion) {
          budgetVersion = await prisma.budgetVersion.create({
            data: {
              budgetId: budget.id,
              versionNumber: 1,
              totalBudget: totalBudget,
              changeSummary: null, // First version has no change summary
              createdBy: creator.id,
            },
          })
          console.log(`      ✓ Created BudgetVersion v1: ${budgetVersion.id}`)
        } else {
          console.log(`      ↻ BudgetVersion v1 already exists: ${budgetVersion.id}`)
        }

        // Create threshold config (check if already exists)
        let thresholdConfig = await prisma.budgetThresholdConfig.findUnique({
          where: { budgetId: budget.id },
        })

        if (!thresholdConfig) {
          thresholdConfig = await prisma.budgetThresholdConfig.create({
            data: {
              budgetId: budget.id,
              mode: ThresholdMode.PERCENT,
              percentThreshold: 80.0, // Default: 80% of families must approve
              countThreshold: null,
              eligibleFamilyCount: activeFamiliesCount,
            },
          })
          console.log(`      ✓ Created threshold config (80% of ${activeFamiliesCount} families)`)
        } else {
          console.log(`      ↻ Threshold config already exists`)
        }

        // Update all allocations to reference the BudgetVersion
        const updateResult = await prisma.budgetAllocation.updateMany({
          where: {
            id: { in: group.allocations.map(a => a.id) },
            budgetVersionId: null, // Only update if not already migrated
          },
          data: {
            budgetVersionId: budgetVersion.id,
          },
        })

        console.log(`      ✓ Updated ${updateResult.count} allocations to reference BudgetVersion`)
        console.log(`      ✅ Migrated ${group.allocations.length} allocations\n`)

        migratedCount++

      } catch (error) {
        console.error(`   ❌ Error migrating ${key}:`, error)
        errorCount++
      }
    }

    // Step 4: Summary
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successfully migrated: ${migratedCount} team/season combinations`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📈 Total allocations processed: ${existingAllocations.length}`)

    // Step 5: Verify migration
    console.log('\n🔍 Verifying migration...')
    const unmigrated = await prisma.budgetAllocation.count({
      where: {
        budgetVersionId: null,
        teamId: { not: null },
        season: { not: null },
      },
    })

    if (unmigrated > 0) {
      console.log(`   ⚠️  Warning: ${unmigrated} allocations still unmigrated`)
    } else {
      console.log('   ✅ All allocations successfully migrated!')
    }

    // Show created budgets summary
    const budgetCount = await prisma.budget.count()
    const versionCount = await prisma.budgetVersion.count()
    const thresholdCount = await prisma.budgetThresholdConfig.count()

    console.log('\n📈 Final Counts:')
    console.log(`   Budgets: ${budgetCount}`)
    console.log(`   Budget Versions: ${versionCount}`)
    console.log(`   Threshold Configs: ${thresholdCount}`)
    console.log(`   Budget Allocations: ${await prisma.budgetAllocation.count()}`)

    console.log('\n✅ Migration complete!\n')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateBudgetVersioning()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
