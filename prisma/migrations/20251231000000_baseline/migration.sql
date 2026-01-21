-- CreateEnum
CREATE TYPE "ParentAckMode" AS ENUM ('COUNT', 'PERCENT');

-- CreateEnum
CREATE TYPE "EligibleFamilyDefinition" AS ENUM ('ACTIVE_ROSTER_ONLY', 'ACTIVE_ROSTER_AND_PAID', 'ALL_FAMILIES');

-- CreateEnum
CREATE TYPE "TeamType" AS ENUM ('HOUSE_LEAGUE', 'REPRESENTATIVE', 'ADULT_RECREATIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "AgeDivision" AS ENUM ('U7', 'U9', 'U11', 'U13', 'U15', 'U18', 'OTHER');

-- CreateEnum
CREATE TYPE "CompetitiveLevel" AS ENUM ('AAA', 'AA', 'A', 'BB', 'B', 'MD', 'HOUSE_RECREATIONAL', 'NOT_APPLICABLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportRecipient" AS ENUM ('PARENTS', 'ASSOCIATION', 'BOTH');

-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('RECURRING', 'SPECIFIC_DATES', 'HYBRID');

-- CreateEnum
CREATE TYPE "RecurringFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL');

-- CreateEnum
CREATE TYPE "TeamSeasonState" AS ENUM ('SETUP', 'BUDGET_DRAFT', 'BUDGET_REVIEW', 'TEAM_APPROVED', 'PRESENTED', 'LOCKED', 'ACTIVE', 'CLOSEOUT', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TeamSeasonAction" AS ENUM ('START_BUDGET', 'SUBMIT_BUDGET_FOR_REVIEW', 'REQUEST_BUDGET_CHANGES', 'APPROVE_BUDGET', 'PRESENT_BUDGET', 'PROPOSE_BUDGET_UPDATE', 'LOCK_BUDGET', 'START_SEASON', 'INITIATE_CLOSEOUT', 'FINALIZE_ARCHIVE');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INJURED', 'AP', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_INVITED', 'INVITED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER', 'PARENT', 'AUDITOR');

-- CreateEnum
CREATE TYPE "CategoryType" AS ENUM ('EXPENSE', 'INCOME');

-- CreateEnum
CREATE TYPE "DisplayCategoryType" AS ENUM ('EXPENSE_ROLLUP', 'INCOME_ROLLUP');

-- CreateEnum
CREATE TYPE "SystemCategoryType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'APPROVED_AUTOMATIC', 'IMPORTED', 'VALIDATED', 'EXCEPTION', 'RESOLVED', 'LOCKED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BudgetStatus" AS ENUM ('DRAFT', 'REVIEW', 'TEAM_APPROVED', 'PRESENTED', 'APPROVED', 'LOCKED', 'ASSOCIATION_REVIEW');

-- CreateEnum
CREATE TYPE "ThresholdMode" AS ENUM ('COUNT', 'PERCENT');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('SEASON_WIDE', 'MONTHLY');

-- CreateEnum
CREATE TYPE "VendorMatchType" AS ENUM ('EXACT', 'CONTAINS', 'ANY');

-- CreateEnum
CREATE TYPE "BankAccountType" AS ENUM ('CHECKING', 'SAVINGS');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('CSV', 'PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "SeasonClosureStatus" AS ENUM ('DRAFT', 'VALIDATING', 'READY', 'SUBMITTED', 'ACKNOWLEDGED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BudgetApprovalType" AS ENUM ('INITIAL', 'REPORT');

-- CreateEnum
CREATE TYPE "BudgetApprovalStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PreSeasonBudgetStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'ACTIVATED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExceptionSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('NONE', 'ATTACHED', 'REQUIRED_MISSING');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CHEQUE', 'E_TRANSFER');

-- CreateEnum
CREATE TYPE "AuthorizationType" AS ENUM ('STANDING_BUDGET_AUTHORIZATION', 'MANUAL_SIGNER_APPROVAL');

-- CreateEnum
CREATE TYPE "SpendIntentStatus" AS ENUM ('PROPOSED', 'AUTHORIZATION_PENDING', 'AUTHORIZED', 'ISSUED', 'OUTSTANDING', 'PAID_PENDING_REVIEW', 'SETTLED', 'REVIEWED', 'RECONCILED');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('VERIFIED', 'EXCEPTION', 'ESCALATED');

-- CreateEnum
CREATE TYPE "PolicyExceptionType" AS ENUM ('ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL', 'CHEQUE_MISSING_EVIDENCE', 'CHEQUE_SINGLE_SIGNATURE_SUSPECTED', 'SETTLED_NOT_REVIEWED_OVERDUE');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateTable
CREATE TABLE "associations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "abbreviation" VARCHAR(32),
    "province_state" VARCHAR(64),
    "country" VARCHAR(64),
    "logo_url" VARCHAR(500),
    "season" VARCHAR(32),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "receipts_enabled" BOOLEAN NOT NULL DEFAULT true,
    "receipt_global_threshold_cents" INTEGER NOT NULL DEFAULT 10000,
    "receipt_grace_period_days" INTEGER NOT NULL DEFAULT 7,
    "receipt_category_thresholds_enabled" BOOLEAN NOT NULL DEFAULT false,
    "receipt_category_overrides" JSONB NOT NULL DEFAULT '{}',
    "allowed_team_threshold_override" BOOLEAN NOT NULL DEFAULT false,
    "pre_season_budget_auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "pre_season_budget_deadline" TIMESTAMPTZ(6),
    "pre_season_budgets_required" INTEGER,

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
    "last_login_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "token_expires_at" TIMESTAMPTZ(6),
    "connected_at" TIMESTAMPTZ(6),
    "last_synced_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "treasurer_name" VARCHAR(255),
    "treasurer_email" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "association_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_financial_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_team_id" UUID NOT NULL,
    "snapshot_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "health_status" VARCHAR(16) NOT NULL,
    "health_score" INTEGER,
    "budget_total" DECIMAL(10,2),
    "spent" DECIMAL(10,2),
    "remaining" DECIMAL(10,2),
    "percent_used" DECIMAL(5,2),
    "pending_reviews" INTEGER,
    "missing_receipts" INTEGER,
    "bank_reconciled_through" DATE,
    "bank_connected" BOOLEAN,
    "last_activity_at" TIMESTAMPTZ(6),
    "red_flags" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by_team_user_id" TEXT,
    "last_triggered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "association_acknowledged_at" TIMESTAMPTZ(6),
    "association_acknowledged_by" UUID,

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
    "generated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "association_budget_report_due_day" INTEGER,
    "association_budget_report_frequency" VARCHAR(32),
    "parent_reapproval_always_ice_facilities" BOOLEAN NOT NULL DEFAULT false,
    "parent_reapproval_category_change_amount" DECIMAL(10,2),
    "parent_reapproval_category_change_percent" DECIMAL(5,2),
    "parent_reapproval_total_budget_change_amount" DECIMAL(10,2),
    "parent_reapproval_total_budget_change_percent" DECIMAL(5,2),
    "require_association_budget_reports" BOOLEAN NOT NULL DEFAULT false,
    "require_parent_reapproval_on_budget_change" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "dashboard_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "recipient" "ReportRecipient" NOT NULL,
    "scheduleType" "ScheduleType" NOT NULL,
    "recurring_frequency" "RecurringFrequency",
    "due_day" INTEGER,
    "specific_dates" JSONB,
    "require_budget_vs_actual" BOOLEAN NOT NULL DEFAULT true,
    "require_budget_changes" BOOLEAN NOT NULL DEFAULT false,
    "require_category_breakdown" BOOLEAN NOT NULL DEFAULT true,
    "require_narrative" BOOLEAN NOT NULL DEFAULT false,
    "narrative_min_length" INTEGER,
    "narrative_prompts" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "report_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_rules" (
    "id" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "approvalTiers" JSONB,
    "requiredExpenses" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "associationId" UUID NOT NULL,
    "signing_authority_composition" JSONB,
    "age_division_filter" JSONB,
    "competitive_level_filter" JSONB,
    "team_type_filter" JSONB,

    CONSTRAINT "association_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_rule_overrides" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "overrideReason" TEXT NOT NULL,
    "overrideConfig" JSONB NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_rule_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_violations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "violationType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "violationData" JSONB NOT NULL,
    "budgetId" TEXT,
    "transactionId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_compliance_status" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "complianceScore" DOUBLE PRECISION NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeViolations" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_compliance_status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_compensation_limits" (
    "id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "season" VARCHAR(32),
    "age_group" VARCHAR(10) NOT NULL,
    "skill_level" VARCHAR(10) NOT NULL,
    "cap_amount_cents" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_compensation_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "association_governance_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "association_id" UUID NOT NULL,
    "requires_association_budget_approval" BOOLEAN NOT NULL DEFAULT false,
    "parent_ack_mode" "ParentAckMode" NOT NULL DEFAULT 'PERCENT',
    "parent_ack_count_threshold" INTEGER,
    "parent_ack_percent_threshold" INTEGER,
    "eligible_family_definition" "EligibleFamilyDefinition" NOT NULL DEFAULT 'ACTIVE_ROSTER_ONLY',
    "allow_team_override_threshold" BOOLEAN NOT NULL DEFAULT false,
    "override_min_percent" INTEGER,
    "override_max_percent" INTEGER,
    "override_min_count" INTEGER,
    "override_max_count" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "association_governance_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_seasons" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "associationId" UUID NOT NULL,
    "seasonLabel" TEXT NOT NULL,
    "seasonStart" DATE NOT NULL,
    "seasonEnd" DATE NOT NULL,
    "state" "TeamSeasonState" NOT NULL DEFAULT 'SETUP',
    "state_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "presented_version_id" TEXT,
    "locked_version_id" TEXT,
    "active_at" TIMESTAMPTZ(6),
    "closed_at" TIMESTAMPTZ(6),
    "archived_at" TIMESTAMPTZ(6),
    "policy_snapshot_id" TEXT,
    "last_activity_at" TIMESTAMPTZ(6),
    "eligible_families_count" INTEGER,
    "approvals_count_for_presented_version" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_policy_snapshots" (
    "id" TEXT NOT NULL,
    "associationId" UUID NOT NULL,
    "snapshot_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "budget_warning_pct" DECIMAL(5,2),
    "budget_critical_pct" DECIMAL(5,2),
    "require_parent_reapproval_on_budget_change" BOOLEAN NOT NULL DEFAULT true,
    "parent_reapproval_total_budget_change_amount" DECIMAL(10,2),
    "parent_reapproval_total_budget_change_percent" DECIMAL(5,2),
    "parent_reapproval_category_change_amount" DECIMAL(10,2),
    "parent_reapproval_category_change_percent" DECIMAL(5,2),
    "dual_approval_threshold" DECIMAL(10,2),
    "rules_snapshot" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_policy_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_season_state_changes" (
    "id" TEXT NOT NULL,
    "team_season_id" TEXT NOT NULL,
    "from_state" "TeamSeasonState",
    "to_state" "TeamSeasonState" NOT NULL,
    "action" "TeamSeasonAction" NOT NULL,
    "actor_user_id" TEXT,
    "actor_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_season_state_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT,
    "season" TEXT NOT NULL,
    "budgetTotal" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ageDivision" "AgeDivision",
    "competitiveLevel" "CompetitiveLevel",
    "teamType" "TeamType",
    "associationName" TEXT,
    "contactEmail" TEXT,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "logoUrl" TEXT,
    "seasonEndDate" DATE,
    "seasonStartDate" DATE,

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
    "primaryName" TEXT,
    "primaryPhone" TEXT,
    "secondaryName" TEXT,
    "secondaryPhone" TEXT,
    "address" TEXT,
    "allergies" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactRelation" TEXT,
    "medicalNotes" TEXT,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "familyId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "jerseyNumber" TEXT,
    "position" TEXT,
    "dateOfBirth" DATE,
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "inviteSentAt" TIMESTAMP(3),
    "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_INVITED',
    "reminderCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_invite_tokens" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parent_invite_tokens_pkey" PRIMARY KEY ("id")
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "background_check_complete" BOOLEAN NOT NULL DEFAULT false,
    "background_check_date" DATE,
    "has_finance_experience" BOOLEAN NOT NULL DEFAULT false,
    "is_signing_authority" BOOLEAN NOT NULL DEFAULT false,
    "user_type" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_signing_authorities" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "position" TEXT,
    "has_finance_experience" BOOLEAN NOT NULL DEFAULT false,
    "background_check_complete" BOOLEAN NOT NULL DEFAULT false,
    "appointed_date" DATE NOT NULL,
    "removed_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_signing_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "display_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "type" "DisplayCategoryType" NOT NULL DEFAULT 'EXPENSE_ROLLUP',
    "color" TEXT NOT NULL DEFAULT '#3B82F6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "display_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "SystemCategoryType" NOT NULL,
    "displayCategoryId" TEXT,
    "isCommon" BOOLEAN NOT NULL DEFAULT true,
    "isDiscouraged" BOOLEAN NOT NULL DEFAULT false,
    "preauthEligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_categories_pkey" PRIMARY KEY ("id")
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "amount" DECIMAL(10,2) NOT NULL,
    "categoryId" TEXT,
    "vendor" TEXT NOT NULL,
    "description" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "receiptPath" TEXT,
    "createdBy" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "importSource" TEXT,
    "importedAt" TIMESTAMP(3),
    "isImported" BOOLEAN NOT NULL DEFAULT false,
    "plaidAccountId" TEXT,
    "plaidTransactionId" TEXT,
    "approvalReason" TEXT,
    "envelopeId" TEXT,
    "systemCategoryId" TEXT,
    "exceptionReason" TEXT,
    "overrideJustification" TEXT,
    "resolutionNotes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "validation_json" JSONB,
    "exception_severity" "ExceptionSeverity",
    "resolution_json" JSONB,
    "receipt_status" "ReceiptStatus" DEFAULT 'NONE',
    "exception_reason" TEXT,
    "resolution_notes" TEXT,
    "resolved_by" TEXT,
    "resolved_at" TIMESTAMPTZ(6),
    "override_justification" TEXT,
    "spend_intent_id" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_validations" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "compliant" BOOLEAN NOT NULL,
    "score" INTEGER,
    "violations" JSONB NOT NULL,
    "checksRun" JSONB NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedBy" TEXT,
    "rulesSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_validations_pkey" PRIMARY KEY ("id")
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
    "assigned_to" TEXT,
    "role_required" TEXT,

    CONSTRAINT "approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "status" "BudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionNumber" INTEGER NOT NULL DEFAULT 1,
    "presentedVersionNumber" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_threshold_configs" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "mode" "ThresholdMode" NOT NULL DEFAULT 'PERCENT',
    "countThreshold" INTEGER,
    "percentThreshold" DECIMAL(5,2),
    "eligibleFamilyCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budget_threshold_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_versions" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "totalBudget" DECIMAL(10,2) NOT NULL,
    "changeSummary" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "coachApprovedAt" TIMESTAMP(3),
    "coachApprovedBy" TEXT,
    "coachNotes" TEXT,
    "associationApprovedAt" TIMESTAMP(3),
    "associationApprovedBy" TEXT,
    "associationNotes" TEXT,

    CONSTRAINT "budget_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_allocations" (
    "id" TEXT NOT NULL,
    "teamId" TEXT,
    "categoryId" TEXT,
    "season" TEXT,
    "allocated" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "budgetVersionId" TEXT,
    "notes" TEXT,
    "systemCategoryId" TEXT,

    CONSTRAINT "budget_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_version_approvals" (
    "id" TEXT NOT NULL,
    "budgetVersionId" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "acknowledgedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedBy" TEXT NOT NULL,
    "comment" TEXT,
    "hasQuestions" BOOLEAN NOT NULL DEFAULT false,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "budget_version_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_envelopes" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "vendorMatchType" "VendorMatchType" NOT NULL DEFAULT 'ANY',
    "vendorMatch" VARCHAR(255),
    "capAmount" DECIMAL(10,2) NOT NULL,
    "periodType" "PeriodType" NOT NULL DEFAULT 'SEASON_WIDE',
    "startDate" DATE,
    "endDate" DATE,
    "maxSingleTransaction" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deactivatedAt" TIMESTAMP(3),
    "deactivatedBy" TEXT,
    "systemCategoryId" TEXT,

    CONSTRAINT "budget_envelopes_pkey" PRIMARY KEY ("id")
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
    "metadata" JSONB,

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
CREATE TABLE "team_settings" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "dualApprovalEnabled" BOOLEAN NOT NULL DEFAULT true,
    "dualApprovalThreshold" DECIMAL(10,2) NOT NULL DEFAULT 200.00,
    "receiptRequired" BOOLEAN NOT NULL DEFAULT true,
    "receipt_global_threshold_override_cents" INTEGER,
    "allowSelfReimbursement" BOOLEAN NOT NULL DEFAULT false,
    "duplicateDetectionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowedPaymentMethods" TEXT[] DEFAULT ARRAY['CASH', 'CHEQUE', 'E_TRANSFER']::TEXT[],
    "duplicateDetectionWindow" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "newExpenseSubmitted" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "budgetThresholdWarning" BOOLEAN NOT NULL DEFAULT true,
    "missingReceiptReminder" BOOLEAN NOT NULL DEFAULT true,
    "monthlySummary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_connections" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "plaidAccountId" TEXT NOT NULL,
    "institutionName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountMask" TEXT,
    "accountType" TEXT,
    "lastSyncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_connections_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "budget_approvals" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "budgetTotal" DECIMAL(10,2) NOT NULL,
    "approvalType" "BudgetApprovalType" NOT NULL,
    "description" TEXT,
    "requiredCount" INTEGER NOT NULL,
    "acknowledgedCount" INTEGER NOT NULL DEFAULT 0,
    "status" "BudgetApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "budget_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acknowledgments" (
    "id" TEXT NOT NULL,
    "budgetApprovalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "acknowledgments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_season_budgets" (
    "id" TEXT NOT NULL,
    "proposedTeamName" TEXT NOT NULL,
    "proposedSeason" TEXT NOT NULL,
    "teamType" TEXT,
    "ageDivision" TEXT,
    "competitiveLevel" TEXT,
    "totalBudget" DECIMAL(10,2) NOT NULL,
    "projectedPlayers" INTEGER NOT NULL,
    "perPlayerCost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdByClerkId" TEXT NOT NULL,
    "associationId" UUID,
    "status" "PreSeasonBudgetStatus" NOT NULL DEFAULT 'DRAFT',
    "associationApprovedAt" TIMESTAMP(3),
    "associationApprovedBy" TEXT,
    "associationNotes" TEXT,
    "publicSlug" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "activatedAt" TIMESTAMP(3),
    "activatedTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pre_season_budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pre_season_allocations" (
    "id" TEXT NOT NULL,
    "preSeasonBudgetId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "allocated" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "systemCategoryId" TEXT,

    CONSTRAINT "pre_season_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_interests" (
    "id" TEXT NOT NULL,
    "preSeasonBudgetId" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "playerName" TEXT NOT NULL,
    "playerAge" INTEGER,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_interests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist_signups" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spend_intents" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "vendor_id" TEXT,
    "vendor_name" VARCHAR(255),
    "budget_line_item_id" TEXT,
    "payment_method" "PaymentMethod" NOT NULL,
    "authorization_type" "AuthorizationType" NOT NULL,
    "requires_manual_approval" BOOLEAN NOT NULL DEFAULT false,
    "status" "SpendIntentStatus" NOT NULL DEFAULT 'PROPOSED',
    "authorized_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "spend_intents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cheque_metadata" (
    "id" TEXT NOT NULL,
    "spend_intent_id" TEXT NOT NULL,
    "cheque_number" VARCHAR(50) NOT NULL,
    "signer1_user_id" TEXT,
    "signer1_name" VARCHAR(255),
    "signer2_user_id" TEXT,
    "signer2_name" VARCHAR(255),
    "issued_at" TIMESTAMPTZ(6) NOT NULL,
    "cheque_image_file_id" TEXT,
    "attested_by_user_id" TEXT,
    "attested_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "cheque_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plaid_bank_transactions" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "plaid_transaction_id" VARCHAR(255) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'CAD',
    "posted_at" TIMESTAMPTZ(6) NOT NULL,
    "authorized_at" TIMESTAMPTZ(6),
    "merchant_name" VARCHAR(255),
    "raw_name" VARCHAR(500),
    "payment_channel" VARCHAR(50),
    "pending" BOOLEAN NOT NULL DEFAULT false,
    "raw" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "plaid_bank_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "reviewer_user_id" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL,
    "notes" TEXT,
    "reviewed_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_exceptions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "type" "PolicyExceptionType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "details" JSONB NOT NULL,
    "detected_at" TIMESTAMPTZ(6) NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "policy_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "associations_name_key" ON "associations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "association_users_clerk_user_id_association_id_key" ON "association_users"("clerk_user_id", "association_id");

-- CreateIndex
CREATE UNIQUE INDEX "association_teams_team_id_key" ON "association_teams"("team_id");

-- CreateIndex
CREATE INDEX "association_teams_team_id_idx" ON "association_teams"("team_id");

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
CREATE INDEX "report_schedules_association_id_idx" ON "report_schedules"("association_id");

-- CreateIndex
CREATE INDEX "report_schedules_recipient_idx" ON "report_schedules"("recipient");

-- CreateIndex
CREATE INDEX "report_schedules_scheduleType_idx" ON "report_schedules"("scheduleType");

-- CreateIndex
CREATE INDEX "report_schedules_is_active_idx" ON "report_schedules"("is_active");

-- CreateIndex
CREATE INDEX "association_rules_associationId_idx" ON "association_rules"("associationId");

-- CreateIndex
CREATE INDEX "association_rules_ruleType_idx" ON "association_rules"("ruleType");

-- CreateIndex
CREATE INDEX "association_rules_isActive_idx" ON "association_rules"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "association_rules_associationId_name_key" ON "association_rules"("associationId", "name");

-- CreateIndex
CREATE INDEX "team_rule_overrides_teamId_idx" ON "team_rule_overrides"("teamId");

-- CreateIndex
CREATE INDEX "team_rule_overrides_ruleId_idx" ON "team_rule_overrides"("ruleId");

-- CreateIndex
CREATE INDEX "team_rule_overrides_isActive_idx" ON "team_rule_overrides"("isActive");

-- CreateIndex
CREATE INDEX "rule_violations_teamId_idx" ON "rule_violations"("teamId");

-- CreateIndex
CREATE INDEX "rule_violations_ruleId_idx" ON "rule_violations"("ruleId");

-- CreateIndex
CREATE INDEX "rule_violations_violationType_idx" ON "rule_violations"("violationType");

-- CreateIndex
CREATE INDEX "rule_violations_severity_idx" ON "rule_violations"("severity");

-- CreateIndex
CREATE INDEX "rule_violations_resolved_idx" ON "rule_violations"("resolved");

-- CreateIndex
CREATE UNIQUE INDEX "team_compliance_status_teamId_key" ON "team_compliance_status"("teamId");

-- CreateIndex
CREATE INDEX "team_compliance_status_teamId_idx" ON "team_compliance_status"("teamId");

-- CreateIndex
CREATE INDEX "team_compliance_status_status_idx" ON "team_compliance_status"("status");

-- CreateIndex
CREATE INDEX "team_compliance_status_complianceScore_idx" ON "team_compliance_status"("complianceScore");

-- CreateIndex
CREATE INDEX "coach_compensation_limits_rule_id_idx" ON "coach_compensation_limits"("rule_id");

-- CreateIndex
CREATE INDEX "coach_compensation_limits_season_idx" ON "coach_compensation_limits"("season");

-- CreateIndex
CREATE UNIQUE INDEX "coach_compensation_limits_rule_id_season_age_group_skill_le_key" ON "coach_compensation_limits"("rule_id", "season", "age_group", "skill_level");

-- CreateIndex
CREATE UNIQUE INDEX "association_governance_rules_association_id_key" ON "association_governance_rules"("association_id");

-- CreateIndex
CREATE INDEX "team_seasons_teamId_idx" ON "team_seasons"("teamId");

-- CreateIndex
CREATE INDEX "team_seasons_associationId_idx" ON "team_seasons"("associationId");

-- CreateIndex
CREATE INDEX "team_seasons_state_idx" ON "team_seasons"("state");

-- CreateIndex
CREATE INDEX "team_seasons_seasonLabel_idx" ON "team_seasons"("seasonLabel");

-- CreateIndex
CREATE INDEX "team_seasons_last_activity_at_idx" ON "team_seasons"("last_activity_at");

-- CreateIndex
CREATE UNIQUE INDEX "team_seasons_teamId_seasonLabel_key" ON "team_seasons"("teamId", "seasonLabel");

-- CreateIndex
CREATE INDEX "team_policy_snapshots_associationId_idx" ON "team_policy_snapshots"("associationId");

-- CreateIndex
CREATE INDEX "team_policy_snapshots_snapshot_at_idx" ON "team_policy_snapshots"("snapshot_at");

-- CreateIndex
CREATE INDEX "team_season_state_changes_team_season_id_idx" ON "team_season_state_changes"("team_season_id");

-- CreateIndex
CREATE INDEX "team_season_state_changes_created_at_idx" ON "team_season_state_changes"("created_at");

-- CreateIndex
CREATE INDEX "team_season_state_changes_action_idx" ON "team_season_state_changes"("action");

-- CreateIndex
CREATE INDEX "families_teamId_idx" ON "families"("teamId");

-- CreateIndex
CREATE INDEX "players_teamId_idx" ON "players"("teamId");

-- CreateIndex
CREATE INDEX "players_familyId_idx" ON "players"("familyId");

-- CreateIndex
CREATE INDEX "players_onboardingStatus_idx" ON "players"("onboardingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "parent_invite_tokens_tokenHash_key" ON "parent_invite_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "parent_invite_tokens_playerId_idx" ON "parent_invite_tokens"("playerId");

-- CreateIndex
CREATE INDEX "parent_invite_tokens_teamId_idx" ON "parent_invite_tokens"("teamId");

-- CreateIndex
CREATE INDEX "parent_invite_tokens_tokenHash_idx" ON "parent_invite_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "parent_invite_tokens_expiresAt_idx" ON "parent_invite_tokens"("expiresAt");

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
CREATE INDEX "team_signing_authorities_team_id_idx" ON "team_signing_authorities"("team_id");

-- CreateIndex
CREATE INDEX "team_signing_authorities_user_id_idx" ON "team_signing_authorities"("user_id");

-- CreateIndex
CREATE INDEX "team_signing_authorities_is_active_idx" ON "team_signing_authorities"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "team_signing_authorities_team_id_user_id_is_active_key" ON "team_signing_authorities"("team_id", "user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "display_categories_slug_key" ON "display_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "system_categories_slug_key" ON "system_categories"("slug");

-- CreateIndex
CREATE INDEX "system_categories_displayCategoryId_idx" ON "system_categories"("displayCategoryId");

-- CreateIndex
CREATE INDEX "system_categories_type_idx" ON "system_categories"("type");

-- CreateIndex
CREATE INDEX "system_categories_slug_idx" ON "system_categories"("slug");

-- CreateIndex
CREATE INDEX "categories_teamId_idx" ON "categories"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_plaidTransactionId_key" ON "transactions"("plaidTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_spend_intent_id_key" ON "transactions"("spend_intent_id");

-- CreateIndex
CREATE INDEX "transactions_teamId_idx" ON "transactions"("teamId");

-- CreateIndex
CREATE INDEX "transactions_categoryId_idx" ON "transactions"("categoryId");

-- CreateIndex
CREATE INDEX "transactions_systemCategoryId_idx" ON "transactions"("systemCategoryId");

-- CreateIndex
CREATE INDEX "transactions_createdBy_idx" ON "transactions"("createdBy");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_plaidTransactionId_idx" ON "transactions"("plaidTransactionId");

-- CreateIndex
CREATE INDEX "transactions_isImported_idx" ON "transactions"("isImported");

-- CreateIndex
CREATE INDEX "transactions_envelopeId_idx" ON "transactions"("envelopeId");

-- CreateIndex
CREATE INDEX "transactions_spend_intent_id_idx" ON "transactions"("spend_intent_id");

-- CreateIndex
CREATE INDEX "transactions_teamId_deletedAt_transactionDate_id_idx" ON "transactions"("teamId", "deletedAt", "transactionDate", "id");

-- CreateIndex
CREATE INDEX "transactions_teamId_deletedAt_status_transactionDate_id_idx" ON "transactions"("teamId", "deletedAt", "status", "transactionDate", "id");

-- CreateIndex
CREATE INDEX "transactions_teamId_deletedAt_type_transactionDate_id_idx" ON "transactions"("teamId", "deletedAt", "type", "transactionDate", "id");

-- CreateIndex
CREATE INDEX "transactions_teamId_deletedAt_categoryId_transactionDate_id_idx" ON "transactions"("teamId", "deletedAt", "categoryId", "transactionDate", "id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_validations_transactionId_key" ON "transaction_validations"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_validations_transactionId_idx" ON "transaction_validations"("transactionId");

-- CreateIndex
CREATE INDEX "transaction_validations_compliant_idx" ON "transaction_validations"("compliant");

-- CreateIndex
CREATE INDEX "transaction_validations_validatedAt_idx" ON "transaction_validations"("validatedAt");

-- CreateIndex
CREATE INDEX "approvals_transactionId_idx" ON "approvals"("transactionId");

-- CreateIndex
CREATE INDEX "approvals_approvedBy_idx" ON "approvals"("approvedBy");

-- CreateIndex
CREATE INDEX "approvals_status_idx" ON "approvals"("status");

-- CreateIndex
CREATE INDEX "approvals_teamId_idx" ON "approvals"("teamId");

-- CreateIndex
CREATE INDEX "approvals_assigned_to_idx" ON "approvals"("assigned_to");

-- CreateIndex
CREATE INDEX "budgets_teamId_idx" ON "budgets"("teamId");

-- CreateIndex
CREATE INDEX "budgets_status_idx" ON "budgets"("status");

-- CreateIndex
CREATE INDEX "budgets_season_idx" ON "budgets"("season");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_teamId_season_key" ON "budgets"("teamId", "season");

-- CreateIndex
CREATE UNIQUE INDEX "budget_threshold_configs_budgetId_key" ON "budget_threshold_configs"("budgetId");

-- CreateIndex
CREATE INDEX "budget_versions_budgetId_idx" ON "budget_versions"("budgetId");

-- CreateIndex
CREATE INDEX "budget_versions_versionNumber_idx" ON "budget_versions"("versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "budget_versions_budgetId_versionNumber_key" ON "budget_versions"("budgetId", "versionNumber");

-- CreateIndex
CREATE INDEX "budget_allocations_budgetVersionId_idx" ON "budget_allocations"("budgetVersionId");

-- CreateIndex
CREATE INDEX "budget_allocations_systemCategoryId_idx" ON "budget_allocations"("systemCategoryId");

-- CreateIndex
CREATE INDEX "budget_allocations_categoryId_idx" ON "budget_allocations"("categoryId");

-- CreateIndex
CREATE INDEX "budget_allocations_teamId_season_idx" ON "budget_allocations"("teamId", "season");

-- CreateIndex
CREATE INDEX "budget_version_approvals_budgetVersionId_idx" ON "budget_version_approvals"("budgetVersionId");

-- CreateIndex
CREATE INDEX "budget_version_approvals_familyId_idx" ON "budget_version_approvals"("familyId");

-- CreateIndex
CREATE INDEX "budget_version_approvals_acknowledgedAt_idx" ON "budget_version_approvals"("acknowledgedAt");

-- CreateIndex
CREATE UNIQUE INDEX "budget_version_approvals_budgetVersionId_familyId_key" ON "budget_version_approvals"("budgetVersionId", "familyId");

-- CreateIndex
CREATE INDEX "budget_envelopes_teamId_idx" ON "budget_envelopes"("teamId");

-- CreateIndex
CREATE INDEX "budget_envelopes_budgetId_idx" ON "budget_envelopes"("budgetId");

-- CreateIndex
CREATE INDEX "budget_envelopes_categoryId_idx" ON "budget_envelopes"("categoryId");

-- CreateIndex
CREATE INDEX "budget_envelopes_systemCategoryId_idx" ON "budget_envelopes"("systemCategoryId");

-- CreateIndex
CREATE INDEX "budget_envelopes_isActive_idx" ON "budget_envelopes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "budget_envelopes_budgetId_categoryId_vendorMatch_key" ON "budget_envelopes"("budgetId", "categoryId", "vendorMatch");

-- CreateIndex
CREATE INDEX "audit_logs_teamId_idx" ON "audit_logs"("teamId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

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
CREATE UNIQUE INDEX "team_settings_teamId_key" ON "team_settings"("teamId");

-- CreateIndex
CREATE INDEX "notification_settings_userId_idx" ON "notification_settings"("userId");

-- CreateIndex
CREATE INDEX "notification_settings_teamId_idx" ON "notification_settings"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "notification_settings_userId_teamId_key" ON "notification_settings"("userId", "teamId");

-- CreateIndex
CREATE INDEX "bank_connections_teamId_idx" ON "bank_connections"("teamId");

-- CreateIndex
CREATE INDEX "bank_connections_itemId_idx" ON "bank_connections"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_connections_teamId_itemId_key" ON "bank_connections"("teamId", "itemId");

-- CreateIndex
CREATE INDEX "season_closures_teamId_idx" ON "season_closures"("teamId");

-- CreateIndex
CREATE INDEX "season_closures_status_idx" ON "season_closures"("status");

-- CreateIndex
CREATE UNIQUE INDEX "season_closures_teamId_season_key" ON "season_closures"("teamId", "season");

-- CreateIndex
CREATE INDEX "budget_approvals_teamId_status_idx" ON "budget_approvals"("teamId", "status");

-- CreateIndex
CREATE INDEX "budget_approvals_createdAt_idx" ON "budget_approvals"("createdAt");

-- CreateIndex
CREATE INDEX "acknowledgments_budgetApprovalId_idx" ON "acknowledgments"("budgetApprovalId");

-- CreateIndex
CREATE UNIQUE INDEX "acknowledgments_budgetApprovalId_userId_key" ON "acknowledgments"("budgetApprovalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "pre_season_budgets_publicSlug_key" ON "pre_season_budgets"("publicSlug");

-- CreateIndex
CREATE UNIQUE INDEX "pre_season_budgets_activatedTeamId_key" ON "pre_season_budgets"("activatedTeamId");

-- CreateIndex
CREATE INDEX "pre_season_budgets_createdByClerkId_idx" ON "pre_season_budgets"("createdByClerkId");

-- CreateIndex
CREATE INDEX "pre_season_budgets_associationId_idx" ON "pre_season_budgets"("associationId");

-- CreateIndex
CREATE INDEX "pre_season_budgets_status_idx" ON "pre_season_budgets"("status");

-- CreateIndex
CREATE INDEX "pre_season_budgets_publicSlug_idx" ON "pre_season_budgets"("publicSlug");

-- CreateIndex
CREATE INDEX "pre_season_allocations_preSeasonBudgetId_idx" ON "pre_season_allocations"("preSeasonBudgetId");

-- CreateIndex
CREATE INDEX "pre_season_allocations_categoryId_idx" ON "pre_season_allocations"("categoryId");

-- CreateIndex
CREATE INDEX "pre_season_allocations_systemCategoryId_idx" ON "pre_season_allocations"("systemCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "pre_season_allocations_preSeasonBudgetId_categoryId_key" ON "pre_season_allocations"("preSeasonBudgetId", "categoryId");

-- CreateIndex
CREATE INDEX "parent_interests_preSeasonBudgetId_acknowledged_idx" ON "parent_interests"("preSeasonBudgetId", "acknowledged");

-- CreateIndex
CREATE INDEX "parent_interests_email_idx" ON "parent_interests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "parent_interests_preSeasonBudgetId_email_key" ON "parent_interests"("preSeasonBudgetId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_signups_email_key" ON "waitlist_signups"("email");

-- CreateIndex
CREATE INDEX "waitlist_signups_email_idx" ON "waitlist_signups"("email");

-- CreateIndex
CREATE INDEX "waitlist_signups_created_at_idx" ON "waitlist_signups"("created_at");

-- CreateIndex
CREATE INDEX "spend_intents_team_id_idx" ON "spend_intents"("team_id");

-- CreateIndex
CREATE INDEX "spend_intents_created_by_user_id_idx" ON "spend_intents"("created_by_user_id");

-- CreateIndex
CREATE INDEX "spend_intents_status_idx" ON "spend_intents"("status");

-- CreateIndex
CREATE INDEX "spend_intents_payment_method_idx" ON "spend_intents"("payment_method");

-- CreateIndex
CREATE UNIQUE INDEX "cheque_metadata_spend_intent_id_key" ON "cheque_metadata"("spend_intent_id");

-- CreateIndex
CREATE INDEX "cheque_metadata_spend_intent_id_idx" ON "cheque_metadata"("spend_intent_id");

-- CreateIndex
CREATE INDEX "cheque_metadata_cheque_number_idx" ON "cheque_metadata"("cheque_number");

-- CreateIndex
CREATE UNIQUE INDEX "plaid_bank_transactions_plaid_transaction_id_key" ON "plaid_bank_transactions"("plaid_transaction_id");

-- CreateIndex
CREATE INDEX "plaid_bank_transactions_team_id_idx" ON "plaid_bank_transactions"("team_id");

-- CreateIndex
CREATE INDEX "plaid_bank_transactions_plaid_transaction_id_idx" ON "plaid_bank_transactions"("plaid_transaction_id");

-- CreateIndex
CREATE INDEX "plaid_bank_transactions_posted_at_idx" ON "plaid_bank_transactions"("posted_at");

-- CreateIndex
CREATE INDEX "plaid_bank_transactions_pending_idx" ON "plaid_bank_transactions"("pending");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_transaction_id_key" ON "reviews"("transaction_id");

-- CreateIndex
CREATE INDEX "reviews_transaction_id_idx" ON "reviews"("transaction_id");

-- CreateIndex
CREATE INDEX "reviews_reviewer_user_id_idx" ON "reviews"("reviewer_user_id");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");

-- CreateIndex
CREATE INDEX "policy_exceptions_transaction_id_idx" ON "policy_exceptions"("transaction_id");

-- CreateIndex
CREATE INDEX "policy_exceptions_type_idx" ON "policy_exceptions"("type");

-- CreateIndex
CREATE INDEX "policy_exceptions_severity_idx" ON "policy_exceptions"("severity");

-- CreateIndex
CREATE INDEX "policy_exceptions_resolved_at_idx" ON "policy_exceptions"("resolved_at");

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
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_resolved_by_team_user_id_fkey" FOREIGN KEY ("resolved_by_team_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_association_acknowledged_by_fkey" FOREIGN KEY ("association_acknowledged_by") REFERENCES "association_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "association_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dashboard_config" ADD CONSTRAINT "dashboard_config_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_schedules" ADD CONSTRAINT "report_schedules_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_rules" ADD CONSTRAINT "association_rules_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_rule_overrides" ADD CONSTRAINT "team_rule_overrides_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "association_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_rule_overrides" ADD CONSTRAINT "team_rule_overrides_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_violations" ADD CONSTRAINT "rule_violations_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "association_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_violations" ADD CONSTRAINT "rule_violations_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_compliance_status" ADD CONSTRAINT "team_compliance_status_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_compensation_limits" ADD CONSTRAINT "coach_compensation_limits_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "association_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "association_governance_rules" ADD CONSTRAINT "association_governance_rules_association_id_fkey" FOREIGN KEY ("association_id") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_policy_snapshot_id_fkey" FOREIGN KEY ("policy_snapshot_id") REFERENCES "team_policy_snapshots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_seasons" ADD CONSTRAINT "team_seasons_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_season_state_changes" ADD CONSTRAINT "team_season_state_changes_team_season_id_fkey" FOREIGN KEY ("team_season_id") REFERENCES "team_seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "families" ADD CONSTRAINT "families_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_invite_tokens" ADD CONSTRAINT "parent_invite_tokens_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_invite_tokens" ADD CONSTRAINT "parent_invite_tokens_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_association_user_id_fkey" FOREIGN KEY ("association_user_id") REFERENCES "association_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_signing_authorities" ADD CONSTRAINT "team_signing_authorities_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_signing_authorities" ADD CONSTRAINT "team_signing_authorities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_categories" ADD CONSTRAINT "system_categories_displayCategoryId_fkey" FOREIGN KEY ("displayCategoryId") REFERENCES "display_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_spend_intent_id_fkey" FOREIGN KEY ("spend_intent_id") REFERENCES "spend_intents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "budget_envelopes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_systemCategoryId_fkey" FOREIGN KEY ("systemCategoryId") REFERENCES "system_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_validations" ADD CONSTRAINT "transaction_validations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_validations" ADD CONSTRAINT "transaction_validations_validatedBy_fkey" FOREIGN KEY ("validatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_threshold_configs" ADD CONSTRAINT "budget_threshold_configs_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_versions" ADD CONSTRAINT "budget_versions_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_allocations" ADD CONSTRAINT "budget_allocations_systemCategoryId_fkey" FOREIGN KEY ("systemCategoryId") REFERENCES "system_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_version_approvals" ADD CONSTRAINT "budget_version_approvals_budgetVersionId_fkey" FOREIGN KEY ("budgetVersionId") REFERENCES "budget_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_version_approvals" ADD CONSTRAINT "budget_version_approvals_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_envelopes" ADD CONSTRAINT "budget_envelopes_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_envelopes" ADD CONSTRAINT "budget_envelopes_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_envelopes" ADD CONSTRAINT "budget_envelopes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_envelopes" ADD CONSTRAINT "budget_envelopes_systemCategoryId_fkey" FOREIGN KEY ("systemCategoryId") REFERENCES "system_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_envelopes" ADD CONSTRAINT "budget_envelopes_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "team_settings" ADD CONSTRAINT "team_settings_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_settings" ADD CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_connections" ADD CONSTRAINT "bank_connections_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_closures" ADD CONSTRAINT "season_closures_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "season_closures" ADD CONSTRAINT "season_closures_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_approvals" ADD CONSTRAINT "budget_approvals_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_approvals" ADD CONSTRAINT "budget_approvals_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_budgetApprovalId_fkey" FOREIGN KEY ("budgetApprovalId") REFERENCES "budget_approvals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acknowledgments" ADD CONSTRAINT "acknowledgments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_season_budgets" ADD CONSTRAINT "pre_season_budgets_activatedTeamId_fkey" FOREIGN KEY ("activatedTeamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_season_budgets" ADD CONSTRAINT "pre_season_budgets_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_season_allocations" ADD CONSTRAINT "pre_season_allocations_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_season_allocations" ADD CONSTRAINT "pre_season_allocations_preSeasonBudgetId_fkey" FOREIGN KEY ("preSeasonBudgetId") REFERENCES "pre_season_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pre_season_allocations" ADD CONSTRAINT "pre_season_allocations_systemCategoryId_fkey" FOREIGN KEY ("systemCategoryId") REFERENCES "system_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_interests" ADD CONSTRAINT "parent_interests_preSeasonBudgetId_fkey" FOREIGN KEY ("preSeasonBudgetId") REFERENCES "pre_season_budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_intents" ADD CONSTRAINT "spend_intents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spend_intents" ADD CONSTRAINT "spend_intents_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_metadata" ADD CONSTRAINT "cheque_metadata_spend_intent_id_fkey" FOREIGN KEY ("spend_intent_id") REFERENCES "spend_intents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_metadata" ADD CONSTRAINT "cheque_metadata_signer1_user_id_fkey" FOREIGN KEY ("signer1_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_metadata" ADD CONSTRAINT "cheque_metadata_signer2_user_id_fkey" FOREIGN KEY ("signer2_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_metadata" ADD CONSTRAINT "cheque_metadata_attested_by_user_id_fkey" FOREIGN KEY ("attested_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plaid_bank_transactions" ADD CONSTRAINT "plaid_bank_transactions_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_user_id_fkey" FOREIGN KEY ("reviewer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_exceptions" ADD CONSTRAINT "policy_exceptions_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

