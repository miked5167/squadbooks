'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge, ChevronLeft, Sparkles, FileText } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportScheduleBuilder, type ReportSchedule } from './ReportScheduleBuilder';
import { ReceiptPolicyFields, type ReceiptPolicyFieldsData } from '@/components/shared/ReceiptPolicyFields';

interface StepDashboardConfigProps {
  onComplete: (data: DashboardConfigData) => void;
  onBack: () => void;
  initialData?: Partial<DashboardConfigData>;
}

interface DashboardConfigData {
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

  // Receipt Policy
  receiptsEnabled: boolean;
  receiptGlobalThresholdCents: number;
  receiptGracePeriodDays: number;
  allowedTeamThresholdOverride: boolean;
}

const RECOMMENDED_DEFAULTS: DashboardConfigData = {
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
  },
  associationReportSchedule: {
    recipient: 'ASSOCIATION',
    scheduleType: 'RECURRING',
    recurringFrequency: 'QUARTERLY',
    dueDay: 15,
    requireBudgetVsActual: true,
    requireBudgetChanges: true,
    requireCategoryBreakdown: true,
  },

  // Receipt Policy
  receiptsEnabled: true,
  receiptGlobalThresholdCents: 10000, // $100.00
  receiptGracePeriodDays: 7,
  allowedTeamThresholdOverride: false,
};

export function StepDashboardConfig({ onComplete, onBack, initialData }: StepDashboardConfigProps) {
  const [formData, setFormData] = useState<DashboardConfigData>({
    budgetWarningPct: initialData?.budgetWarningPct ?? RECOMMENDED_DEFAULTS.budgetWarningPct,
    budgetCriticalPct: initialData?.budgetCriticalPct ?? RECOMMENDED_DEFAULTS.budgetCriticalPct,
    bankWarningDays: initialData?.bankWarningDays ?? RECOMMENDED_DEFAULTS.bankWarningDays,
    bankCriticalDays: initialData?.bankCriticalDays ?? RECOMMENDED_DEFAULTS.bankCriticalDays,
    approvalsWarningCount: initialData?.approvalsWarningCount ?? RECOMMENDED_DEFAULTS.approvalsWarningCount,
    approvalsCriticalCount: initialData?.approvalsCriticalCount ?? RECOMMENDED_DEFAULTS.approvalsCriticalCount,
    inactivityWarningDays: initialData?.inactivityWarningDays ?? RECOMMENDED_DEFAULTS.inactivityWarningDays,

    // Budget Update & Reporting Policy
    requireParentReapprovalOnBudgetChange: initialData?.requireParentReapprovalOnBudgetChange ?? RECOMMENDED_DEFAULTS.requireParentReapprovalOnBudgetChange,
    parentReapprovalTotalBudgetChangeAmount: initialData?.parentReapprovalTotalBudgetChangeAmount ?? RECOMMENDED_DEFAULTS.parentReapprovalTotalBudgetChangeAmount,
    parentReapprovalTotalBudgetChangePercent: initialData?.parentReapprovalTotalBudgetChangePercent ?? RECOMMENDED_DEFAULTS.parentReapprovalTotalBudgetChangePercent,
    parentReapprovalCategoryChangeAmount: initialData?.parentReapprovalCategoryChangeAmount ?? RECOMMENDED_DEFAULTS.parentReapprovalCategoryChangeAmount,
    parentReapprovalCategoryChangePercent: initialData?.parentReapprovalCategoryChangePercent ?? RECOMMENDED_DEFAULTS.parentReapprovalCategoryChangePercent,
    parentReapprovalAlwaysIceFacilities: initialData?.parentReapprovalAlwaysIceFacilities ?? RECOMMENDED_DEFAULTS.parentReapprovalAlwaysIceFacilities,
    requireAssociationBudgetReports: initialData?.requireAssociationBudgetReports ?? RECOMMENDED_DEFAULTS.requireAssociationBudgetReports,
    associationBudgetReportFrequency: initialData?.associationBudgetReportFrequency ?? RECOMMENDED_DEFAULTS.associationBudgetReportFrequency,
    associationBudgetReportDueDay: initialData?.associationBudgetReportDueDay ?? RECOMMENDED_DEFAULTS.associationBudgetReportDueDay,

    // Report Schedules
    enableParentReports: initialData?.enableParentReports ?? RECOMMENDED_DEFAULTS.enableParentReports,
    enableAssociationReports: initialData?.enableAssociationReports ?? RECOMMENDED_DEFAULTS.enableAssociationReports,
    parentReportSchedule: initialData?.parentReportSchedule ?? RECOMMENDED_DEFAULTS.parentReportSchedule,
    associationReportSchedule: initialData?.associationReportSchedule ?? RECOMMENDED_DEFAULTS.associationReportSchedule,

    // Receipt Policy
    receiptsEnabled: initialData?.receiptsEnabled ?? RECOMMENDED_DEFAULTS.receiptsEnabled,
    receiptGlobalThresholdCents: initialData?.receiptGlobalThresholdCents ?? RECOMMENDED_DEFAULTS.receiptGlobalThresholdCents,
    receiptGracePeriodDays: initialData?.receiptGracePeriodDays ?? RECOMMENDED_DEFAULTS.receiptGracePeriodDays,
    allowedTeamThresholdOverride: initialData?.allowedTeamThresholdOverride ?? RECOMMENDED_DEFAULTS.allowedTeamThresholdOverride,
  });

  const [errors, setErrors] = useState<string[]>([]);

  const handleFieldChange = (field: keyof DashboardConfigData, value: number | boolean | string | null) => {
    setFormData({ ...formData, [field]: value });
    // Clear errors when user makes changes
    setErrors([]);
  };

  const useRecommended = () => {
    setFormData(RECOMMENDED_DEFAULTS);
    setErrors([]);
  };

  const validate = (): boolean => {
    const newErrors: string[] = [];

    // Validate parent reapproval triggers
    if (formData.requireParentReapprovalOnBudgetChange) {
      const hasTrigger =
        formData.parentReapprovalTotalBudgetChangeAmount !== null ||
        formData.parentReapprovalTotalBudgetChangePercent !== null ||
        formData.parentReapprovalCategoryChangeAmount !== null ||
        formData.parentReapprovalCategoryChangePercent !== null;

      if (!hasTrigger) {
        newErrors.push('At least one parent reapproval trigger must be set when requiring parent reapproval');
      }
    }

    // Validate association budget reports
    if (formData.requireAssociationBudgetReports) {
      if (!formData.associationBudgetReportFrequency) {
        newErrors.push('Report frequency is required when association budget reports are enabled');
      }

      if (
        formData.associationBudgetReportFrequency &&
        ['monthly', 'quarterly'].includes(formData.associationBudgetReportFrequency) &&
        !formData.associationBudgetReportDueDay
      ) {
        newErrors.push('Report due day is required for monthly and quarterly reporting');
      }

      if (
        formData.associationBudgetReportDueDay &&
        (formData.associationBudgetReportDueDay < 1 || formData.associationBudgetReportDueDay > 28)
      ) {
        newErrors.push('Report due day must be between 1 and 28');
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onComplete(formData);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl mb-4">
          <Gauge className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-3 font-bold text-navy mb-2">
          Policies & Permissions
        </h1>
        <p className="text-navy/70">
          Configure alert thresholds, budget policies, and reporting requirements for your teams
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Quick Action Button */}
            <Button
              type="button"
              variant="outline"
              onClick={useRecommended}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Use Recommended Settings
            </Button>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Budget Alerts</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetWarning">
                      Warning Threshold (%)
                    </Label>
                    <Input
                      id="budgetWarning"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.budgetWarningPct}
                      onChange={(e) => handleFieldChange('budgetWarningPct', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Alert when budget reaches this %</p>
                  </div>
                  <div>
                    <Label htmlFor="budgetCritical">
                      Critical Threshold (%)
                    </Label>
                    <Input
                      id="budgetCritical"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.budgetCriticalPct}
                      onChange={(e) => handleFieldChange('budgetCriticalPct', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Urgent alert at this %</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Transaction Review Alerts</h3>
              <p className="text-sm text-navy/70 mb-4">
                Alert when teams have imported transactions that haven't been reviewed or validated within the specified timeframe
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankWarning">
                      Warning (Days)
                    </Label>
                    <Input
                      id="bankWarning"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.bankWarningDays}
                      onChange={(e) => handleFieldChange('bankWarningDays', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Alert if unreviewed for this many days</p>
                  </div>
                  <div>
                    <Label htmlFor="bankCritical">
                      Critical (Days)
                    </Label>
                    <Input
                      id="bankCritical"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.bankCriticalDays}
                      onChange={(e) => handleFieldChange('bankCriticalDays', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Urgent alert threshold</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Pending Reviews Alerts</h3>
              <p className="text-sm text-navy/70 mb-4">
                Alert when teams have unreviewed transactions, missing receipts, or outstanding validations requiring attention
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="approvalsWarning">
                      Warning Count
                    </Label>
                    <Input
                      id="approvalsWarning"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.approvalsWarningCount}
                      onChange={(e) => handleFieldChange('approvalsWarningCount', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Alert at this many unreviewed items</p>
                  </div>
                  <div>
                    <Label htmlFor="approvalsCritical">
                      Critical Count
                    </Label>
                    <Input
                      id="approvalsCritical"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.approvalsCriticalCount}
                      onChange={(e) => handleFieldChange('approvalsCriticalCount', parseInt(e.target.value) || 0)}
                    />
                    <p className="text-xs text-navy/60 mt-1">Urgent alert threshold</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-navy mb-4">Team Inactivity Alert</h3>
              <div>
                <Label htmlFor="inactivityDays">
                  Inactivity Threshold (Days)
                </Label>
                <Input
                  id="inactivityDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.inactivityWarningDays}
                  onChange={(e) => handleFieldChange('inactivityWarningDays', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-navy/60 mt-1">
                  Alert if a team has no financial activity for this many days
                </p>
              </div>
            </div>

            {/* Budget Update & Reporting Policy */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-navy" />
                <h3 className="text-lg font-semibold text-navy">Budget Update & Reporting Policy</h3>
              </div>

              {/* Parent Reapproval Policy */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="requireParentReapproval" className="text-base font-medium">
                      Require parent re-approval on budget changes
                    </Label>
                    <p className="text-xs text-navy/60 mt-1">
                      Teams must re-present updated budgets to parents when changes exceed defined thresholds
                    </p>
                  </div>
                  <Switch
                    id="requireParentReapproval"
                    checked={formData.requireParentReapprovalOnBudgetChange}
                    onCheckedChange={(checked) => handleFieldChange('requireParentReapprovalOnBudgetChange', checked)}
                  />
                </div>

                {formData.requireParentReapprovalOnBudgetChange && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                    <p className="text-sm font-medium text-navy/80">Re-approval triggers (at least one required):</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="totalBudgetChangeAmount">
                          Total Budget Change ($)
                        </Label>
                        <Input
                          id="totalBudgetChangeAmount"
                          type="number"
                          min="0"
                          step="100"
                          placeholder="e.g., 1000"
                          value={formData.parentReapprovalTotalBudgetChangeAmount ?? ''}
                          onChange={(e) => handleFieldChange('parentReapprovalTotalBudgetChangeAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <p className="text-xs text-navy/60 mt-1">Dollar amount threshold</p>
                      </div>
                      <div>
                        <Label htmlFor="totalBudgetChangePercent">
                          Total Budget Change (%)
                        </Label>
                        <Input
                          id="totalBudgetChangePercent"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="e.g., 10"
                          value={formData.parentReapprovalTotalBudgetChangePercent ?? ''}
                          onChange={(e) => handleFieldChange('parentReapprovalTotalBudgetChangePercent', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <p className="text-xs text-navy/60 mt-1">Percentage threshold</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="categoryChangeAmount">
                          Category Change ($)
                        </Label>
                        <Input
                          id="categoryChangeAmount"
                          type="number"
                          min="0"
                          step="50"
                          placeholder="e.g., 500"
                          value={formData.parentReapprovalCategoryChangeAmount ?? ''}
                          onChange={(e) => handleFieldChange('parentReapprovalCategoryChangeAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <p className="text-xs text-navy/60 mt-1">Per-category threshold</p>
                      </div>
                      <div>
                        <Label htmlFor="categoryChangePercent">
                          Category Change (%)
                        </Label>
                        <Input
                          id="categoryChangePercent"
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          placeholder="e.g., 25"
                          value={formData.parentReapprovalCategoryChangePercent ?? ''}
                          onChange={(e) => handleFieldChange('parentReapprovalCategoryChangePercent', e.target.value ? parseFloat(e.target.value) : null)}
                        />
                        <p className="text-xs text-navy/60 mt-1">Per-category percentage</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Association Budget Reports */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="requireAssociationReports" className="text-base font-medium">
                      Require budget update reports to association
                    </Label>
                    <p className="text-xs text-navy/60 mt-1">
                      Teams must submit budget update reports to the association on a regular schedule
                    </p>
                  </div>
                  <Switch
                    id="requireAssociationReports"
                    checked={formData.requireAssociationBudgetReports}
                    onCheckedChange={(checked) => handleFieldChange('requireAssociationBudgetReports', checked)}
                  />
                </div>

                {formData.requireAssociationBudgetReports && (
                  <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="reportFrequency" className="required">
                          Report Frequency
                        </Label>
                        <Select
                          value={formData.associationBudgetReportFrequency || undefined}
                          onValueChange={(value) => handleFieldChange('associationBudgetReportFrequency', value as DashboardConfigData['associationBudgetReportFrequency'])}
                        >
                          <SelectTrigger id="reportFrequency">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="midseason_yearend">Mid-Season & Year-End</SelectItem>
                            <SelectItem value="yearend_only">Year-End Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.associationBudgetReportFrequency &&
                        ['monthly', 'quarterly'].includes(formData.associationBudgetReportFrequency) && (
                          <div>
                            <Label htmlFor="reportDueDay" className="required">
                              Report Due Day
                            </Label>
                            <Input
                              id="reportDueDay"
                              type="number"
                              min="1"
                              max="28"
                              placeholder="1-28"
                              value={formData.associationBudgetReportDueDay ?? ''}
                              onChange={(e) => handleFieldChange('associationBudgetReportDueDay', e.target.value ? parseInt(e.target.value) : null)}
                            />
                            <p className="text-xs text-navy/60 mt-1">Day of month (1-28)</p>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Report Schedules */}
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-navy mb-2">Enhanced Budget Report Schedules</h3>
                <p className="text-sm text-navy/60">
                  Configure detailed reporting schedules for parents and association with custom dates and content requirements
                </p>
              </div>

              {/* Parent Report Schedules */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="enableParentReports" className="text-base font-medium">
                      Enable Parent Report Schedules
                    </Label>
                    <p className="text-xs text-navy/60 mt-1">
                      Configure custom reporting schedules for parents with specific dates and content requirements
                    </p>
                  </div>
                  <Switch
                    id="enableParentReports"
                    checked={formData.enableParentReports}
                    onCheckedChange={(checked) => handleFieldChange('enableParentReports', checked)}
                  />
                </div>

                {formData.enableParentReports && formData.parentReportSchedule && (
                  <ReportScheduleBuilder
                    label="Parent Report Schedule"
                    schedule={formData.parentReportSchedule}
                    onChange={(schedule) => setFormData({ ...formData, parentReportSchedule: schedule })}
                    scheduleType="PARENT"
                  />
                )}
              </div>

              {/* Association Report Schedules */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label htmlFor="enableAssociationReports" className="text-base font-medium">
                      Enable Association Report Schedules
                    </Label>
                    <p className="text-xs text-navy/60 mt-1">
                      Configure custom reporting schedules for association oversight with specific dates and content requirements
                    </p>
                  </div>
                  <Switch
                    id="enableAssociationReports"
                    checked={formData.enableAssociationReports}
                    onCheckedChange={(checked) => handleFieldChange('enableAssociationReports', checked)}
                  />
                </div>

                {formData.enableAssociationReports && formData.associationReportSchedule && (
                  <ReportScheduleBuilder
                    label="Association Report Schedule"
                    schedule={formData.associationReportSchedule}
                    onChange={(schedule) => setFormData({ ...formData, associationReportSchedule: schedule })}
                    scheduleType="ASSOCIATION"
                  />
                )}
              </div>
            </div>

            {/* Receipt Policy */}
            <div className="border-t border-gray-200 pt-6">
              <ReceiptPolicyFields
                data={{
                  receiptsEnabled: formData.receiptsEnabled,
                  receiptGlobalThresholdCents: formData.receiptGlobalThresholdCents,
                  receiptGracePeriodDays: formData.receiptGracePeriodDays,
                  allowedTeamThresholdOverride: formData.allowedTeamThresholdOverride,
                }}
                onChange={(receiptData) => {
                  setFormData({
                    ...formData,
                    receiptsEnabled: receiptData.receiptsEnabled,
                    receiptGlobalThresholdCents: receiptData.receiptGlobalThresholdCents,
                    receiptGracePeriodDays: receiptData.receiptGracePeriodDays,
                    allowedTeamThresholdOverride: receiptData.allowedTeamThresholdOverride,
                  });
                }}
                compact={true}
              />
            </div>

            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Please fix the following errors:</p>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-navy/80">
                <span className="font-semibold">Note:</span> These thresholds can be adjusted
                later from your association settings. We recommend starting with the defaults
                and fine-tuning based on your needs.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-32"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <Button type="submit" size="lg" className="flex-1">
                Continue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
