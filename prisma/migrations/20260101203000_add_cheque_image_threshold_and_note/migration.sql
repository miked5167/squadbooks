-- Add cheque image threshold to team_settings
ALTER TABLE "team_settings" ADD COLUMN IF NOT EXISTS "require_cheque_image_threshold_cents" INTEGER NOT NULL DEFAULT 50000;

-- Add note field to cheque_metadata
ALTER TABLE "cheque_metadata" ADD COLUMN IF NOT EXISTS "note" TEXT;
