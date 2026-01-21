-- Migration: Backfill validation data for existing transactions
-- Purpose: Populate validation_json and map legacy statuses to new lifecycle
-- Date: 2025-01-17
-- WARNING: This migration updates existing data. Review carefully before running.
-- Safe: Yes (updates only NULL values, preserves existing data)

-- Step 1: Map legacy statuses to new validation-first statuses
-- Logic:
--   APPROVED_AUTOMATIC → VALIDATED (was auto-approved, passed implicit validation)
--   PENDING → EXCEPTION (requires review = failed validation or needs approval)
--   APPROVED → RESOLVED (was manually reviewed and approved = exception resolved)
--   REJECTED → EXCEPTION (was denied, should be in exception state for re-review)
--   DRAFT → keep as DRAFT (user is still editing)

UPDATE transactions
SET status = CASE
  WHEN status = 'APPROVED_AUTOMATIC' THEN 'VALIDATED'
  WHEN status = 'PENDING' THEN 'EXCEPTION'
  WHEN status = 'APPROVED' THEN 'RESOLVED'
  WHEN status = 'REJECTED' THEN 'EXCEPTION'
  ELSE status
END
WHERE status IN ('APPROVED_AUTOMATIC', 'PENDING', 'APPROVED', 'REJECTED');

-- Step 2: Create minimal validation_json for VALIDATED transactions (previously APPROVED_AUTOMATIC)
-- These passed implicit validation (were under threshold or matched envelope)
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
WHERE status = 'VALIDATED' AND validation_json IS NULL;

-- Step 3: Create validation_json for EXCEPTION transactions (previously PENDING or REJECTED)
-- Infer violations based on available data
UPDATE transactions
SET validation_json = jsonb_build_object(
  'compliant', false,
  'violations', (
    SELECT jsonb_agg(violation)
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
        ),
        'metadata', jsonb_build_object(
          'amount', amount,
          'hasReceipt', CASE WHEN receipt_url IS NOT NULL THEN true ELSE false END
        )
      ) AS violation
      WHERE approval_reason IS NOT NULL OR exception_reason IS NOT NULL OR (receipt_url IS NULL AND amount >= 100 AND type = 'EXPENSE')
    ) v
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
  'legacyStatus', CASE WHEN status = 'EXCEPTION' THEN 'PENDING_OR_REJECTED' ELSE 'UNKNOWN' END,
  'backfilled', true,
  'backfilledAt', NOW()::text
)
WHERE status = 'EXCEPTION' AND validation_json IS NULL;

-- Step 4: Create validation_json for RESOLVED transactions (previously APPROVED)
UPDATE transactions
SET validation_json = jsonb_build_object(
  'compliant', false, -- Was exception, then resolved
  'violations', (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'code', 'RESOLVED_EXCEPTION',
          'severity', 'INFO',
          'message', COALESCE(approval_reason, 'Previously required manual approval'),
          'metadata', jsonb_build_object('wasApproved', true)
        )
      ),
      '[]'::jsonb
    )
  ),
  'score', 85, -- Lower score because it was an exception initially
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
WHERE status = 'RESOLVED' AND validation_json IS NULL;

-- Step 5: Set receipt_status based on existing data
UPDATE transactions
SET receipt_status = CASE
  WHEN receipt_url IS NOT NULL THEN 'ATTACHED'
  WHEN type = 'EXPENSE' AND amount >= 100 AND receipt_url IS NULL THEN 'REQUIRED_MISSING'
  ELSE 'NONE'
END
WHERE receipt_status = 'NONE' OR receipt_status IS NULL;

-- Step 6: Calculate exception_severity for EXCEPTION status transactions
UPDATE transactions
SET exception_severity = CASE
  WHEN amount >= 1000 THEN 'CRITICAL'
  WHEN amount >= 500 THEN 'HIGH'
  WHEN amount >= 200 THEN 'MEDIUM'
  ELSE 'LOW'
END
WHERE status = 'EXCEPTION' AND exception_severity IS NULL;

-- Step 7: Set exception_reason from validation_json if not already set
UPDATE transactions
SET exception_reason = (
  SELECT string_agg(v->>'message', '; ')
  FROM jsonb_array_elements(validation_json->'violations') v
  WHERE v->>'severity' IN ('ERROR', 'CRITICAL')
)
WHERE status = 'EXCEPTION'
  AND validation_json IS NOT NULL
  AND exception_reason IS NULL;

-- Add summary comment
COMMENT ON TABLE transactions IS 'Transactions table with validation-first lifecycle. Backfilled on 2025-01-17.';

-- Report migration results
DO $$
DECLARE
  validated_count INTEGER;
  exception_count INTEGER;
  resolved_count INTEGER;
  total_backfilled INTEGER;
BEGIN
  SELECT COUNT(*) INTO validated_count FROM transactions WHERE status = 'VALIDATED';
  SELECT COUNT(*) INTO exception_count FROM transactions WHERE status = 'EXCEPTION';
  SELECT COUNT(*) INTO resolved_count FROM transactions WHERE status = 'RESOLVED';
  SELECT COUNT(*) INTO total_backfilled FROM transactions WHERE validation_json->>'backfilled' = 'true';

  RAISE NOTICE 'Migration complete:';
  RAISE NOTICE '  - VALIDATED transactions: %', validated_count;
  RAISE NOTICE '  - EXCEPTION transactions: %', exception_count;
  RAISE NOTICE '  - RESOLVED transactions: %', resolved_count;
  RAISE NOTICE '  - Total backfilled: %', total_backfilled;
END $$;
