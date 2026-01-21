-- Migration: Budget Versioning and Approval Workflow
-- Description: Implements complete budget lifecycle with versioning, parent approvals, and threshold-based locking

-- Create enums for budget workflow
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'REVIEW', 'TEAM_APPROVED', 'PRESENTED', 'APPROVED', 'LOCKED');
CREATE TYPE "ThresholdMode" AS ENUM ('COUNT', 'PERCENT');

-- Create budgets table (main budget entity)
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "presentedVersionNumber" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMPTZ,
    "lockedBy" TEXT,

    CONSTRAINT "budgets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "budgets_teamId_season_key" ON "budgets"("teamId", "season");
CREATE INDEX "budgets_teamId_idx" ON "budgets"("teamId");
CREATE INDEX "budgets_status_idx" ON "budgets"("status");
CREATE INDEX "budgets_season_idx" ON "budgets"("season");

-- Create budget threshold configs table
CREATE TABLE "budget_threshold_configs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL UNIQUE,
    "mode" "ThresholdMode" NOT NULL DEFAULT 'PERCENT',
    "countThreshold" INTEGER,
    "percentThreshold" DECIMAL(5,2),
    "eligibleFamilyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_threshold_configs_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE
);

-- Create budget versions table
CREATE TABLE "budget_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "totalBudget" DECIMAL(10,2) NOT NULL,
    "changeSummary" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachApprovedAt" TIMESTAMPTZ,
    "coachApprovedBy" TEXT,
    "coachNotes" TEXT,

    CONSTRAINT "budget_versions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "budget_versions_budgetId_versionNumber_key" ON "budget_versions"("budgetId", "versionNumber");
CREATE INDEX "budget_versions_budgetId_idx" ON "budget_versions"("budgetId");
CREATE INDEX "budget_versions_versionNumber_idx" ON "budget_versions"("versionNumber");

-- Create budget version approvals table
CREATE TABLE "budget_version_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetVersionId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedBy" TEXT NOT NULL,
    "comment" TEXT,
    "hasQuestions" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "budget_version_approvals_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE,
    CONSTRAINT "budget_version_approvals_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "budget_version_approvals_budgetVersionId_familyId_key" ON "budget_version_approvals"("budgetVersionId", "familyId");
CREATE INDEX "budget_version_approvals_budgetVersionId_idx" ON "budget_version_approvals"("budgetVersionId");
CREATE INDEX "budget_version_approvals_familyId_idx" ON "budget_version_approvals"("familyId");
CREATE INDEX "budget_version_approvals_acknowledgedAt_idx" ON "budget_version_approvals"("acknowledgedAt");

-- Migrate existing budget_allocations table
-- First, backup existing data if any exists
CREATE TABLE "budget_allocations_backup" AS SELECT * FROM "budget_allocations";

-- Drop old constraints and indexes
ALTER TABLE "budget_allocations" DROP CONSTRAINT IF EXISTS "budget_allocations_teamId_fkey";
ALTER TABLE "budget_allocations" DROP CONSTRAINT IF EXISTS "budget_allocations_categoryId_fkey";
DROP INDEX IF EXISTS "budget_allocations_teamId_categoryId_season_key";
DROP INDEX IF EXISTS "budget_allocations_teamId_idx";
DROP INDEX IF EXISTS "budget_allocations_categoryId_idx";

-- Rename/restructure budget_allocations
ALTER TABLE "budget_allocations" RENAME TO "budget_allocations_old";

-- Create new budget_allocations table
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetVersionId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "allocated" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_allocations_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE,
    CONSTRAINT "budget_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id")
);

CREATE UNIQUE INDEX "budget_allocations_budgetVersionId_categoryId_key" ON "budget_allocations"("budgetVersionId", "categoryId");
CREATE INDEX "budget_allocations_budgetVersionId_idx" ON "budget_allocations"("budgetVersionId");
CREATE INDEX "budget_allocations_categoryId_idx" ON "budget_allocations"("categoryId");

-- Add table comments
COMMENT ON TABLE "budgets" IS 'Main budget entity tracking overall budget lifecycle for a team season';
COMMENT ON TABLE "budget_versions" IS 'Version history of budgets - each edit creates a new version';
COMMENT ON TABLE "budget_version_approvals" IS 'Parent/family approvals for specific budget versions';
COMMENT ON TABLE "budget_threshold_configs" IS 'Threshold configuration for automatic budget locking';
