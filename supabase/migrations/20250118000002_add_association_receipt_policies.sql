-- Add receipt policy fields to associations table
ALTER TABLE associations
  ADD COLUMN receipts_enabled BOOLEAN DEFAULT true,
  ADD COLUMN receipt_global_threshold_cents INTEGER DEFAULT 10000,
  ADD COLUMN receipt_grace_period_days INTEGER DEFAULT 7,
  ADD COLUMN receipt_category_thresholds_enabled BOOLEAN DEFAULT false,
  ADD COLUMN receipt_category_overrides JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN allowed_team_threshold_override BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN associations.receipts_enabled IS 'Master toggle for receipt policy enforcement';
COMMENT ON COLUMN associations.receipt_global_threshold_cents IS 'Default receipt threshold in cents for all expenses (e.g., 10000 = $100)';
COMMENT ON COLUMN associations.receipt_grace_period_days IS 'Number of days before marking missing receipt as exception';
COMMENT ON COLUMN associations.receipt_category_thresholds_enabled IS 'Enable category-specific receipt thresholds';
COMMENT ON COLUMN associations.receipt_category_overrides IS 'Category-specific overrides: { categoryId: { thresholdCents?: number, exempt?: boolean } }';
COMMENT ON COLUMN associations.allowed_team_threshold_override IS 'Allow teams to set stricter (lower) receipt thresholds';

-- Create index for JSONB operations
CREATE INDEX idx_associations_receipt_category_overrides ON associations USING gin (receipt_category_overrides);
