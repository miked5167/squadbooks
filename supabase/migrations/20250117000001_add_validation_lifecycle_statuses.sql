-- Migration: Add new transaction lifecycle statuses
-- Purpose: Extend TransactionStatus enum to support validation-first workflow
-- Date: 2025-01-17
-- Safe: Yes (adds enum values, doesn't remove existing ones)

-- Add new status values to the existing enum
-- Note: In PostgreSQL, you cannot remove enum values, only add them
-- This is backward compatible with existing data

ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'IMPORTED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'VALIDATED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'EXCEPTION';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'RESOLVED';
ALTER TYPE "TransactionStatus" ADD VALUE IF NOT EXISTS 'LOCKED';

-- Comment explaining the status meanings
COMMENT ON TYPE "TransactionStatus" IS 'Transaction lifecycle statuses:
IMPORTED - Bank feed import, needs categorization/validation
VALIDATED - Passes all compliance checks
EXCEPTION - Fails validation rules, needs review
RESOLVED - Exception addressed (corrected or overridden)
LOCKED - Season closed, immutable
DRAFT - Manual entry in progress (legacy)
PENDING - Awaiting approval (legacy)
APPROVED - Manually approved (legacy)
APPROVED_AUTOMATIC - Auto-approved via envelope/threshold (legacy)
REJECTED - Denied (legacy)';
