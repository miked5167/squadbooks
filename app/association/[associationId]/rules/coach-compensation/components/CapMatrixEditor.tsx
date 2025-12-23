'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { upsertCapLimits, deleteCapLimit, type CapLimitInput } from '../actions'

interface CapMatrixEditorProps {
  associationId: string
  policyId: string | null
  initialLimits: any[]
  onSaved?: () => void
  disabled?: boolean
}

const DEFAULT_AGE_GROUPS = ['U9', 'U11', 'U13', 'U15', 'U18']
const SKILL_LEVELS = ['A', 'AA', 'AAA'] as const

interface LimitRow {
  id?: string
  ageGroup: string
  skillLevel: string
  capAmountCents: number
  season: string | null
}

export function CapMatrixEditor({
  associationId,
  policyId,
  initialLimits,
  onSaved,
  disabled,
}: CapMatrixEditorProps) {
  const [limits, setLimits] = useState<LimitRow[]>([])
  const [customAgeGroup, setCustomAgeGroup] = useState('')
  const [season, setSeason] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize limits matrix
  useEffect(() => {
    const matrix: LimitRow[] = []

    // Filter limits for current season
    const seasonLimits = initialLimits.filter((l) => l.season === season)

    // Create grid for all age groups and skill levels
    DEFAULT_AGE_GROUPS.forEach((ageGroup) => {
      SKILL_LEVELS.forEach((skillLevel) => {
        const existing = seasonLimits.find(
          (l) => l.ageGroup === ageGroup && l.skillLevel === skillLevel
        )

        if (existing) {
          matrix.push({
            id: existing.id,
            ageGroup,
            skillLevel,
            capAmountCents: existing.capAmountCents,
            season,
          })
        } else {
          // Default: no cap (0 = unlimited)
          matrix.push({
            ageGroup,
            skillLevel,
            capAmountCents: 0,
            season,
          })
        }
      })
    })

    // Add any custom age groups from existing limits
    initialLimits
      .filter((l) => l.season === season && !DEFAULT_AGE_GROUPS.includes(l.ageGroup))
      .forEach((limit) => {
        if (!matrix.find((l) => l.ageGroup === limit.ageGroup && l.skillLevel === limit.skillLevel)) {
          matrix.push({
            id: limit.id,
            ageGroup: limit.ageGroup,
            skillLevel: limit.skillLevel,
            capAmountCents: limit.capAmountCents,
            season,
          })
        }
      })

    setLimits(matrix)
    setHasChanges(false)
  }, [initialLimits, season])

  const updateLimit = (ageGroup: string, skillLevel: string, capAmountCents: number) => {
    setLimits((prev) =>
      prev.map((l) =>
        l.ageGroup === ageGroup && l.skillLevel === skillLevel
          ? { ...l, capAmountCents }
          : l
      )
    )
    setHasChanges(true)
  }

  const addCustomAgeGroup = () => {
    if (!customAgeGroup.trim()) return

    const formatted = customAgeGroup.trim().toUpperCase()

    // Check if already exists
    if (limits.some((l) => l.ageGroup === formatted)) {
      toast.error('Age group already exists')
      return
    }

    // Add rows for all skill levels
    const newRows: LimitRow[] = SKILL_LEVELS.map((skillLevel) => ({
      ageGroup: formatted,
      skillLevel,
      capAmountCents: 0,
      season,
    }))

    setLimits((prev) => [...prev, ...newRows])
    setCustomAgeGroup('')
    setHasChanges(true)
    toast.success(`Added age group: ${formatted}`)
  }

  const removeAgeGroup = (ageGroup: string) => {
    setLimits((prev) => prev.filter((l) => l.ageGroup !== ageGroup))
    setHasChanges(true)
    toast.success(`Removed age group: ${ageGroup}`)
  }

  const handleSave = async () => {
    if (!policyId) {
      toast.error('Policy must be created first. Please save settings in the Settings tab.')
      return
    }

    setSaving(true)
    try {
      // Filter out limits with 0 caps (unlimited) to reduce database records
      const limitsToSave: CapLimitInput[] = limits
        .filter((l) => l.capAmountCents > 0)
        .map((l) => ({
          id: l.id,
          season: l.season,
          ageGroup: l.ageGroup,
          skillLevel: l.skillLevel,
          capAmountCents: l.capAmountCents,
        }))

      const result = await upsertCapLimits(associationId, limitsToSave)

      if (result.success) {
        toast.success('Cap limits saved successfully')
        setHasChanges(false)
        onSaved?.()
      } else {
        toast.error(result.error || 'Failed to save cap limits')
      }
    } catch (error) {
      console.error('Error saving cap limits:', error)
      toast.error('Failed to save cap limits')
    } finally {
      setSaving(false)
    }
  }

  // Group limits by age group
  const ageGroups = Array.from(new Set(limits.map((l) => l.ageGroup)))
    .sort((a, b) => {
      // Sort by numeric value if possible (U9, U11, etc.)
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toLocaleString()}`
  }

  const parseCurrency = (value: string): number => {
    const cleaned = value.replace(/[$,]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : Math.round(num * 100)
  }

  if (disabled) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please enable the policy in the Settings tab to configure cap limits.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Season Selector */}
      <div className="flex items-center gap-4">
        <Label>Season (optional)</Label>
        <Select
          value={season || 'default'}
          onValueChange={(val) => setSeason(val === 'default' ? null : val)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Default caps" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default caps (all seasons)</SelectItem>
            {/* TODO: Load actual seasons from association */}
          </SelectContent>
        </Select>
      </div>

      {/* Matrix Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Age Group</TableHead>
              {SKILL_LEVELS.map((level) => (
                <TableHead key={level} className="text-center">
                  {level}
                </TableHead>
              ))}
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ageGroups.map((ageGroup) => {
              const isCustom = !DEFAULT_AGE_GROUPS.includes(ageGroup)

              return (
                <TableRow key={ageGroup}>
                  <TableCell className="font-medium">
                    {ageGroup}
                    {isCustom && (
                      <Badge variant="outline" className="ml-2">
                        Custom
                      </Badge>
                    )}
                  </TableCell>

                  {SKILL_LEVELS.map((skillLevel) => {
                    const limit = limits.find(
                      (l) => l.ageGroup === ageGroup && l.skillLevel === skillLevel
                    )

                    return (
                      <TableCell key={skillLevel}>
                        <Input
                          type="text"
                          placeholder="No cap"
                          value={limit && limit.capAmountCents > 0 ? formatCurrency(limit.capAmountCents) : ''}
                          onChange={(e) => {
                            const cents = parseCurrency(e.target.value)
                            updateLimit(ageGroup, skillLevel, cents)
                          }}
                          className="text-center"
                        />
                      </TableCell>
                    )
                  })}

                  <TableCell>
                    {isCustom && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgeGroup(ageGroup)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Add Custom Age Group */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Label htmlFor="customAge">Add Custom Age Group</Label>
          <Input
            id="customAge"
            placeholder="e.g., U7, U21"
            value={customAgeGroup}
            onChange={(e) => setCustomAgeGroup(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addCustomAgeGroup()
              }
            }}
          />
        </div>
        <Button onClick={addCustomAgeGroup} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Age Group
        </Button>
      </div>

      {/* Help Text */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Tip:</strong> Leave a cell empty or enter $0 for no cap. Caps apply to the total
          coach compensation across all transactions for a team in a season.
        </AlertDescription>
      </Alert>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-4">
        <div>
          {hasChanges && (
            <Badge variant="secondary">Unsaved changes</Badge>
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
        >
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-pulse" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Cap Limits
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
