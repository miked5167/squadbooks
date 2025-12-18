-- Migration: Add indexes for validation and exception querying
-- Purpose: Optimize queries for exception dashboard, validation reports, and filtering
-- Date: 2025-01-17
-- Safe: Yes (indexes can be created concurrently)

-- Index for finding exceptions by team (exception dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_status_exception
ON transactions(team_id, status)
WHERE status = 'EXCEPTION';

-- Index for finding exceptions by severity (triage queue)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_exception_severity
ON transactions(exception_severity, created_at DESC)
WHERE exception_severity IS NOT NULL;

-- Index for validation compliance filtering (reports)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_validation_compliant
ON transactions((validation_json->>'compliant'))
WHERE validation_json IS NOT NULL;

-- GIN index for searching violations by code (analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_validation_violations
ON transactions USING GIN ((validation_json->'violations'));

-- Index for receipt compliance queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_receipt_status
ON transactions(receipt_status, created_at DESC)
WHERE receipt_status = 'REQUIRED_MISSING';

-- Index for resolved exceptions (audit trail)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_resolved
ON transactions(resolved_at DESC)
WHERE resolved_at IS NOT NULL;

-- Composite index for team-based exception filtering with date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_team_exception_date
ON transactions(team_id, status, created_at DESC)
WHERE status IN ('EXCEPTION', 'RESOLVED');

-- Index for locked transactions (season closure)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_locked
ON transactions(team_id, status)
WHERE status = 'LOCKED';

-- Index for imported transactions awaiting validation (bank sync dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_imported
ON transactions(team_id, created_at DESC)
WHERE status = 'IMPORTED';

-- Partial index for high-value exceptions (prioritization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_high_value_exceptions
ON transactions(team_id, amount DESC, created_at DESC)
WHERE status = 'EXCEPTION' AND amount >= 200;

-- Comment explaining index strategy
COMMENT ON INDEX idx_transactions_team_status_exception IS 'Optimizes exception dashboard queries filtering by team and status';
COMMENT ON INDEX idx_transactions_exception_severity IS 'Optimizes exception triage queue ordered by severity and recency';
COMMENT ON INDEX idx_transactions_validation_compliant IS 'Optimizes compliance reporting and analytics';
