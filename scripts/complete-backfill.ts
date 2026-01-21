/**
 * Complete backfill without trigger interference
 */
import { prisma } from '../lib/prisma'

async function backfill() {
  try {
    console.log('🔄 Temporarily disabling trigger...\n')
    await prisma.$executeRaw`ALTER TABLE transactions DISABLE TRIGGER trigger_log_validation_changes`

    console.log('🔄 Completing backfill...\n')

    const statusUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET status = CASE
        WHEN status = 'APPROVED_AUTOMATIC' THEN 'VALIDATED'::\"TransactionStatus\"
        WHEN status = 'PENDING' THEN 'EXCEPTION'::\"TransactionStatus\"
        WHEN status = 'APPROVED' THEN 'RESOLVED'::\"TransactionStatus\"
        WHEN status = 'REJECTED' THEN 'EXCEPTION'::\"TransactionStatus\"
        ELSE status
      END
      WHERE status IN ('APPROVED_AUTOMATIC', 'PENDING', 'APPROVED', 'REJECTED')
    `
    console.log(`   ✓ Updated ${statusUpdate} transaction statuses`)

    const validatedUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', true,
        'violations', '[]'::jsonb,
        'score', 100,
        'validatedAt', COALESCE("updatedAt", "createdAt")::text,
        'checksRun', jsonb_build_object(
          'budget', false,
          'receipt', CASE WHEN "receiptUrl" IS NOT NULL THEN true ELSE false END,
          'category', CASE WHEN "categoryId" IS NOT NULL THEN true ELSE false END,
          'envelope', true,
          'threshold', true,
          'associationRules', false,
          'dates', true,
          'vendor', false,
          'duplicates', false
        ),
        'legacyStatus', 'APPROVED_AUTOMATIC',
        'backfilled', true,
        'backfilledAt', NOW()::text
      )
      WHERE status = 'VALIDATED' AND validation_json IS NULL
    `
    console.log(`   ✓ Backfilled ${validatedUpdate} VALIDATED transactions`)

    const exceptionUpdate = await prisma.$executeRawUnsafe(`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', false,
        'violations', COALESCE(
          (SELECT jsonb_agg(violation)
           FROM (
             SELECT jsonb_build_object(
               'code', CASE
                 WHEN "receiptUrl" IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 'MISSING_RECEIPT'
                 WHEN "approvalReason" LIKE '%threshold%' THEN 'THRESHOLD_BREACH'
                 WHEN "approvalReason" LIKE '%envelope%cap%' THEN 'ENVELOPE_CAP_EXCEEDED'
                 WHEN "approvalReason" LIKE '%budget%' THEN 'CATEGORY_OVER_LIMIT'
                 ELSE 'REQUIRES_REVIEW'
               END,
               'severity', 'ERROR',
               'message', COALESCE(
                 "approvalReason",
                 "exceptionReason",
                 CASE
                   WHEN "receiptUrl" IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 'Receipt required for expenses \\$100 or more'
                   ELSE 'Transaction requires manual review'
                 END
               )
             ) AS violation
             WHERE "approvalReason" IS NOT NULL OR "exceptionReason" IS NOT NULL
                OR ("receiptUrl" IS NULL AND amount >= 100 AND type = 'EXPENSE')
           ) v),
          '[]'::jsonb
        ),
        'score', CASE
          WHEN "receiptUrl" IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 60
          ELSE 70
        END,
        'validatedAt', COALESCE("updatedAt", "createdAt")::text,
        'checksRun', jsonb_build_object(
          'budget', true,
          'receipt', true,
          'category', true,
          'envelope', true,
          'threshold', true,
          'associationRules', false,
          'dates', true,
          'vendor', false,
          'duplicates', false
        ),
        'legacyStatus', 'PENDING_OR_REJECTED',
        'backfilled', true,
        'backfilledAt', NOW()::text
      )
      WHERE status = 'EXCEPTION' AND validation_json IS NULL
    `)
    console.log(`   ✓ Backfilled ${exceptionUpdate} EXCEPTION transactions`)

    const resolvedUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', false,
        'violations', jsonb_build_array(
          jsonb_build_object(
            'code', 'RESOLVED_EXCEPTION',
            'severity', 'INFO',
            'message', COALESCE("approvalReason", 'Previously required manual approval')
          )
        ),
        'score', 85,
        'validatedAt', COALESCE("updatedAt", "createdAt")::text,
        'checksRun', jsonb_build_object(
          'budget', true,
          'receipt', true,
          'category', true,
          'envelope', true,
          'threshold', true,
          'associationRules', false,
          'dates', true,
          'vendor', false,
          'duplicates', false
        ),
        'legacyStatus', 'APPROVED',
        'backfilled', true,
        'backfilledAt', NOW()::text
      ),
      resolution_json = jsonb_build_object(
        'type', 'OVERRIDE',
        'resolvedBy', "createdBy",
        'resolvedAt', COALESCE("updatedAt", "createdAt")::text,
        'reason', 'Migrated from legacy approval system',
        'notes', COALESCE("approvalReason", 'Previously manually approved'),
        'legacyApproval', true
      )
      WHERE status = 'RESOLVED' AND validation_json IS NULL
    `
    console.log(`   ✓ Backfilled ${resolvedUpdate} RESOLVED transactions`)

    const receiptUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET receipt_status = CASE
        WHEN "receiptUrl" IS NOT NULL THEN 'ATTACHED'::\"ReceiptStatus\"
        WHEN type = 'EXPENSE' AND amount >= 100 AND "receiptUrl" IS NULL THEN 'REQUIRED_MISSING'::\"ReceiptStatus\"
        ELSE 'NONE'::\"ReceiptStatus\"
      END
      WHERE receipt_status = 'NONE' OR receipt_status IS NULL
    `
    console.log(`   ✓ Updated receipt_status for ${receiptUpdate} transactions`)

    const severityUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET exception_severity = CASE
        WHEN amount >= 1000 THEN 'CRITICAL'::\"ExceptionSeverity\"
        WHEN amount >= 500 THEN 'HIGH'::\"ExceptionSeverity\"
        WHEN amount >= 200 THEN 'MEDIUM'::\"ExceptionSeverity\"
        ELSE 'LOW'::\"ExceptionSeverity\"
      END
      WHERE status = 'EXCEPTION' AND exception_severity IS NULL
    `
    console.log(`   ✓ Set exception_severity for ${severityUpdate} transactions`)

    console.log('\n🔄 Re-enabling trigger...\n')
    await prisma.$executeRaw`ALTER TABLE transactions ENABLE TRIGGER trigger_log_validation_changes`

    console.log('✅ Backfill complete!\n')

  } catch (error) {
    console.error('❌ Error:', error)
    // Try to re-enable trigger even if backfill failed
    try {
      await prisma.$executeRaw`ALTER TABLE transactions ENABLE TRIGGER trigger_log_validation_changes`
    } catch (e) {
      console.error('Failed to re-enable trigger:', e)
    }
  } finally {
    await prisma.$disconnect()
  }
}

backfill()
