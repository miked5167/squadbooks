-- Add payee_user_id to spend_intents
ALTER TABLE "spend_intents" ADD COLUMN IF NOT EXISTS "payee_user_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "spend_intents" ADD CONSTRAINT "spend_intents_payee_user_id_fkey"
FOREIGN KEY ("payee_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS "spend_intents_payee_user_id_idx" ON "spend_intents"("payee_user_id");
