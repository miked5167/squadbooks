-- CreateTable
CREATE TABLE "spend_intent_approvals" (
    "id" TEXT NOT NULL,
    "spend_intent_id" TEXT NOT NULL,
    "approver_user_id" TEXT NOT NULL,
    "is_independent_parent_rep" BOOLEAN NOT NULL,
    "note" TEXT,
    "approved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spend_intent_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "spend_intent_approvals_spend_intent_id_idx" ON "spend_intent_approvals"("spend_intent_id");

-- CreateIndex
CREATE INDEX "spend_intent_approvals_approver_user_id_idx" ON "spend_intent_approvals"("approver_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "spend_intent_approvals_spend_intent_id_approver_user_id_key" ON "spend_intent_approvals"("spend_intent_id", "approver_user_id");

-- AddForeignKey
ALTER TABLE "spend_intent_approvals" ADD CONSTRAINT "spend_intent_approvals_spend_intent_id_fkey" FOREIGN KEY ("spend_intent_id") REFERENCES "spend_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_intent_approvals" ADD CONSTRAINT "spend_intent_approvals_approver_user_id_fkey" FOREIGN KEY ("approver_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
