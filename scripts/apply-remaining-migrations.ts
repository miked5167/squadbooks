/**
 * Apply remaining migrations 2-5 to staging database
 */
import { prisma } from '../lib/prisma'
import fs from 'fs'
import path from 'path'

async function applyMigrations() {
  try {
    console.log('🔄 Applying Migration 2: Add validation tracking columns\n')

    // Migration 2 - broken into individual statements
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "ExceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "ReceiptStatus" AS ENUM ('NONE', 'ATTACHED', 'REQUIRED_MISSING');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `

    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS validation_json JSONB DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exception_severity "ExceptionSeverity" DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS resolution_json JSONB DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS receipt_status "ReceiptStatus" DEFAULT 'NONE'`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS exception_reason TEXT DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS resolved_by TEXT DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL`
    await prisma.$executeRaw`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS override_justification TEXT DEFAULT NULL`

    console.log('✅ Migration 2 complete\n')

    console.log('🔄 Applying Migration 3: Add indexes\n')

    // Migration 3 - Indexes (note: CONCURRENTLY doesn't work in transactions, so we'll use regular CREATE INDEX)
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_team_status_exception ON transactions(team_id, status) WHERE status = 'EXCEPTION'`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_exception_severity ON transactions(exception_severity, created_at DESC) WHERE exception_severity IS NOT NULL`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_validation_compliant ON transactions((validation_json->>'compliant')) WHERE validation_json IS NOT NULL`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_validation_violations ON transactions USING GIN ((validation_json->'violations'))`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_receipt_status ON transactions(receipt_status, created_at DESC) WHERE receipt_status = 'REQUIRED_MISSING'`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_resolved ON transactions(resolved_at DESC) WHERE resolved_at IS NOT NULL`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_team_exception_date ON transactions(team_id, status, created_at DESC) WHERE status IN ('EXCEPTION', 'RESOLVED')`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_locked ON transactions(team_id, status) WHERE status = 'LOCKED'`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_imported ON transactions(team_id, created_at DESC) WHERE status = 'IMPORTED'`
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS idx_transactions_high_value_exceptions ON transactions(team_id, amount DESC, created_at DESC) WHERE status = 'EXCEPTION' AND amount >= 200`

    console.log('✅ Migration 3 complete\n')

    console.log('🔄 Applying Migration 4: Audit log trigger\n')

    // Migration 4 - Audit trigger function
    const auditFunction = `
      CREATE OR REPLACE FUNCTION log_transaction_validation_change()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('VALIDATED', 'EXCEPTION', 'RESOLVED', 'LOCKED'))
           OR (OLD.validation_json IS DISTINCT FROM NEW.validation_json)
           OR (OLD.resolution_json IS DISTINCT FROM NEW.resolution_json)
           OR (OLD.exception_severity IS DISTINCT FROM NEW.exception_severity)
        THEN
          INSERT INTO audit_logs (
            team_id, user_id, action, entity_type, entity_id,
            old_values, new_values, metadata, created_at
          ) VALUES (
            NEW.team_id,
            COALESCE(NEW.resolved_by, NEW.created_by, 'SYSTEM'),
            CASE
              WHEN OLD.status != NEW.status AND NEW.status = 'VALIDATED' THEN 'VALIDATE_TRANSACTION'
              WHEN OLD.status != NEW.status AND NEW.status = 'EXCEPTION' THEN 'FLAG_EXCEPTION'
              WHEN OLD.status != NEW.status AND NEW.status = 'RESOLVED' THEN 'RESOLVE_EXCEPTION'
              WHEN OLD.status != NEW.status AND NEW.status = 'LOCKED' THEN 'LOCK_TRANSACTION'
              WHEN OLD.resolution_json IS DISTINCT FROM NEW.resolution_json THEN 'OVERRIDE_EXCEPTION'
              ELSE 'UPDATE_TRANSACTION_VALIDATION'
            END,
            'TRANSACTION',
            NEW.id,
            jsonb_build_object(
              'status', OLD.status,
              'validation_json', OLD.validation_json,
              'resolution_json', OLD.resolution_json,
              'exception_severity', OLD.exception_severity
            ),
            jsonb_build_object(
              'status', NEW.status,
              'validation_json', NEW.validation_json,
              'resolution_json', NEW.resolution_json,
              'exception_severity', NEW.exception_severity
            ),
            jsonb_build_object(
              'vendor', NEW.vendor,
              'amount', NEW.amount,
              'category_id', NEW.category_id,
              'transaction_date', NEW.transaction_date,
              'resolution_type', CASE
                WHEN NEW.resolution_json IS NOT NULL THEN NEW.resolution_json->>'type'
                ELSE NULL
              END,
              'violation_count', CASE
                WHEN NEW.validation_json IS NOT NULL THEN jsonb_array_length(NEW.validation_json->'violations')
                ELSE NULL
              END
            ),
            NOW()
          );
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `

    await prisma.$executeRawUnsafe(auditFunction)

    await prisma.$executeRaw`DROP TRIGGER IF EXISTS trigger_log_validation_changes ON transactions`
    await prisma.$executeRaw`
      CREATE TRIGGER trigger_log_validation_changes
        AFTER UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION log_transaction_validation_change()
    `

    console.log('✅ Migration 4 complete\n')

    console.log('🔄 Applying Migration 5: Backfill validation data\n')

    // Migration 5 - Backfill (Step 1: Map statuses)
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
    console.log(`   Updated ${statusUpdate} transaction statuses`)

    // Step 2: Validated transactions
    const validatedUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', true,
        'violations', '[]'::jsonb,
        'score', 100,
        'validatedAt', COALESCE(updated_at, created_at)::text,
        'checksRun', jsonb_build_object(
          'budget', false,
          'receipt', CASE WHEN receipt_url IS NOT NULL THEN true ELSE false END,
          'category', CASE WHEN category_id IS NOT NULL THEN true ELSE false END,
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
    console.log(`   Backfilled ${validatedUpdate} VALIDATED transactions`)

    // Step 3: Exception transactions
    const exceptionUpdate = await prisma.$executeRawUnsafe(`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', false,
        'violations', COALESCE(
          (SELECT jsonb_agg(violation)
           FROM (
             SELECT jsonb_build_object(
               'code', CASE
                 WHEN receipt_url IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 'MISSING_RECEIPT'
                 WHEN approval_reason LIKE '%threshold%' THEN 'THRESHOLD_BREACH'
                 WHEN approval_reason LIKE '%envelope%cap%' THEN 'ENVELOPE_CAP_EXCEEDED'
                 WHEN approval_reason LIKE '%budget%' THEN 'CATEGORY_OVER_LIMIT'
                 ELSE 'REQUIRES_REVIEW'
               END,
               'severity', 'ERROR',
               'message', COALESCE(
                 approval_reason,
                 exception_reason,
                 CASE
                   WHEN receipt_url IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 'Receipt required for expenses $100 or more'
                   ELSE 'Transaction requires manual review'
                 END
               )
             ) AS violation
             WHERE approval_reason IS NOT NULL OR exception_reason IS NOT NULL
                OR (receipt_url IS NULL AND amount >= 100 AND type = 'EXPENSE')
           ) v),
          '[]'::jsonb
        ),
        'score', CASE
          WHEN receipt_url IS NULL AND amount >= 100 AND type = 'EXPENSE' THEN 60
          ELSE 70
        END,
        'validatedAt', COALESCE(updated_at, created_at)::text,
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
    console.log(`   Backfilled ${exceptionUpdate} EXCEPTION transactions`)

    // Step 4: Resolved transactions
    const resolvedUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET validation_json = jsonb_build_object(
        'compliant', false,
        'violations', jsonb_build_array(
          jsonb_build_object(
            'code', 'RESOLVED_EXCEPTION',
            'severity', 'INFO',
            'message', COALESCE(approval_reason, 'Previously required manual approval')
          )
        ),
        'score', 85,
        'validatedAt', COALESCE(updated_at, created_at)::text,
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
        'resolvedBy', created_by,
        'resolvedAt', COALESCE(updated_at, created_at)::text,
        'reason', 'Migrated from legacy approval system',
        'notes', COALESCE(approval_reason, 'Previously manually approved'),
        'legacyApproval', true
      )
      WHERE status = 'RESOLVED' AND validation_json IS NULL
    `
    console.log(`   Backfilled ${resolvedUpdate} RESOLVED transactions`)

    // Step 5: Receipt status
    const receiptUpdate = await prisma.$executeRaw`
      UPDATE transactions
      SET receipt_status = CASE
        WHEN receipt_url IS NOT NULL THEN 'ATTACHED'::\"ReceiptStatus\"
        WHEN type = 'EXPENSE' AND amount >= 100 AND receipt_url IS NULL THEN 'REQUIRED_MISSING'::\"ReceiptStatus\"
        ELSE 'NONE'::\"ReceiptStatus\"
      END
      WHERE receipt_status = 'NONE' OR receipt_status IS NULL
    `
    console.log(`   Updated receipt_status for ${receiptUpdate} transactions`)

    // Step 6: Exception severity
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
    console.log(`   Set exception_severity for ${severityUpdate} transactions`)

    console.log('✅ Migration 5 complete\n')

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL MIGRATIONS COMPLETED!')
    console.log('='.repeat(60) + '\n')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

applyMigrations()
