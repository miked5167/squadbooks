-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "is_whitelisted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendors_team_id_idx" ON "vendors"("team_id");

-- CreateIndex
CREATE INDEX "vendors_is_whitelisted_idx" ON "vendors"("is_whitelisted");

-- CreateIndex
CREATE UNIQUE INDEX "vendors_team_id_name_key" ON "vendors"("team_id", "name");

-- CreateIndex
CREATE INDEX "spend_intents_vendor_id_idx" ON "spend_intents"("vendor_id");

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_intents" ADD CONSTRAINT "spend_intents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
