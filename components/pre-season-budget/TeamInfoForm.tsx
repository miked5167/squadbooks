'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PreSeasonBudgetData } from './BudgetWizard'

interface TeamInfoFormProps {
  data: Partial<PreSeasonBudgetData>
  onChange: (data: Partial<PreSeasonBudgetData>) => void
}

const TEAM_TYPES = [
  { value: 'HOUSE_LEAGUE', label: 'House League' },
  { value: 'REPRESENTATIVE', label: 'Representative' },
  { value: 'ADULT_RECREATIONAL', label: 'Adult Recreational' },
  { value: 'OTHER', label: 'Other' },
]

const AGE_DIVISIONS = [
  { value: 'U7', label: 'U7 (Under 7)' },
  { value: 'U9', label: 'U9 (Under 9)' },
  { value: 'U11', label: 'U11 (Under 11)' },
  { value: 'U13', label: 'U13 (Under 13)' },
  { value: 'U15', label: 'U15 (Under 15)' },
  { value: 'U18', label: 'U18 (Under 18)' },
  { value: 'OTHER', label: 'Other' },
]

const COMPETITIVE_LEVELS = [
  { value: 'AAA', label: 'AAA' },
  { value: 'AA', label: 'AA' },
  { value: 'A', label: 'A' },
  { value: 'BB', label: 'BB' },
  { value: 'B', label: 'B' },
  { value: 'MD', label: 'MD' },
  { value: 'HOUSE_RECREATIONAL', label: 'House/Recreational' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
  { value: 'OTHER', label: 'Other' },
]

export function TeamInfoForm({ data, onChange }: TeamInfoFormProps) {
  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1

  const handleChange = (field: keyof PreSeasonBudgetData, value: string) => {
    onChange({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-navy mb-4">Team Information</h3>
        <p className="text-sm text-navy/70 mb-6">
          Enter the basic details for your team. This budget will be created before
          your team officially exists in HuddleBooks.
        </p>
      </div>

      <div className="space-y-4">
        {/* Team Name */}
        <div>
          <Label htmlFor="teamName" className="text-navy">
            Team Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="teamName"
            value={data.proposedTeamName || ''}
            onChange={(e) => handleChange('proposedTeamName', e.target.value)}
            placeholder="e.g., Storm U12 AAA"
            className="mt-1.5"
            maxLength={100}
          />
          <p className="text-xs text-navy/60 mt-1">
            Enter the name you plan to use for your team
          </p>
        </div>

        {/* Season */}
        <div>
          <Label htmlFor="season" className="text-navy">
            Season <span className="text-red-500">*</span>
          </Label>
          <Select
            value={data.proposedSeason || ''}
            onValueChange={(value) => handleChange('proposedSeason', value)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={`${currentYear}-${nextYear}`}>
                {currentYear}-{nextYear}
              </SelectItem>
              <SelectItem value={`${nextYear}-${nextYear + 1}`}>
                {nextYear}-{nextYear + 1}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Team Type */}
          <div>
            <Label htmlFor="teamType" className="text-navy">
              Team Type
            </Label>
            <Select
              value={data.teamType || ''}
              onValueChange={(value) => handleChange('teamType', value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Age Division */}
          <div>
            <Label htmlFor="ageDivision" className="text-navy">
              Age Division
            </Label>
            <Select
              value={data.ageDivision || ''}
              onValueChange={(value) => handleChange('ageDivision', value)}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {AGE_DIVISIONS.map((div) => (
                  <SelectItem key={div.value} value={div.value}>
                    {div.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Competitive Level */}
        <div>
          <Label htmlFor="competitiveLevel" className="text-navy">
            Competitive Level
          </Label>
          <Select
            value={data.competitiveLevel || ''}
            onValueChange={(value) => handleChange('competitiveLevel', value)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {COMPETITIVE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
