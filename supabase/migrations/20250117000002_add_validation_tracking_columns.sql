-- Migration: Add validation tracking columns to transactions table
-- Purpose: Store validation results, exception details, and resolution data
-- Date: 2025-01-17
-- Safe: Yes (additive only, nullable columns)

-- Create exception severity enum
DO $$ BEGIN
  CREATE TYPE "ExceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create receipt status enum
DO $$ BEGIN
  CREATE TYPE "ReceiptStatus" AS ENUM ('NONE', 'ATTACHED', 'REQUIRED_MISSING');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add validation_json column to store ValidationResult
-- Schema: { compliant: boolean, violations: Violation[], score?: number, validatedAt: ISO string, checksRun: ValidationChecks }
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS validation_json JSONB DEFAULT NULL;

-- Add exception_severity to quickly filter high-priority exceptions
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS exception_severity "ExceptionSeverity" DEFAULT NULL;

-- Add resolution_json to track manual overrides and corrections
-- Schema: { type: 'REVALIDATE'|'OVERRIDE'|'CORRECT', resolvedBy: string, resolvedAt: ISO string, reason: string, notes: string, correctedFields?: object }
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS resolution_json JSONB DEFAULT NULL;

-- Add receipt_status to track receipt compliance
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS receipt_status "ReceiptStatus" DEFAULT 'NONE';

-- Add computed fields for easier querying (these already exist in schema, but adding for safety)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS exception_reason TEXT DEFAULT NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS resolution_notes TEXT DEFAULT NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS resolved_by TEXT DEFAULT NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS override_justification TEXT DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN transactions.validation_json IS 'ValidationResult: { compliant: boolean, violations: Violation[], score?: number, validatedAt: ISO, checksRun: ValidationChecks }';
COMMENT ON COLUMN transactions.exception_severity IS 'Calculated severity of violations (LOW, MEDIUM, HIGH, CRITICAL) for exception triage';
COMMENT ON COLUMN transactions.resolution_json IS 'Resolution details: { type, resolvedBy, resolvedAt, reason, notes, correctedFields? }';
COMMENT ON COLUMN transactions.receipt_status IS 'Receipt compliance status: NONE (not required), ATTACHED (has receipt), REQUIRED_MISSING (needs receipt)';
