-- Migration: Extend audit log to track validation events
-- Purpose: Capture validation state changes, exception resolutions, and overrides
-- Date: 2025-01-17
-- Safe: Yes (extends existing audit system)

-- Check if audit_logs table exists, if not create it
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add index for audit log queries if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_team_action
ON audit_logs(team_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
ON audit_logs(entity_type, entity_id, created_at DESC);

-- Create function to automatically log validation state changes
CREATE OR REPLACE FUNCTION log_transaction_validation_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if validation-related fields change
  IF (OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('VALIDATED', 'EXCEPTION', 'RESOLVED', 'LOCKED'))
     OR (OLD.validation_json IS DISTINCT FROM NEW.validation_json)
     OR (OLD.resolution_json IS DISTINCT FROM NEW.resolution_json)
     OR (OLD.exception_severity IS DISTINCT FROM NEW.exception_severity)
  THEN
    INSERT INTO audit_logs (
      team_id,
      user_id,
      action,
      entity_type,
      entity_id,
      old_values,
      new_values,
      metadata,
      created_at
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

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS trigger_log_validation_changes ON transactions;

CREATE TRIGGER trigger_log_validation_changes
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION log_transaction_validation_change();

-- Add comments
COMMENT ON FUNCTION log_transaction_validation_change IS 'Automatically logs validation state changes, exception resolutions, and overrides to audit_logs';
COMMENT ON TRIGGER trigger_log_validation_changes ON transactions IS 'Triggers audit logging when validation-related fields change';
