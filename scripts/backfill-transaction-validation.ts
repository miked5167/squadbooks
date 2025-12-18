/**
 * Backfill Transaction Validation Data
 *
 * This script performs intelligent backfilling of validation data for existing transactions.
 * It runs the actual validation logic against historical budget data to create accurate
 * validation_json records.
 *
 * Usage:
 *   npx tsx scripts/backfill-transaction-validation.ts [--dry-run] [--limit=100]
 *
 * Options:
 *   --dry-run: Show what would be updated without making changes
 *   --limit=N: Process only N transactions (default: all)
 *   --team-id=X: Process only transactions for specific team
 */

import { prisma } from '@/lib/prisma'
import { computeValidation } from '@/lib/services/transaction-validator'
import type { ValidationContext } from '@/lib/types/validation'

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const limitArg = args.find(arg => arg.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined
const teamIdArg = args.find(arg => arg.startsWith('--team-id='))
const teamId = teamIdArg ? teamIdArg.split('=')[1] : undefined

interface BackfillStats {
  total: number
  processed: number
  validated: number
  exceptions: number
  errors: number
  skipped: number
}

const stats: BackfillStats = {
  total: 0,
  processed: 0,
  validated: 0,
  exceptions: 0,
  errors: 0,
  skipped: 0,
}

/**
 * Build validation context from historical data
 */
async function buildHistoricalContext(
  transaction: any,
  teamId: string
): Promise<ValidationContext | null> {
  try {
    // Get team settings
    const teamSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
      select: {
        receiptRequiredThreshold: true,
        dualApprovalThreshold: true,
      },
    })

    // Get budget that was active at transaction date
    const budget = await prisma.budget.findFirst({
      where: {
        teamId,
        createdAt: { lte: transaction.transactionDate },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        currentVersion: {
          include: {
            allocations: {
              select: {
                categoryId: true,
                allocated: true,
                spent: true,
              },
            },
          },
        },
      },
    })

    // Get envelopes that were active at transaction date
    const envelopes = budget
      ? await prisma.budgetEnvelope.findMany({
          where: {
            budgetId: budget.id,
            isActive: true,
            OR: [
              { startDate: null },
              { startDate: { lte: transaction.transactionDate } },
            ],
            AND: [
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: transaction.transactionDate } },
                ],
              },
            ],
          },
          select: {
            id: true,
            categoryId: true,
            vendorMatch: true,
            vendorMatchType: true,
            capAmount: true,
            spent: true,
            maxSingleTransaction: true,
          },
        })
      : []

    // Get season dates
    const teamSeason = await prisma.teamSeason.findFirst({
      where: { teamId },
      select: {
        season: {
          select: {
            startDate: true,
            endDate: true,
          },
        },
      },
    })

    return {
      transaction: {
        amount: Number(transaction.amount),
        type: transaction.type as 'INCOME' | 'EXPENSE',
        categoryId: transaction.categoryId,
        systemCategoryId: transaction.systemCategoryId,
        vendor: transaction.vendor,
        transactionDate: new Date(transaction.transactionDate),
        receiptUrl: transaction.receiptUrl,
        description: transaction.description,
      },
      budget: budget
        ? {
            id: budget.id,
            status: budget.status,
            allocations: (budget.currentVersion?.allocations || []).map(
              (a) => ({
                categoryId: a.categoryId,
                allocated: Number(a.allocated),
                spent: Number(a.spent),
              })
            ),
          }
        : undefined,
      envelopes: envelopes.map((e) => ({
        id: e.id,
        categoryId: e.categoryId,
        vendorMatch: e.vendorMatch,
        vendorMatchType: e.vendorMatchType,
        capAmount: Number(e.capAmount),
        spent: Number(e.spent),
        maxSingleTransaction: e.maxSingleTransaction
          ? Number(e.maxSingleTransaction)
          : null,
      })),
      teamSettings: {
        receiptThreshold: Number(teamSettings?.receiptRequiredThreshold || 100),
        largeTransactionThreshold: Number(
          teamSettings?.dualApprovalThreshold || 200
        ),
      },
      season: teamSeason
        ? {
            startDate: teamSeason.season.startDate,
            endDate: teamSeason.season.endDate,
          }
        : undefined,
    }
  } catch (error) {
    console.error(`Error building context for transaction ${transaction.id}:`, error)
    return null
  }
}

/**
 * Determine exception severity from validation result
 */
function calculateExceptionSeverity(validation: any, amount: number) {
  const criticalViolations = validation.violations.filter(
    (v: any) => v.severity === 'CRITICAL'
  )
  const errorViolations = validation.violations.filter(
    (v: any) => v.severity === 'ERROR'
  )

  if (criticalViolations.length > 0) return 'CRITICAL'
  if (errorViolations.length > 2) return 'HIGH'
  if (amount >= 500 && errorViolations.length > 0) return 'HIGH'
  if (errorViolations.length > 0) return 'MEDIUM'
  return 'LOW'
}

/**
 * Main backfill function
 */
async function backfillValidation() {
  console.log('\n🔄 Starting Transaction Validation Backfill')
  console.log('=' .repeat(60))
  console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}`)
  console.log(`Limit: ${limit || 'ALL'}`)
  console.log(`Team Filter: ${teamId || 'ALL TEAMS'}`)
  console.log('=' .repeat(60) + '\n')

  // Find transactions without validation_json
  const transactions = await prisma.transaction.findMany({
    where: {
      validationJson: null,
      ...(teamId ? { teamId } : {}),
    },
    include: {
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  stats.total = transactions.length
  console.log(`📊 Found ${stats.total} transactions to process\n`)

  // Process each transaction
  for (let i = 0; i < transactions.length; i++) {
    const txn = transactions[i]
    const progress = `[${i + 1}/${transactions.length}]`

    try {
      console.log(
        `${progress} Processing: ${txn.vendor} - $${txn.amount} (${txn.status})`
      )

      // Build validation context
      const context = await buildHistoricalContext(txn, txn.teamId)

      if (!context) {
        console.log(`  ⚠️  Could not build context, skipping...`)
        stats.skipped++
        continue
      }

      // Run validation
      const validation = await computeValidation(context)

      // Determine new status if needed
      const newStatus = validation.compliant ? 'VALIDATED' : 'EXCEPTION'
      const shouldUpdateStatus = ['APPROVED_AUTOMATIC', 'PENDING'].includes(
        txn.status
      )

      // Calculate exception severity
      const exceptionSeverity = !validation.compliant
        ? calculateExceptionSeverity(validation, Number(txn.amount))
        : null

      // Calculate receipt status
      const receiptStatus =
        txn.receiptUrl !== null
          ? 'ATTACHED'
          : txn.type === 'EXPENSE' && Number(txn.amount) >= 100
          ? 'REQUIRED_MISSING'
          : 'NONE'

      // Prepare update data
      const updateData = {
        validationJson: {
          compliant: validation.compliant,
          violations: validation.violations,
          score: validation.score,
          validatedAt: validation.validatedAt.toISOString(),
          checksRun: validation.checksRun,
          backfilled: true,
          backfilledAt: new Date().toISOString(),
        },
        ...(shouldUpdateStatus ? { status: newStatus } : {}),
        ...(exceptionSeverity ? { exceptionSeverity } : {}),
        receiptStatus,
        ...(validation.violations.length > 0
          ? {
              exceptionReason: validation.violations
                .filter(
                  (v) => v.severity === 'ERROR' || v.severity === 'CRITICAL'
                )
                .map((v) => v.message)
                .join('; '),
            }
          : {}),
      }

      // Show what will be updated
      console.log(`  ✓ Validation: ${validation.compliant ? 'PASS' : 'FAIL'}`)
      console.log(`    - Violations: ${validation.violations.length}`)
      console.log(`    - Score: ${validation.score}`)
      if (shouldUpdateStatus) {
        console.log(`    - Status: ${txn.status} → ${newStatus}`)
      }
      if (exceptionSeverity) {
        console.log(`    - Severity: ${exceptionSeverity}`)
      }

      // Update database (unless dry run)
      if (!isDryRun) {
        await prisma.transaction.update({
          where: { id: txn.id },
          data: updateData as any,
        })
      }

      stats.processed++
      if (validation.compliant) {
        stats.validated++
      } else {
        stats.exceptions++
      }
    } catch (error) {
      console.error(`  ❌ Error processing transaction ${txn.id}:`, error)
      stats.errors++
    }

    // Small delay to avoid overwhelming the database
    if (i < transactions.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📈 Backfill Summary')
  console.log('='.repeat(60))
  console.log(`Total Transactions:      ${stats.total}`)
  console.log(`Successfully Processed:  ${stats.processed}`)
  console.log(`  - Validated:           ${stats.validated}`)
  console.log(`  - Exceptions:          ${stats.exceptions}`)
  console.log(`Skipped:                 ${stats.skipped}`)
  console.log(`Errors:                  ${stats.errors}`)
  console.log('='.repeat(60))

  if (isDryRun) {
    console.log('\n⚠️  This was a DRY RUN - no changes were made')
    console.log('Run without --dry-run to apply changes\n')
  } else {
    console.log('\n✅ Backfill complete!\n')
  }
}

// Run the backfill
backfillValidation()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
