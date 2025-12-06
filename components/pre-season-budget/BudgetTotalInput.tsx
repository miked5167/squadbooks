'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Info, DollarSign, Users } from 'lucide-react'
import type { PreSeasonBudgetData } from './BudgetWizard'

interface BudgetTotalInputProps {
  data: Partial<PreSeasonBudgetData>
  onChange: (data: Partial<PreSeasonBudgetData>) => void
}

export function BudgetTotalInput({ data, onChange }: BudgetTotalInputProps) {
  const handleChange = (field: keyof PreSeasonBudgetData, value: number) => {
    onChange({ [field]: value })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  const perPlayerCost = data.perPlayerCost || 0
  const showPerPlayer = data.totalBudget && data.projectedPlayers

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-navy mb-4">Budget Details</h3>
        <p className="text-sm text-navy/70 mb-6">
          Set your total budget and expected roster size. The per-player cost will
          be calculated automatically.
        </p>
      </div>

      <div className="space-y-6">
        {/* Total Budget */}
        <div>
          <Label htmlFor="totalBudget" className="text-navy">
            Total Budget <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1.5">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/40" />
            <Input
              id="totalBudget"
              type="number"
              step="0.01"
              min="0"
              max="1000000"
              value={data.totalBudget || ''}
              onChange={(e) =>
                handleChange('totalBudget', parseFloat(e.target.value) || 0)
              }
              placeholder="0.00"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-navy/60 mt-1">
            Total amount you plan to budget for the season
          </p>
        </div>

        {/* Projected Players */}
        <div>
          <Label htmlFor="projectedPlayers" className="text-navy">
            Projected Roster Size <span className="text-red-500">*</span>
          </Label>
          <div className="relative mt-1.5">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-navy/40" />
            <Input
              id="projectedPlayers"
              type="number"
              min="1"
              max="50"
              value={data.projectedPlayers || ''}
              onChange={(e) =>
                handleChange('projectedPlayers', parseInt(e.target.value) || 0)
              }
              placeholder="0"
              className="pl-10"
            />
          </div>
          <p className="text-xs text-navy/60 mt-1">
            How many players do you expect to have on the roster?
          </p>
        </div>

        {/* Per-Player Cost Display */}
        {showPerPlayer && (
          <Card className="bg-cream/50 border-gold/20 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-gold/10 p-3">
                <Info className="w-6 h-6 text-gold" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-navy mb-1">
                  Per-Player Cost
                </h4>
                <p className="text-2xl font-bold text-gold mb-2">
                  {formatCurrency(perPlayerCost)}
                </p>
                <p className="text-sm text-navy/70">
                  This is the approximate cost per player based on your total
                  budget and projected roster size. This will be displayed to
                  prospective parents when you publish your budget.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Budget Guidance */}
        <Card className="bg-navy/5 border-navy/10 p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-navy/60 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-navy mb-1">
                Budget Planning Tips
              </h4>
              <ul className="text-sm text-navy/70 space-y-1">
                <li>• Consider all expenses: ice time, equipment, tournaments, etc.</li>
                <li>• Account for fundraising revenue to offset costs</li>
                <li>• Add a 5-10% buffer for unexpected expenses</li>
                <li>• Check your association's budget guidelines if applicable</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
