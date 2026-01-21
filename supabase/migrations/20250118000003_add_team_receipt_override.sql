-- Add team receipt override to team_settings table
ALTER TABLE team_settings
  ADD COLUMN receipt_global_threshold_override_cents INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN team_settings.receipt_global_threshold_override_cents IS 'Team-specific stricter receipt threshold in cents (must be <= association threshold)';

-- Add constraint to ensure team threshold is positive if set
ALTER TABLE team_settings
  ADD CONSTRAINT check_team_receipt_threshold_positive
  CHECK (receipt_global_threshold_override_cents IS NULL OR receipt_global_threshold_override_cents >= 0);
