'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar, ChevronLeft, ArrowRight } from 'lucide-react';

interface StepPreSeasonConfigProps {
  onComplete: (data: PreSeasonConfigData) => void;
  onBack: () => void;
  onSkip: () => void;
  initialData?: Partial<PreSeasonConfigData>;
}

interface PreSeasonConfigData {
  usePreSeasonBudgets: boolean;
  preSeasonBudgetDeadline?: string;
  preSeasonBudgetsRequired?: number;
  preSeasonBudgetAutoApprove: boolean;
}

export function StepPreSeasonConfig({
  onComplete,
  onBack,
  onSkip,
  initialData,
}: StepPreSeasonConfigProps) {
  const [formData, setFormData] = useState<PreSeasonConfigData>({
    usePreSeasonBudgets: initialData?.usePreSeasonBudgets ?? false,
    preSeasonBudgetDeadline: initialData?.preSeasonBudgetDeadline || getDefaultDeadline(),
    preSeasonBudgetsRequired: initialData?.preSeasonBudgetsRequired ?? 3,
    preSeasonBudgetAutoApprove: initialData?.preSeasonBudgetAutoApprove ?? false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // If not using pre-season budgets, pass minimal data
      if (!formData.usePreSeasonBudgets) {
        await onComplete({ usePreSeasonBudgets: false, preSeasonBudgetAutoApprove: false });
        return;
      }

      await onComplete(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl mb-4">
          <Calendar className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-display-3 font-bold text-navy mb-2">
          Pre-Season Budgets
        </h1>
        <p className="text-navy/70">
          Optional: Require teams to submit budgets before the season starts
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Enable Pre-Season Budgets Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-1 min-w-0">
                <Label htmlFor="enablePreSeason" className="text-base font-semibold">
                  Enable Pre-Season Budget Requirements
                </Label>
                <p className="text-sm text-navy/70 mt-1">
                  Require teams to submit and get approval for budgets before the season
                </p>
              </div>
              <div className="flex-shrink-0">
                <Switch
                  id="enablePreSeason"
                  checked={formData.usePreSeasonBudgets}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, usePreSeasonBudgets: checked })
                  }
                  className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                />
              </div>
            </div>

            {/* Configuration Options (only show if enabled) */}
            {formData.usePreSeasonBudgets && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold text-navy mb-4">Budget Requirements</h3>

                  {/* Submission Deadline */}
                  <div className="mb-4">
                    <Label htmlFor="deadline">
                      Submission Deadline
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.preSeasonBudgetDeadline}
                      onChange={(e) =>
                        setFormData({ ...formData, preSeasonBudgetDeadline: e.target.value })
                      }
                    />
                    <p className="text-xs text-navy/60 mt-1">
                      Teams must submit their budgets by this date
                    </p>
                  </div>

                  {/* Number of Budgets Required */}
                  <div className="mb-4">
                    <Label htmlFor="budgetsRequired">
                      Number of Budget Versions Required
                    </Label>
                    <Input
                      id="budgetsRequired"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.preSeasonBudgetsRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          preSeasonBudgetsRequired: parseInt(e.target.value) || 1,
                        })
                      }
                    />
                    <p className="text-xs text-navy/60 mt-1">
                      Typical: 3 budgets (Low/Medium/High scenarios)
                    </p>
                  </div>

                  {/* Auto-Approve Toggle */}
                  <div className="flex items-center justify-between gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <Label htmlFor="autoApprove" className="text-base">
                        Auto-Approve Budgets
                      </Label>
                      <p className="text-sm text-navy/70 mt-1">
                        Automatically approve budgets that meet criteria
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Switch
                        id="autoApprove"
                        checked={formData.preSeasonBudgetAutoApprove}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, preSeasonBudgetAutoApprove: checked })
                        }
                        className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-navy/80">
                    <span className="font-semibold">Note:</span> Pre-season budgets help ensure
                    teams plan ahead and stay within association guidelines. Teams can submit
                    multiple budget scenarios for board review.
                  </p>
                </div>
              </div>
            )}

            {/* Skip Message (only show if disabled) */}
            {!formData.usePreSeasonBudgets && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-navy/80">
                  You can enable pre-season budget requirements later from your association
                  settings. Teams will be able to manage budgets during the season without
                  pre-approval.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="w-32"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              {!formData.usePreSeasonBudgets && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSkip}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Association...' : 'Skip This Step'}
                  {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              )}
              <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Association...' : (formData.usePreSeasonBudgets ? 'Continue' : 'Continue Without Pre-Season Budgets')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper to get default deadline (e.g., August 15 of current year)
function getDefaultDeadline(): string {
  const now = new Date();
  const year = now.getFullYear();
  // Default to August 15 (typical pre-season deadline)
  return `${year}-08-15`;
}
