-- Rename column pendingApprovals to pendingReviews in team_financial_snapshots table
-- Part of terminology update from "approval" to "review/validation" workflow

ALTER TABLE team_financial_snapshots
RENAME COLUMN pending_approvals TO pending_reviews;

-- Add comment to document the change
COMMENT ON COLUMN team_financial_snapshots.pending_reviews IS 'Number of transactions pending review (formerly pending_approvals)';
