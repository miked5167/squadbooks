'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { WizardLayout } from '@/app/onboarding/components/WizardLayout';
import { StepAssociationBasics } from './components/StepAssociationBasics';
import { StepAdminSetup } from './components/StepAdminSetup';
import { StepBoardMembers, type BoardMember } from './components/StepBoardMembers';
import { StepDashboardConfig } from './components/StepDashboardConfig';
import { StepPreSeasonConfig } from './components/StepPreSeasonConfig';
import { AssociationCompletionScreen } from './components/AssociationCompletionScreen';
import type { ReportSchedule } from './components/ReportScheduleBuilder';

interface WizardData {
  // Step 1: Association Basics
  name: string;
  abbreviation?: string;
  provinceState?: string;
  country?: string;
  currency: string;
  season?: string;
  logoUrl?: string;

  // Step 2: Admin Setup
  adminName: string;
  adminEmail: string;

  // Step 3: Board Members
  boardMembers: BoardMember[];

  // Step 4: Dashboard Configuration & Budget Policy
  budgetWarningPct: number;
  budgetCriticalPct: number;
  bankWarningDays: number;
  bankCriticalDays: number;
  approvalsWarningCount: number;
  approvalsCriticalCount: number;
  inactivityWarningDays: number;

  // Budget Update & Reporting Policy
  requireParentReapprovalOnBudgetChange: boolean;
  parentReapprovalTotalBudgetChangeAmount: number | null;
  parentReapprovalTotalBudgetChangePercent: number | null;
  parentReapprovalCategoryChangeAmount: number | null;
  parentReapprovalCategoryChangePercent: number | null;
  parentReapprovalAlwaysIceFacilities: boolean;
  requireAssociationBudgetReports: boolean;
  associationBudgetReportFrequency: 'monthly' | 'quarterly' | 'midseason_yearend' | 'yearend_only' | null;
  associationBudgetReportDueDay: number | null;

  // Report Schedules
  enableParentReports: boolean;
  enableAssociationReports: boolean;
  parentReportSchedule?: ReportSchedule;
  associationReportSchedule?: ReportSchedule;

  // Step 5: Pre-Season Configuration
  usePreSeasonBudgets: boolean;
  preSeasonBudgetDeadline?: string;
  preSeasonBudgetsRequired?: number;
  preSeasonBudgetAutoApprove: boolean;

  // Result
  associationId?: string;
}

export default function AssociationOnboardingPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [wizardData, setWizardData] = useState<WizardData>({
    name: '',
    currency: 'CAD',
    adminName: '',
    adminEmail: '',
    boardMembers: [],
    budgetWarningPct: 80,
    budgetCriticalPct: 95,
    bankWarningDays: 30,
    bankCriticalDays: 60,
    approvalsWarningCount: 5,
    approvalsCriticalCount: 10,
    inactivityWarningDays: 21,

    // Budget Update & Reporting Policy
    requireParentReapprovalOnBudgetChange: true,
    parentReapprovalTotalBudgetChangeAmount: null,
    parentReapprovalTotalBudgetChangePercent: 10,
    parentReapprovalCategoryChangeAmount: null,
    parentReapprovalCategoryChangePercent: 25,
    parentReapprovalAlwaysIceFacilities: false,
    requireAssociationBudgetReports: false,
    associationBudgetReportFrequency: 'yearend_only',
    associationBudgetReportDueDay: null,

    // Report Schedules
    enableParentReports: false,
    enableAssociationReports: false,
    parentReportSchedule: {
      recipient: 'PARENTS',
      scheduleType: 'RECURRING',
      recurringFrequency: 'QUARTERLY',
      dueDay: 15,
      requireBudgetVsActual: true,
      requireBudgetChanges: false,
      requireCategoryBreakdown: true,
      requireNarrative: false,
    },
    associationReportSchedule: {
      recipient: 'ASSOCIATION',
      scheduleType: 'RECURRING',
      recurringFrequency: 'QUARTERLY',
      dueDay: 15,
      requireBudgetVsActual: true,
      requireBudgetChanges: true,
      requireCategoryBreakdown: true,
      requireNarrative: false,
    },

    usePreSeasonBudgets: false,
    preSeasonBudgetAutoApprove: false,
  });

  const totalSteps = 5;
  const isCompleted = currentStep === 6;

  const createAssociation = async (dataToSubmit?: WizardData) => {
    const finalData = dataToSubmit || wizardData;
    setLoading(true);
    try {
      console.log('Creating association with data:', {
        name: finalData.name,
        currency: finalData.currency,
        adminName: finalData.adminName,
        adminEmail: finalData.adminEmail,
        usePreSeasonBudgets: finalData.usePreSeasonBudgets,
      });

      const response = await fetch('/api/association/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      const data = await response.json();
      console.log('API response:', { status: response.status, data });

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create association');
      }

      toast({
        title: 'Success!',
        description: `${finalData.name} has been created successfully.`,
      });

      // Save association ID and move to completion
      setWizardData({ ...finalData, associationId: data.association.id });
      setCurrentStep(6);
    } catch (error) {
      console.error('Association creation error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create association',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <WizardLayout currentStep={currentStep} totalSteps={totalSteps} isCompleted={isCompleted}>
      {/* Step 1: Association Basics */}
      {currentStep === 1 && (
        <StepAssociationBasics
          initialData={{
            name: wizardData.name,
            abbreviation: wizardData.abbreviation,
            provinceState: wizardData.provinceState,
            country: wizardData.country,
            currency: wizardData.currency,
            season: wizardData.season,
            logoUrl: wizardData.logoUrl,
          }}
          onComplete={(data) => {
            setWizardData({ ...wizardData, ...data });
            setCurrentStep(2);
          }}
        />
      )}

      {/* Step 2: Admin Setup */}
      {currentStep === 2 && (
        <StepAdminSetup
          initialData={{
            adminName: wizardData.adminName,
            adminEmail: wizardData.adminEmail,
          }}
          onComplete={(data) => {
            setWizardData({ ...wizardData, ...data });
            setCurrentStep(3);
          }}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {/* Step 3: Board Members */}
      {currentStep === 3 && (
        <StepBoardMembers
          initialData={{
            boardMembers: wizardData.boardMembers,
          }}
          onComplete={(data) => {
            setWizardData({ ...wizardData, ...data });
            setCurrentStep(4);
          }}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {/* Step 4: Policies & Permissions */}
      {currentStep === 4 && (
        <StepDashboardConfig
          initialData={{
            budgetWarningPct: wizardData.budgetWarningPct,
            budgetCriticalPct: wizardData.budgetCriticalPct,
            bankWarningDays: wizardData.bankWarningDays,
            bankCriticalDays: wizardData.bankCriticalDays,
            approvalsWarningCount: wizardData.approvalsWarningCount,
            approvalsCriticalCount: wizardData.approvalsCriticalCount,
            inactivityWarningDays: wizardData.inactivityWarningDays,

            // Budget Update & Reporting Policy
            requireParentReapprovalOnBudgetChange: wizardData.requireParentReapprovalOnBudgetChange,
            parentReapprovalTotalBudgetChangeAmount: wizardData.parentReapprovalTotalBudgetChangeAmount,
            parentReapprovalTotalBudgetChangePercent: wizardData.parentReapprovalTotalBudgetChangePercent,
            parentReapprovalCategoryChangeAmount: wizardData.parentReapprovalCategoryChangeAmount,
            parentReapprovalCategoryChangePercent: wizardData.parentReapprovalCategoryChangePercent,
            parentReapprovalAlwaysIceFacilities: wizardData.parentReapprovalAlwaysIceFacilities,
            requireAssociationBudgetReports: wizardData.requireAssociationBudgetReports,
            associationBudgetReportFrequency: wizardData.associationBudgetReportFrequency,
            associationBudgetReportDueDay: wizardData.associationBudgetReportDueDay,

            // Report Schedules
            enableParentReports: wizardData.enableParentReports,
            enableAssociationReports: wizardData.enableAssociationReports,
            parentReportSchedule: wizardData.parentReportSchedule,
            associationReportSchedule: wizardData.associationReportSchedule,
          }}
          onComplete={(data) => {
            setWizardData({ ...wizardData, ...data });
            setCurrentStep(5);
          }}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {/* Step 5: Pre-Season Budget Configuration */}
      {currentStep === 5 && (
        <StepPreSeasonConfig
          initialData={{
            usePreSeasonBudgets: wizardData.usePreSeasonBudgets,
            preSeasonBudgetDeadline: wizardData.preSeasonBudgetDeadline,
            preSeasonBudgetsRequired: wizardData.preSeasonBudgetsRequired,
            preSeasonBudgetAutoApprove: wizardData.preSeasonBudgetAutoApprove,
          }}
          onComplete={async (data) => {
            try {
              const updatedData = { ...wizardData, ...data };
              setWizardData(updatedData);

              // Create the association via API with updated data
              await createAssociation(updatedData);
            } catch (error) {
              console.error('Error in onComplete:', error);
              // Error is already handled in createAssociation
            }
          }}
          onBack={() => setCurrentStep(4)}
          onSkip={async () => {
            // Skip pre-season budgets and create association
            const updatedData = {
              ...wizardData,
              usePreSeasonBudgets: false,
              preSeasonBudgetAutoApprove: false
            };
            setWizardData(updatedData);
            await createAssociation(updatedData);
          }}
        />
      )}

      {/* Step 6: Completion */}
      {currentStep === 6 && wizardData.associationId && (
        <AssociationCompletionScreen
          associationId={wizardData.associationId}
          associationName={wizardData.name}
          adminName={wizardData.adminName}
          usePreSeasonBudgets={wizardData.usePreSeasonBudgets}
        />
      )}
    </WizardLayout>
  );
}
