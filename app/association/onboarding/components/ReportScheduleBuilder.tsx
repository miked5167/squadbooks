'use client';

import { useState } from 'react';
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
  requireNarrative: boolean;
  narrativeMinLength?: number;
  narrativePrompts?: string[];
}

interface ReportScheduleBuilderProps {
  schedule: ReportSchedule;
  onChange: (schedule: ReportSchedule) => void;
  label: string;
}

export function ReportScheduleBuilder({ schedule, onChange, label }: ReportScheduleBuilderProps) {
  const [newDate, setNewDate] = useState('');
  const [newPrompt, setNewPrompt] = useState('');

  const updateSchedule = (updates: Partial<ReportSchedule>) => {
    onChange({ ...schedule, ...updates });
  };

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

  const addNarrativePrompt = () => {
    if (newPrompt) {
      const prompts = schedule.narrativePrompts || [];
      updateSchedule({ narrativePrompts: [...prompts, newPrompt] });
      setNewPrompt('');
    }
  };

  const removeNarrativePrompt = (index: number) => {
    const prompts = schedule.narrativePrompts || [];
    updateSchedule({ narrativePrompts: prompts.filter((_, i) => i !== index) });
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
          value={schedule.recipient}
          onValueChange={(value: 'PARENTS' | 'ASSOCIATION' | 'BOTH') =>
            updateSchedule({ recipient: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PARENTS">Parents Only</SelectItem>
            <SelectItem value="ASSOCIATION">Association Only</SelectItem>
            <SelectItem value="BOTH">Both Parents and Association</SelectItem>
          </SelectContent>
        </Select>
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

          <div className="flex items-center justify-between">
            <Label htmlFor={`${label}-narrative`}>Require Written Narrative</Label>
            <Switch
              id={`${label}-narrative`}
              checked={schedule.requireNarrative}
              onCheckedChange={(checked) => updateSchedule({ requireNarrative: checked })}
            />
          </div>
        </div>
      </div>

      {/* Narrative Configuration */}
      {schedule.requireNarrative && (
        <div className="space-y-4 pl-4 border-l-2 border-purple-200">
          <h5 className="text-sm font-medium text-gray-700">Narrative Requirements</h5>

          <div className="space-y-2">
            <Label>Minimum Length (characters)</Label>
            <Input
              type="number"
              min="0"
              value={schedule.narrativeMinLength || ''}
              onChange={(e) => updateSchedule({ narrativeMinLength: parseInt(e.target.value) || undefined })}
              placeholder="e.g., 200"
            />
          </div>

          <div className="space-y-2">
            <Label>Narrative Prompts</Label>
            <p className="text-xs text-gray-500">
              Add prompts or questions to guide the narrative writing
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="e.g., What were the biggest challenges this period?"
              />
              <Button type="button" onClick={addNarrativePrompt} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {schedule.narrativePrompts && schedule.narrativePrompts.length > 0 && (
            <div className="space-y-2">
              <Label>Configured Prompts</Label>
              <ul className="space-y-1">
                {schedule.narrativePrompts.map((prompt, index) => (
                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm">{prompt}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeNarrativePrompt(index)}
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
    </div>
  );
}
