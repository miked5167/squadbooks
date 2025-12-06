'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Loader2, Send, Save } from 'lucide-react'
import { toast } from 'sonner'
import type { PreSeasonBudgetData } from './BudgetWizard'

interface ReviewSummaryProps {
  data: PreSeasonBudgetData
  onComplete: (budgetId: string) => void
}

export function ReviewSummary({ data, onComplete }: ReviewSummaryProps) {
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount)
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/pre-season-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedTeamName: data.proposedTeamName,
          proposedSeason: data.proposedSeason,
          teamType: data.teamType,
          ageDivision: data.ageDivision,
          competitiveLevel: data.competitiveLevel,
          totalBudget: data.totalBudget,
          projectedPlayers: data.projectedPlayers,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create budget')
      }

      const result = await res.json()
      const budgetId = result.id

      // Save allocations
      const allocRes = await fetch(`/api/pre-season-budget/${budgetId}/allocations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocations: data.allocations.map((a) => ({
            categoryId: a.categoryId,
            allocated: a.allocated,
            notes: a.notes,
          })),
        }),
      })

      if (!allocRes.ok) {
        throw new Error('Failed to save allocations')
      }

      toast.success('Budget saved as draft')
      onComplete(budgetId)
    } catch (error) {
      console.error('Error saving draft:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const submitForApproval = async () => {
    setSubmitting(true)
    try {
      // First create the budget
      const res = await fetch('/api/pre-season-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposedTeamName: data.proposedTeamName,
          proposedSeason: data.proposedSeason,
          teamType: data.teamType,
          ageDivision: data.ageDivision,
          competitiveLevel: data.competitiveLevel,
          totalBudget: data.totalBudget,
          projectedPlayers: data.projectedPlayers,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create budget')
      }

      const result = await res.json()
      const budgetId = result.id

      // Save allocations
      const allocRes = await fetch(`/api/pre-season-budget/${budgetId}/allocations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allocations: data.allocations.map((a) => ({
            categoryId: a.categoryId,
            allocated: a.allocated,
            notes: a.notes,
          })),
        }),
      })

      if (!allocRes.ok) {
        throw new Error('Failed to save allocations')
      }

      // Submit for approval
      const submitRes = await fetch(`/api/pre-season-budget/${budgetId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!submitRes.ok) {
        throw new Error('Failed to submit for approval')
      }

      toast.success('Budget submitted for association approval!')
      onComplete(budgetId)
    } catch (error) {
      console.error('Error submitting:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-navy mb-4">Review & Submit</h3>
        <p className="text-sm text-navy/70 mb-6">
          Review your pre-season budget before saving or submitting for approval.
        </p>
      </div>

      {/* Team Info Summary */}
      <Card className="p-6">
        <h4 className="font-medium text-navy mb-4">Team Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-navy/60">Team Name</p>
            <p className="font-medium text-navy">{data.proposedTeamName}</p>
          </div>
          <div>
            <p className="text-sm text-navy/60">Season</p>
            <p className="font-medium text-navy">{data.proposedSeason}</p>
          </div>
          {data.teamType && (
            <div>
              <p className="text-sm text-navy/60">Type</p>
              <p className="font-medium text-navy">{data.teamType}</p>
            </div>
          )}
          {data.ageDivision && (
            <div>
              <p className="text-sm text-navy/60">Division</p>
              <p className="font-medium text-navy">{data.ageDivision}</p>
            </div>
          )}
          {data.competitiveLevel && (
            <div>
              <p className="text-sm text-navy/60">Level</p>
              <p className="font-medium text-navy">{data.competitiveLevel}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Budget Summary */}
      <Card className="p-6">
        <h4 className="font-medium text-navy mb-4">Budget Summary</h4>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-navy/70">Total Budget</span>
            <span className="font-bold text-navy">
              {formatCurrency(data.totalBudget)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-navy/70">Projected Players</span>
            <span className="font-medium text-navy">{data.projectedPlayers}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-navy/70">Per-Player Cost</span>
            <span className="font-bold text-gold">
              {formatCurrency(data.perPlayerCost)}
            </span>
          </div>
        </div>
      </Card>

      {/* Allocations Summary */}
      <Card className="p-6">
        <h4 className="font-medium text-navy mb-4">Budget Allocations</h4>
        <div className="space-y-2">
          {data.allocations
            .filter((a) => a.allocated > 0)
            .sort((a, b) => b.allocated - a.allocated)
            .map((allocation, index) => (
              <div key={index} className="flex justify-between items-center py-2">
                <span className="text-sm text-navy">{allocation.categoryName}</span>
                <span className="font-medium text-navy">
                  {formatCurrency(allocation.allocated)}
                </span>
              </div>
            ))}
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-medium">
            <span className="text-navy">Total Allocated</span>
            <div className="flex items-center gap-2">
              <span className="text-navy">
                {formatCurrency(
                  data.allocations.reduce((sum, a) => sum + a.allocated, 0)
                )}
              </span>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 border-navy/20"
          onClick={saveDraft}
          disabled={saving || submitting}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save as Draft
            </>
          )}
        </Button>
        <Button
          className="flex-1 bg-gold hover:bg-gold/90 text-white"
          onClick={submitForApproval}
          disabled={saving || submitting}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </>
          )}
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-navy/5 border-navy/10 p-4">
        <p className="text-sm text-navy/70">
          <strong>Next Steps:</strong> If you save as draft, you can continue
          editing. If you submit for approval, your association admin will review
          and either approve or reject your budget. Once approved, you can share
          the public link with prospective parents.
        </p>
      </Card>
    </div>
  )
}
