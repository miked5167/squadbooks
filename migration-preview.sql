-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'PARENT', 'AUDITOR');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "SeasonClosureStatus" AS ENUM ('DRAFT', 'VALIDATING', 'READY', 'SUBMITTED', 'ACKNOWLEDGED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "associations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "abbreviation" VARCHAR(32),
    "province_state" VARCHAR(64),
    "country" VARCHAR(64),
    "logo_url" VARCHAR(500),
    "season" VARCHAR(32),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "associations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "clerk_user_id" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "role" VARCHAR(32) NOT NULL,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "association_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_teams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "team_id" TEXT,
    "team_name" VARCHAR(255) NOT NULL,
    "division" VARCHAR(64),
    "season" VARCHAR(32),
    "api_access_token" TEXT,
    "token_expires_at" TIMESTAMPTZ,
    "connected_at" TIMESTAMPTZ,
    "last_synced_at" TIMESTAMPTZ,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "treasurer_name" VARCHAR(255),
    "treasurer_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "association_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_financial_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_team_id" UUID NOT NULL,
    "snapshot_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "health_status" VARCHAR(16) NOT NULL,
    "health_score" INTEGER,
    "budget_total" DECIMAL(10,2),
    "spent" DECIMAL(10,2),
    "remaining" DECIMAL(10,2),
    "percent_used" DECIMAL(5,2),
    "pending_approvals" INTEGER,
    "missing_receipts" INTEGER,
    "bank_reconciled_through" DATE,
    "bank_connected" BOOLEAN,
    "last_activity_at" TIMESTAMPTZ,
    "red_flags" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_financial_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "association_team_id" UUID NOT NULL,
    "alert_type" VARCHAR(64) NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" UUID,
    "last_triggered_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "generated_by" UUID NOT NULL,
    "report_type" VARCHAR(32) NOT NULL,
    "date_range_start" DATE,
    "date_range_end" DATE,
    "file_url" VARCHAR(500),
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dashboard_config" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "budget_warning_pct" DECIMAL(5,2) NOT NULL DEFAULT 80.0,
    "budget_critical_pct" DECIMAL(5,2) NOT NULL DEFAULT 95.0,
    "bank_warning_days" INTEGER NOT NULL DEFAULT 30,
    "bank_critical_days" INTEGER NOT NULL DEFAULT 60,
    "approvals_warning_count" INTEGER NOT NULL DEFAULT 5,
    "approvals_critical_count" INTEGER NOT NULL DEFAULT 10,
    "inactivity_warning_days" INTEGER NOT NULL DEFAULT 21,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "dashboard_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "budgetTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "primaryEmail" TEXT NOT NULL,
    "secondaryEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'PARENT',
    "teamId" TEXT NOT NULL,
    "association_user_id" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "heading" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "type" "CategoryType" NOT NULL DEFAULT 'EXPENSE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(10,2) NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "receiptPath" TEXT,
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approvals" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "approvedBy" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "approvedAt" TIMESTAMP(3),
    "teamId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "allocated" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" "BankAccountType" NOT NULL,
    "lastFour" TEXT NOT NULL,
    "currentBalance" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_transactions" (
    "id" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "transactionId" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exports" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "reportType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "season_closures" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" "SeasonClosureStatus" NOT NULL DEFAULT 'DRAFT',
    "budgetBalanced" BOOLEAN NOT NULL DEFAULT false,
    "allTransactionsApproved" BOOLEAN NOT NULL DEFAULT false,
    "allReceiptsPresent" BOOLEAN NOT NULL DEFAULT false,
    "bankReconciled" BOOLEAN NOT NULL DEFAULT false,
    "totalIncome" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalExpenses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "finalBalance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "policySnapshot" JSONB,
    "associationEmail" TEXT,
    "submittedAt" TIMESTAMP(3),
    "submittedBy" TEXT,
    "packageUrl" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_closures_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "association_users_clerk_user_id_key" ON "association_users"("clerk_user_id");

-- CreateIndex
CREATE INDEX "association_teams_team_id_idx" ON "association_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "association_teams_team_id_key" ON "association_teams"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "association_teams_association_id_team_id_key" ON "association_teams"("association_id", "team_id");

-- CreateIndex
CREATE INDEX "idx_snapshots_team_time" ON "team_financial_snapshots"("association_team_id", "snapshot_at" DESC);

-- CreateIndex
CREATE INDEX "idx_alerts_active" ON "alerts"("association_id", "status", "severity", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "alerts_association_team_id_alert_type_status_key" ON "alerts"("association_team_id", "alert_type", "status");

-- CreateIndex
CREATE INDEX "idx_reports_association_type_time" ON "reports"("association_id", "report_type", "generated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "dashboard_config_association_id_key" ON "dashboard_config"("association_id");

-- CreateIndex
CREATE INDEX "families_teamId_idx" ON "families"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkId_key" ON "users"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_teamId_idx" ON "users"("teamId");

-- CreateIndex
CREATE INDEX "users_clerkId_idx" ON "users"("clerkId");

-- CreateIndex
CREATE INDEX "users_association_user_id_idx" ON "users"("association_user_id");

-- CreateIndex
CREATE INDEX "categories_teamId_idx" ON "categories"("teamId");

-- CreateIndex
CREATE INDEX "transactions_teamId_idx" ON "transactions"("teamId");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE INDEX "transactions_createdBy_idx" ON "transactions"("createdBy");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "approvals_transactionId_idx" ON "approvals"("transactionId");

-- CreateIndex
CREATE INDEX "approvals_approvedBy_idx" ON "approvals"("approvedBy");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "approvals_teamId_idx" ON "approvals"("teamId");

-- CreateIndex
CREATE INDEX "budget_allocations_teamId_idx" ON "budget_allocations"("teamId");

-- CreateIndex
CREATE INDEX "budget_allocations_categoryId_idx" ON "budget_allocations"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "budget_allocations_teamId_categoryId_season_key" ON "budget_allocations"("teamId", "categoryId", "season");

-- CreateIndex
CREATE INDEX "audit_logs_teamId_idx" ON "audit_logs"("teamId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "bank_accounts_teamId_idx" ON "bank_accounts"("teamId");

-- CreateIndex
CREATE INDEX "bank_transactions_bankAccountId_idx" ON "bank_transactions"("bankAccountId");

-- CreateIndex
CREATE INDEX "bank_transactions_date_idx" ON "bank_transactions"("date");

-- CreateIndex
CREATE INDEX "exports_teamId_idx" ON "exports"("teamId");

-- CreateIndex
CREATE INDEX "exports_userId_idx" ON "exports"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_teamId_idx" ON "invitations"("teamId");

-- CreateIndex
CREATE INDEX "invitations_email_idx" ON "invitations"("email");

-- CreateIndex
CREATE INDEX "invitations_token_idx" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "season_closures_teamId_idx" ON "season_closures"("teamId");

-- CreateIndex
CREATE INDEX "season_closures_status_idx" ON "season_closures"("status");

-- CreateIndex
CREATE UNIQUE INDEX "season_closures_teamId_season_key" ON "season_closures"("teamId", "season");

-- AddForeignKey
ALTER TABLE "association_users" ADD CONSTRAINT "association_users_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_teams" ADD CONSTRAINT "association_teams_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_teams" ADD CONSTRAINT "association_teams_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_financial_snapshots" ADD CONSTRAINT "team_financial_snapshots_association_team_id_fkey" FOREIGN KEY ("association_team_id") REFERENCES "association_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_association_team_id_fkey" FOREIGN KEY ("association_team_id") REFERENCES "association_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "association_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "association_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_config" ADD CONSTRAINT "dashboard_config_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_association_user_id_fkey" FOREIGN KEY ("association_user_id") REFERENCES "association_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_transactions" ADD CONSTRAINT "bank_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exports" ADD CONSTRAINT "exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_closures" ADD CONSTRAINT "season_closures_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_closures" ADD CONSTRAINT "season_closures_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

