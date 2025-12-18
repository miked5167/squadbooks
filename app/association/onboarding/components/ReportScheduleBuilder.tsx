'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

export interface ReportSchedule {
  recipient: 'PARENTS' | 'ASSOCIATION' | 'BOTH';
  scheduleType: 'RECURRING' | 'SPECIFIC_DATES' | 'HYBRID';
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';
  dueDay?: number;
  specificDates?: string[];
  requireBudgetVsActual: boolean;
  requireBudgetChanges: boolean;
  requireCategoryBreakdown: boolean;
}

interface ReportScheduleBuilderProps {
  schedule: ReportSchedule;
  onChange: (schedule: ReportSchedule) => void;
  label: string;
  scheduleType: 'PARENT' | 'ASSOCIATION';
}

export function ReportScheduleBuilder({ schedule, onChange, label, scheduleType }: ReportScheduleBuilderProps) {
  const [newDate, setNewDate] = useState('');

  // Determine valid recipient options based on schedule type
  const validRecipients = scheduleType === 'PARENT'
    ? ['PARENTS', 'BOTH'] as const
    : ['ASSOCIATION', 'BOTH'] as const;

  // Validate and auto-correct invalid recipient selection
  const currentRecipient = validRecipients.includes(schedule.recipient as any)
    ? schedule.recipient
    : (scheduleType === 'PARENT' ? 'PARENTS' : 'ASSOCIATION');

  const updateSchedule = (updates: Partial<ReportSchedule>) => {
    onChange({ ...schedule, ...updates });
  };

  // Auto-correct invalid recipient selection on mount or when schedule changes
  useEffect(() => {
    if (currentRecipient !== schedule.recipient) {
      updateSchedule({ recipient: currentRecipient });
    }
  }, [scheduleType]); // Only run when scheduleType changes

  const addSpecificDate = () => {
    if (newDate) {
      const dates = schedule.specificDates || [];
      updateSchedule({ specificDates: [...dates, newDate] });
      setNewDate('');
    }
  };

  const removeSpecificDate = (index: number) => {
    const dates = schedule.specificDates || [];
    updateSchedule({ specificDates: dates.filter((_, i) => i !== index) });
  };

  const showRecurringFields = schedule.scheduleType === 'RECURRING' || schedule.scheduleType === 'HYBRID';
  const showSpecificDatesFields = schedule.scheduleType === 'SPECIFIC_DATES' || schedule.scheduleType === 'HYBRID';

  return (
    <div className="space-y-6 border border-gray-200 rounded-lg p-6 bg-gray-50">
      <h4 className="text-md font-medium text-gray-900">{label}</h4>

      {/* Recipient Selection */}
      <div className="space-y-2">
        <Label>Report Recipient</Label>
        <Select
          value={currentRecipient}
          onValueChange={(value: 'PARENTS' | 'ASSOCIATION' | 'BOTH') =>
            updateSchedule({ recipient: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {scheduleType === 'PARENT' ? (
              <>
                <SelectItem value="PARENTS">Parents Only</SelectItem>
                <SelectItem value="BOTH">Both Parents and Association</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="ASSOCIATION">Association Only</SelectItem>
                <SelectItem value="BOTH">Both Parents and Association</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <p className="text-xs text-navy/60 mt-1">
          {scheduleType === 'PARENT'
            ? 'Parent reports are designed for families, with optional association visibility.'
            : 'Association reports are designed for oversight, with optional parent transparency.'}
        </p>
      </div>

      {/* Schedule Type Selection */}
      <div className="space-y-2">
        <Label>Schedule Type</Label>
        <Select
          value={schedule.scheduleType}
          onValueChange={(value: 'RECURRING' | 'SPECIFIC_DATES' | 'HYBRID') =>
            updateSchedule({ scheduleType: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RECURRING">Recurring Schedule (e.g., Monthly)</SelectItem>
            <SelectItem value="SPECIFIC_DATES">Specific Dates Only</SelectItem>
            <SelectItem value="HYBRID">Both Recurring and Specific Dates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recurring Schedule Fields */}
      {showRecurringFields && (
        <div className="space-y-4 pl-4 border-l-2 border-blue-200">
          <h5 className="text-sm font-medium text-gray-700">Recurring Schedule Settings</h5>

          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={schedule.recurringFrequency || ''}
              onValueChange={(value: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL') =>
                updateSchedule({ recurringFrequency: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="BIANNUAL">Bi-Annual (Twice per year)</SelectItem>
                <SelectItem value="ANNUAL">Annual (Once per year)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Day (1-28)</Label>
            <Input
              type="number"
              min="1"
              max="28"
              value={schedule.dueDay || ''}
              onChange={(e) => updateSchedule({ dueDay: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 15 for the 15th of the month"
            />
            <p className="text-xs text-gray-500">
              Day of the month when the report is due
            </p>
          </div>
        </div>
      )}

      {/* Specific Dates Fields */}
      {showSpecificDatesFields && (
        <div className="space-y-4 pl-4 border-l-2 border-green-200">
          <h5 className="text-sm font-medium text-gray-700">Specific Dates</h5>

          <div className="space-y-2">
            <Label>Add Specific Date</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <Button type="button" onClick={addSpecificDate} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {schedule.specificDates && schedule.specificDates.length > 0 && (
            <div className="space-y-2">
              <Label>Configured Dates</Label>
              <ul className="space-y-1">
                {schedule.specificDates.map((date, index) => (
                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">{new Date(date).toLocaleDateString()}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecificDate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Content Requirements */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-gray-700">Report Content Requirements</h5>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${label}-budget-vs-actual`}>Include Budget vs Actual Comparison</Label>
            <Switch
              id={`${label}-budget-vs-actual`}
              checked={schedule.requireBudgetVsActual}
              onCheckedChange={(checked) => updateSchedule({ requireBudgetVsActual: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`${label}-budget-changes`}>Include Budget Changes Summary</Label>
            <Switch
              id={`${label}-budget-changes`}
              checked={schedule.requireBudgetChanges}
              onCheckedChange={(checked) => updateSchedule({ requireBudgetChanges: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor={`${label}-category-breakdown`}>Include Category Breakdown</Label>
            <Switch
              id={`${label}-category-breakdown`}
              checked={schedule.requireCategoryBreakdown}
              onCheckedChange={(checked) => updateSchedule({ requireCategoryBreakdown: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
