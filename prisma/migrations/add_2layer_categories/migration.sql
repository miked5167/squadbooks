-- ============================================
-- 2-LAYER CATEGORY MODEL MIGRATION
-- ============================================

-- Step 1: Create DisplayCategory table
CREATE TABLE "display_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EXPENSE_ROLLUP',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "display_categories_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create SystemCategory table
CREATE TABLE "system_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "displayCategoryId" TEXT,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    "isDiscouraged" BOOLEAN NOT NULL DEFAULT false,
    "preauthEligible" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_categories_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add indexes to new tables
CREATE UNIQUE INDEX "display_categories_slug_key" ON "display_categories"("slug");
CREATE UNIQUE INDEX "system_categories_slug_key" ON "system_categories"("slug");
CREATE INDEX "system_categories_displayCategoryId_idx" ON "system_categories"("displayCategoryId");
CREATE INDEX "system_categories_type_idx" ON "system_categories"("type");
CREATE INDEX "system_categories_slug_idx" ON "system_categories"("slug");

-- Step 4: Add foreign key constraint
ALTER TABLE "system_categories" ADD CONSTRAINT "system_categories_displayCategoryId_fkey"
    FOREIGN KEY ("displayCategoryId") REFERENCES "display_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add systemCategoryId to existing tables
ALTER TABLE "budget_allocations" ADD COLUMN "systemCategoryId" TEXT;
ALTER TABLE "transactions" ADD COLUMN "systemCategoryId" TEXT;
ALTER TABLE "pre_season_allocations" ADD COLUMN "systemCategoryId" TEXT;
ALTER TABLE "budget_envelopes" ADD COLUMN "systemCategoryId" TEXT;

-- Step 6: Create indexes for new foreign keys
CREATE INDEX "budget_allocations_systemCategoryId_idx" ON "budget_allocations"("systemCategoryId");
CREATE INDEX "transactions_systemCategoryId_idx" ON "transactions"("systemCategoryId");
CREATE INDEX "pre_season_allocations_systemCategoryId_idx" ON "pre_season_allocations"("systemCategoryId");
CREATE INDEX "budget_envelopes_systemCategoryId_idx" ON "budget_envelopes"("systemCategoryId");
