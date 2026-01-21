import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { auth } from '@/lib/auth/server-auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      // Step 1: Association Basics
      name,
      abbreviation,
      provinceState,
      country,
      currency,
      season,
      logoUrl,

      // Step 2: Admin Setup
      adminEmail,
      adminName,

      // Step 3: Board Members
      boardMembers,

      // Step 4: Dashboard Configuration
      budgetWarningPct,
      budgetCriticalPct,
      bankWarningDays,
      bankCriticalDays,
      approvalsWarningCount,
      approvalsCriticalCount,
      inactivityWarningDays,

      // Budget Update & Reporting Policy
      requireParentReapprovalOnBudgetChange,
      parentReapprovalTotalBudgetChangeAmount,
      parentReapprovalTotalBudgetChangePercent,
      parentReapprovalCategoryChangeAmount,
      parentReapprovalCategoryChangePercent,
      parentReapprovalAlwaysIceFacilities,
      requireAssociationBudgetReports,
      associationBudgetReportFrequency,
      associationBudgetReportDueDay,

      // Step 5: Pre-Season Budget Settings
      usePreSeasonBudgets,
      preSeasonBudgetDeadline,
      preSeasonBudgetsRequired,
      preSeasonBudgetAutoApprove,

      // Report Schedules
      enableParentReports,
      enableAssociationReports,
      parentReportSchedule,
      associationReportSchedule,

      // Receipt Policy
      receiptsEnabled,
      receiptGlobalThresholdCents,
      receiptGracePeriodDays,
      allowedTeamThresholdOverride,
    } = body;

    // Validate required fields
    if (!name || !currency || !adminEmail || !adminName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if association with this name already exists
    const existingAssociation = await prisma.association.findFirst({
      where: { name: name.trim() },
    });

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'Association with this name already exists' },
        { status: 409 }
      );
    }

    // Create association, admin user, and config in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the association
      const newAssociation = await tx.association.create({
        data: {
          name: name.trim(),
          abbreviation: abbreviation?.trim() || null,
          provinceState: provinceState?.trim() || null,
          country: country?.trim() || null,
          currency,
          season: season?.trim() || null,
          logoUrl: logoUrl?.trim() || null,
          // Pre-season budget settings
          preSeasonBudgetDeadline: usePreSeasonBudgets && preSeasonBudgetDeadline
            ? new Date(preSeasonBudgetDeadline)
            : null,
          preSeasonBudgetsRequired: usePreSeasonBudgets && preSeasonBudgetsRequired
            ? preSeasonBudgetsRequired
            : null,
          preSeasonBudgetAutoApprove: usePreSeasonBudgets
            ? preSeasonBudgetAutoApprove
            : false,
          // Receipt Policy
          receiptsEnabled: receiptsEnabled ?? true,
          receiptGlobalThresholdCents: receiptGlobalThresholdCents ?? 10000,
          receiptGracePeriodDays: receiptGracePeriodDays ?? 7,
          allowedTeamThresholdOverride: allowedTeamThresholdOverride ?? false,
        },
      });

      // 2. Create the admin user
      const newAdmin = await tx.associationUser.create({
        data: {
          associationId: newAssociation.id,
          clerkUserId: userId,
          email: adminEmail.trim(),
          name: adminName.trim(),
          role: 'association_admin',
        },
      });

      // 3. Create additional board members (if provided)
      const boardMembersData = [];
      if (boardMembers && Array.isArray(boardMembers) && boardMembers.length > 0) {
        for (const member of boardMembers) {
          if (member.name && member.email && member.role) {
            const newMember = await tx.associationUser.create({
              data: {
                associationId: newAssociation.id,
                clerkUserId: `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                email: member.email.trim(),
                name: member.name.trim(),
                role: member.role,
              },
            });
            boardMembersData.push(newMember);
          }
        }
      }

      // 4. Create dashboard configuration with provided or default values
      const newConfig = await tx.dashboardConfig.create({
        data: {
          associationId: newAssociation.id,
          budgetWarningPct: budgetWarningPct ?? 80,
          budgetCriticalPct: budgetCriticalPct ?? 95,
          bankWarningDays: bankWarningDays ?? 30,
          bankCriticalDays: bankCriticalDays ?? 60,
          approvalsWarningCount: approvalsWarningCount ?? 5,
          approvalsCriticalCount: approvalsCriticalCount ?? 10,
          inactivityWarningDays: inactivityWarningDays ?? 21,

          // Budget Update & Reporting Policy
          requireParentReapprovalOnBudgetChange: requireParentReapprovalOnBudgetChange ?? true,
          parentReapprovalTotalBudgetChangeAmount: parentReapprovalTotalBudgetChangeAmount ?? null,
          parentReapprovalTotalBudgetChangePercent: parentReapprovalTotalBudgetChangePercent ?? null,
          parentReapprovalCategoryChangeAmount: parentReapprovalCategoryChangeAmount ?? null,
          parentReapprovalCategoryChangePercent: parentReapprovalCategoryChangePercent ?? null,
          parentReapprovalAlwaysIceFacilities: parentReapprovalAlwaysIceFacilities ?? false,
          requireAssociationBudgetReports: requireAssociationBudgetReports ?? false,
          associationBudgetReportFrequency: associationBudgetReportFrequency ?? null,
          associationBudgetReportDueDay: associationBudgetReportDueDay ?? null,
        },
      });

      // 5. Create report schedules (if enabled)
      const reportSchedulesData = [];

      if (enableParentReports && parentReportSchedule) {
        const newParentSchedule = await tx.reportSchedule.create({
          data: {
            associationId: newAssociation.id,
            recipient: parentReportSchedule.recipient,
            scheduleType: parentReportSchedule.scheduleType,
            recurringFrequency: parentReportSchedule.recurringFrequency ?? null,
            dueDay: parentReportSchedule.dueDay ?? null,
            specificDates: parentReportSchedule.specificDates ?? null,
            requireBudgetVsActual: parentReportSchedule.requireBudgetVsActual,
            requireBudgetChanges: parentReportSchedule.requireBudgetChanges,
            requireCategoryBreakdown: parentReportSchedule.requireCategoryBreakdown,
            requireNarrative: parentReportSchedule.requireNarrative,
            narrativeMinLength: parentReportSchedule.narrativeMinLength ?? null,
            narrativePrompts: parentReportSchedule.narrativePrompts ?? null,
          },
        });
        reportSchedulesData.push(newParentSchedule);
      }

      if (enableAssociationReports && associationReportSchedule) {
        const newAssociationSchedule = await tx.reportSchedule.create({
          data: {
            associationId: newAssociation.id,
            recipient: associationReportSchedule.recipient,
            scheduleType: associationReportSchedule.scheduleType,
            recurringFrequency: associationReportSchedule.recurringFrequency ?? null,
            dueDay: associationReportSchedule.dueDay ?? null,
            specificDates: associationReportSchedule.specificDates ?? null,
            requireBudgetVsActual: associationReportSchedule.requireBudgetVsActual,
            requireBudgetChanges: associationReportSchedule.requireBudgetChanges,
            requireCategoryBreakdown: associationReportSchedule.requireCategoryBreakdown,
            requireNarrative: associationReportSchedule.requireNarrative,
            narrativeMinLength: associationReportSchedule.narrativeMinLength ?? null,
            narrativePrompts: associationReportSchedule.narrativePrompts ?? null,
          },
        });
        reportSchedulesData.push(newAssociationSchedule);
      }

      return {
        association: newAssociation,
        admin: newAdmin,
        boardMembers: boardMembersData,
        config: newConfig,
        reportSchedules: reportSchedulesData,
      };
    });

    logger.info('Association created successfully', {
      associationId: result.association.id,
      associationName: result.association.name,
      adminEmail: result.admin.email,
      boardMembersCount: result.boardMembers.length,
    });

    return NextResponse.json({
      success: true,
      association: {
        id: result.association.id,
        name: result.association.name,
        abbreviation: result.association.abbreviation,
        provinceState: result.association.provinceState,
        country: result.association.country,
        currency: result.association.currency,
        season: result.association.season,
      },
    });
  } catch (error) {
    logger.error('Association creation error', error as Error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create association';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
